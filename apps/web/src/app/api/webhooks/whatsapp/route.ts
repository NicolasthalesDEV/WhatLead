import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@wacrm/db";
import { ChatbotEngine, matchFlowByMessage } from "@/lib/chatbot/engine";
import { TriggerManager } from "@/lib/chatbot/triggers";
import { validateWebhook, markMessageAsRead, getMediaUrl } from "@/lib/wa/client";

/**
 * GET: Webhook verification
 * O WhatsApp envia uma requisição GET para verificar o webhook
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const validationResult = validateWebhook(
    mode || "",
    token || "",
    challenge || ""
  );

  if (validationResult) {
    return new Response(validationResult, { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

/**
 * POST: Webhook de mensagens recebidas
 * O WhatsApp envia eventos de mensagens, status, etc.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log("WhatsApp Webhook:", JSON.stringify(payload, null, 2));

    const entry = payload.entry?.[0];
    if (!entry) {
      return NextResponse.json({ received: true });
    }

    const changes = entry.changes?.[0];
    const value = changes?.value;

    // Processar mensagens recebidas
    if (value?.messages && value.messages.length > 0) {
      await processIncomingMessages(value);
    }

    // Processar status de mensagens enviadas
    if (value?.statuses && value.statuses.length > 0) {
      await processMessageStatuses(value);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing WhatsApp webhook:", error);
    // Sempre retornar 200 para evitar reenvios do WhatsApp
    return NextResponse.json({ received: true });
  }
}

/**
 * Processa mensagens recebidas dos clientes
 */
async function processIncomingMessages(value: any) {
  const messages = value.messages || [];
  const metadata = value.metadata;
  const businessPhoneNumberId = metadata?.phone_number_id;

  for (const message of messages) {
    try {
      const from = message.from; // Número do cliente (E.164 sem +)
      const messageId = message.id;
      const timestamp = message.timestamp;
      const messageType = message.type;

      // Extrair conteúdo baseado no tipo
      let messageText = "";
      let mediaUrl = "";
      let mediaType = "";

      switch (messageType) {
        case "text":
          messageText = message.text?.body || "";
          break;

        case "image":
          mediaType = "image";
          if (message.image?.id) {
            const media = await getMediaUrl(message.image.id);
            mediaUrl = media.url;
          }
          messageText = message.image?.caption || "";
          break;

        case "document":
          mediaType = "document";
          if (message.document?.id) {
            const media = await getMediaUrl(message.document.id);
            mediaUrl = media.url;
          }
          messageText = message.document?.caption || message.document?.filename || "";
          break;

        case "audio":
          mediaType = "audio";
          if (message.audio?.id) {
            const media = await getMediaUrl(message.audio.id);
            mediaUrl = media.url;
          }
          break;

        case "video":
          mediaType = "video";
          if (message.video?.id) {
            const media = await getMediaUrl(message.video.id);
            mediaUrl = media.url;
          }
          messageText = message.video?.caption || "";
          break;

        case "location":
          messageText = `Location: ${message.location?.latitude}, ${message.location?.longitude}`;
          break;

        case "contacts":
          messageText = `Contact shared: ${message.contacts?.[0]?.name?.formatted_name || "Unknown"}`;
          break;

        default:
          console.log(`Unsupported message type: ${messageType}`);
          continue;
      }

      // Buscar ou criar cliente
      let customer = await db.customer.findFirst({
        where: {
          phoneE164: from,
        },
        include: { company: true },
      });

      if (!customer) {
        // Cliente novo - buscar company pelo phoneNumberId do canal
        const channel = await db.whatsChannel.findUnique({
          where: {
            phoneNumberId: businessPhoneNumberId,
          },
        });

        let companyId: string;
        if (!channel) {
          // Se não houver canal configurado, usar a primeira company (MVP)
          const firstCompany = await db.company.findFirst();
          if (!firstCompany) {
            console.error("No company found in database");
            continue;
          }
          companyId = firstCompany.id;
        } else {
          companyId = channel.companyId;
        }

        customer = await db.customer.create({
          data: {
            phoneE164: from,
            name: `Cliente ${from.slice(-4)}`, // Nome temporário
            companyId: companyId,
          },
          include: { company: true },
        });

        console.log(`New customer created: ${customer.id}`);
      }

      const channel = businessPhoneNumberId
        ? await db.whatsChannel.findFirst({
            where: {
              phoneNumberId: businessPhoneNumberId,
              companyId: customer.companyId,
            },
            select: { id: true },
          })
        : null;

      if (!channel) {
        console.warn("No WhatsApp channel configured for incoming message", {
          businessPhoneNumberId,
          companyId: customer.companyId,
        });
        continue;
      }

      // Salvar mensagem no banco de dados
      const savedMessage = await db.whatsMessage.create({
        data: {
          companyId: customer.companyId,
          customerId: customer.id,
          channelId: channel.id,
          direction: "IN",
          type: messageType,
          body: messageText,
          status: "DELIVERED",
          raw: {
            whatsappMessageId: messageId,
            from,
            to: businessPhoneNumberId || null,
            timestamp,
            ...(mediaType && { mediaType }),
            ...(mediaUrl && { mediaUrl }),
            payload: message,
          },
        },
      });

      console.log(`Message saved: ${savedMessage.id}`);

      // Criar notificação para o novo mensagem recebida
      try {
        await db.notification.create({
          data: {
            companyId: customer.companyId,
            type: "whatsapp_message",
            title: `Nova mensagem de ${customer.name}`,
            message: messageText.length > 100 ? `${messageText.substring(0, 100)}...` : messageText,
            link: `/dashboard/whatsapp?customer=${customer.id}`,
            read: false,
            data: {
              customerId: customer.id,
              customerName: customer.name,
              messageId: savedMessage.id,
              messageType,
            },
          },
        });
        console.log(`Notification created for message from ${customer.name}`);
      } catch (error) {
        console.error("Error creating notification:", error);
      }

      // Marcar mensagem como lida
      try {
        await markMessageAsRead(messageId);
      } catch (error) {
        console.error("Error marking message as read:", error);
      }

      // Processar apenas mensagens de texto para chatbot
      if (messageType !== "text" || !messageText) {
        continue;
      }

      // 1. Verificar triggers de mensagem
      const triggerManager = new TriggerManager(customer.companyId);
      const triggeredFlow = await triggerManager.checkMessageTriggers(
        customer.id,
        messageText,
        savedMessage.id
      );

      if (triggeredFlow) {
        console.log("Flow triggered by trigger manager");
        continue; // Trigger manager já iniciou a execução
      }

      // 2. Verificar execução em andamento
      const chatbotExecution = (db as any).chatbotExecution;
      const activeExecution = chatbotExecution
        ? await chatbotExecution.findFirst({
            where: {
              customerId: customer.id,
              status: "WAITING_INPUT",
            },
            include: {
              flow: {
                include: { nodes: true },
              },
            },
          })
        : null;

      if (activeExecution) {
        // Continuar fluxo existente
        const engine = new ChatbotEngine(
          customer.companyId,
          customer.id,
          activeExecution.id
        );
        await engine.resume(messageText);
        console.log(`Flow resumed: ${activeExecution.flow.name}`);
        continue;
      }

      // 3. Tentar match por palavras-chave em flows ativos
      const matchedFlowId = await matchFlowByMessage(
        customer.companyId,
        messageText
      );

      if (matchedFlowId) {
        const executionId =
          globalThis.crypto?.randomUUID?.() ||
          `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const engine = new ChatbotEngine(
          customer.companyId,
          customer.id,
          executionId
        );
        await engine.start(matchedFlowId, messageText);
        console.log(`Flow matched and started: ${matchedFlowId}`);
        continue;
      }

      // 4. Nenhum fluxo encontrado - mensagem será tratada manualmente
      console.log(`No chatbot flow matched for message: "${messageText}"`);

      // TODO: Notificar equipe de atendimento sobre nova mensagem não tratada
    } catch (error) {
      console.error("Error processing individual message:", error);
    }
  }
}

/**
 * Processa atualizações de status de mensagens enviadas
 */
async function processMessageStatuses(value: any) {
  const statuses = value.statuses || [];

  for (const status of statuses) {
    try {
      const messageId = status.id;
      const statusValue = status.status; // sent, delivered, read, failed
      const timestamp = status.timestamp;
      // Atualizar status da mensagem no banco
      const updated = await db.whatsMessage.updateMany({
        where: {
          raw: {
            path: ["whatsappMessageId"],
            equals: messageId,
          },
        },
        data: {
          status: statusValue.toUpperCase(),
        },
      });

      if (updated.count > 0) {
        console.log(`Message ${messageId} status updated to ${statusValue}`);
      }

      // Se falhou, registrar erro
      if (statusValue === "failed" && status.errors) {
        console.error("Message delivery failed:", {
          messageId,
          errors: status.errors,
        });
      }
    } catch (error) {
      console.error("Error processing message status:", error);
    }
  }
}

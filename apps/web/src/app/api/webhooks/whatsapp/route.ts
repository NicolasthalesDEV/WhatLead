import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@wacrm/db";
import { ChatbotEngine } from "@/lib/chatbot/engine";
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
          OR: [
            { phone: from },
            { phoneE164: from },
          ],
        },
        include: { company: true },
      });

      if (!customer) {
        // Cliente novo - buscar company associada ao número de negócio
        let company = await db.company.findFirst({
          // TODO: Idealmente, vincular company ao businessPhoneNumberId
          // Para MVP, pega a primeira empresa
        });

        if (!company) {
          console.error("No company found to create customer");
          continue;
        }

        customer = await db.customer.create({
          data: {
            phone: from,
            phoneE164: from,
            name: `Cliente ${from.slice(-4)}`, // Nome temporário
            companyId: company.id,
          },
          include: { company: true },
        });

        console.log(`New customer created: ${customer.id}`);
      }

      // Salvar mensagem no banco de dados
      const savedMessage = await db.message.create({
        data: {
          externalId: messageId,
          direction: "INBOUND",
          from,
          to: businessPhoneNumberId || "",
          body: messageText,
          status: "DELIVERED",
          timestamp: new Date(parseInt(timestamp) * 1000),
          customerId: customer.id,
          companyId: customer.companyId,
          messageType: messageType.toUpperCase() as any,
          ...(mediaUrl && { mediaUrl }),
        },
      });

      console.log(`Message saved: ${savedMessage.id}`);

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
      const triggerManager = new TriggerManager(db);
      const triggeredFlow = await triggerManager.checkMessageTriggers(
        customer.companyId,
        customer.id,
        messageText
      );

      if (triggeredFlow) {
        console.log(`Flow triggered: ${triggeredFlow.name}`);
        continue; // Trigger manager já iniciou a execução
      }

      // 2. Verificar execução em andamento
      const activeExecution = await db.chatbotExecution.findFirst({
        where: {
          customerId: customer.id,
          status: "RUNNING",
        },
        include: {
          flow: {
            include: { nodes: true },
          },
        },
      });

      if (activeExecution) {
        // Continuar fluxo existente
        const engine = new ChatbotEngine(db, customer);
        await engine.resume(activeExecution.id, messageText);
        console.log(`Flow resumed: ${activeExecution.flow.name}`);
        continue;
      }

      // 3. Tentar match por palavras-chave em flows ativos
      const flows = await db.chatbotFlow.findMany({
        where: {
          companyId: customer.companyId,
          status: "ACTIVE",
        },
        include: { nodes: true },
      });

      const engine = new ChatbotEngine(db, customer);
      const matchedFlow = await engine.matchFlowByMessage(messageText, flows);

      if (matchedFlow) {
        await engine.start(matchedFlow.id);
        console.log(`Flow matched and started: ${matchedFlow.name}`);
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
      const recipientId = status.recipient_id;

      // Atualizar status da mensagem no banco
      const updated = await db.message.updateMany({
        where: {
          externalId: messageId,
        },
        data: {
          status: statusValue.toUpperCase() as any,
          ...(statusValue === "read" && { readAt: new Date(parseInt(timestamp) * 1000) }),
          ...(statusValue === "delivered" && { deliveredAt: new Date(parseInt(timestamp) * 1000) }),
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

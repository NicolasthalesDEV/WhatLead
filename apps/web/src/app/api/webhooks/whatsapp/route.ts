import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@wacrm/db";
import { ChatbotEngine, matchFlowByMessage, chatbotPreFlight, getChatbotFallbackMessage } from "@/lib/chatbot/engine";
import { TriggerManager } from "@/lib/chatbot/triggers";
import { validateWebhook, getMediaUrl } from "@/lib/wa/client";

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
    console.log("[WA Webhook] Received payload:", JSON.stringify(payload, null, 2));

    // Meta pode enviar múltiplos entries e múltiplos changes por payload
    const entries = payload.entry || [];
    if (entries.length === 0) {
      console.log("[WA Webhook] No entries in payload — ignoring");
      return NextResponse.json({ received: true });
    }

    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const value = change?.value;
        if (!value) continue;

        console.log("[WA Webhook] Processing change field:", change.field, "| phone_number_id:", value?.metadata?.phone_number_id);

        // Processar mensagens recebidas
        if (value?.messages && value.messages.length > 0) {
          console.log(`[WA Webhook] ${value.messages.length} message(s) to process`);
          await processIncomingMessages(value);
        }

        // Processar status de mensagens enviadas
        if (value?.statuses && value.statuses.length > 0) {
          console.log(`[WA Webhook] ${value.statuses.length} status update(s) to process`);
          await processMessageStatuses(value);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[WA Webhook] Error processing webhook:", error);
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
      // ───────────────────────────────────────────────────────────
      // 1. Buscar canal ANTES de qualquer outra operação.
      //    Meta envia phone_number_id no metadata — usamos isso para
      //    identificar qual empresa deve receber a mensagem.
      // ───────────────────────────────────────────────────────────
      const channel = businessPhoneNumberId
        ? await db.whatsChannel.findFirst({
            where: { phoneNumberId: businessPhoneNumberId },
            select: { id: true, companyId: true, waAccessToken: true, phoneNumberId: true },
          })
        : null;

      if (!channel) {
        console.warn("No WhatsApp channel found for phoneNumberId:", businessPhoneNumberId, "— message skipped");
        continue;
      }

      // ───────────────────────────────────────────────────────────
      // 2. Normalizar número do remetente.
      //    Meta envia sem '+' (ex: "5521912345678").
      //    Armazenamos sempre com '+' para consistência com o resto do
      //    sistema (E.164 canônico).
      // ───────────────────────────────────────────────────────────
      const rawFrom = message.from as string; // sem '+'
      const from = rawFrom.startsWith("+") ? rawFrom : "+" + rawFrom;

      const messageId = message.id;
      const timestamp = message.timestamp;
      const messageType = message.type;

      // ───────────────────────────────────────────────────────────
      // 3. Extrair conteúdo baseado no tipo.
      //    Passamos channel.waAccessToken para todas operações de mídia.
      // ───────────────────────────────────────────────────────────
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
            const media = await getMediaUrl(message.image.id, channel.waAccessToken);
            mediaUrl = media.url;
          }
          messageText = message.image?.caption || "";
          break;

        case "document":
          mediaType = "document";
          if (message.document?.id) {
            const media = await getMediaUrl(message.document.id, channel.waAccessToken);
            mediaUrl = media.url;
          }
          messageText = message.document?.caption || message.document?.filename || "";
          break;

        case "audio":
          mediaType = "audio";
          if (message.audio?.id) {
            const media = await getMediaUrl(message.audio.id, channel.waAccessToken);
            mediaUrl = media.url;
            // Transcrição de áudios com OpenAI Whisper
            let transcribeCompanyApiKey: string | undefined;
            try {
              const cs = await db.chatbotSettings.findUnique({
                where: { companyId: channel.companyId },
                select: { openaiApiKey: true },
              });
              transcribeCompanyApiKey = cs?.openaiApiKey || undefined;
            } catch { /* ignore */ }

            if (process.env.OPENAI_API_KEY || transcribeCompanyApiKey) {
              try {
                const { downloadMedia } = await import("@/lib/wa/client");
                const { transcribeAudio } = await import("@/lib/openai");
                const audioBuffer = Buffer.from(await downloadMedia(mediaUrl, channel.waAccessToken));
                const transcription = await transcribeAudio(
                  audioBuffer,
                  `audio.${media.mime_type?.includes("ogg") ? "ogg" : "mp3"}`,
                  "pt",
                  transcribeCompanyApiKey
                );
                if (transcription) {
                  messageText = `🎤 [Áudio transcrito]: ${transcription}`;
                  console.log(`Audio transcribed: "${transcription}"`);
                }
              } catch (transcribeErr) {
                console.error("Audio transcription failed:", transcribeErr);
                messageText = "🎤 [Mensagem de áudio recebida]";
              }
            } else {
              messageText = "🎤 [Mensagem de áudio recebida]";
            }
          }
          break;

        case "video":
          mediaType = "video";
          if (message.video?.id) {
            const media = await getMediaUrl(message.video.id, channel.waAccessToken);
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

      // ───────────────────────────────────────────────────────────
      // 4. Buscar ou criar cliente — SEMPRE filtrando pela empresa
      //    do canal para evitar dados cruzados entre tenants.
      // ───────────────────────────────────────────────────────────
      let customer = await db.customer.findFirst({
        where: {
          phoneE164: from,
          companyId: channel.companyId,
        },
        include: { Company: true },
      });

      if (!customer) {
        customer = await db.customer.create({
          data: {
            phoneE164: from,
            name: `Cliente ${from.slice(-4)}`, // Nome temporário
            companyId: channel.companyId,
          },
          include: { Company: true },
        });
        console.log(`New customer created: ${customer.id} (${from})`);
      }

      // Salvar mensagem no banco de dados
      const savedMessage = await db.whatsMessage.create({
        data: {
          companyId: channel.companyId,
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
        // Buscar o primeiro usuário da empresa para associar a notificação
        const companyUser = await db.user.findFirst({
          where: { companyId: channel.companyId },
          select: { id: true },
        });
        if (companyUser) {
          await db.notification.create({
            data: {
              userId: companyUser.id,
              companyId: channel.companyId,
              type: "whatsapp_message",
              title: `Nova mensagem de ${customer.name}`,
              message: messageText.length > 100 ? `${messageText.substring(0, 100)}...` : messageText,
              link: `/dashboard/whatsapp?customer=${customer.id}`,
              read: false,
            },
          });
          console.log(`Notification created for message from ${customer.name}`);
        }
      } catch (error) {
        console.error("Error creating notification:", error);
      }

      // Marcar mensagem como lida usando credenciais do canal
      try {
        const { buildWhatsAppClient } = await import("@/lib/wa/client");
        const wa = buildWhatsAppClient(channel.phoneNumberId, channel.waAccessToken);
        await wa.markRead(messageId);
      } catch (error) {
        console.error("Error marking message as read:", error);
      }

      // Processar apenas mensagens com conteúdo de texto para chatbot
      // (inclui áudios transcritos)
      if (!messageText.trim()) {
        continue;
      }

      // 0. Pre-flight: verificar configurações do chatbot
      const preFlight = await chatbotPreFlight(
        customer.companyId,
        customer.phoneE164,
        messageText
      );

      if (preFlight.blocked) {
        console.log(`Chatbot pre-flight blocked (${preFlight.reason}) for ${customer.phoneE164}`);
        if (preFlight.replyWith) {
          const { sendWhatsText } = await import("@/lib/wa/client");
          await sendWhatsText(customer.phoneE164, preFlight.replyWith).catch(
            (e: unknown) => console.error("Pre-flight reply failed:", e)
          );
        }
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
      const activeExecution = await db.chatbotExecution.findFirst({
        where: {
          customerId: customer.id,
          status: "WAITING_INPUT",
        },
        include: {
          ChatbotFlow: {
            include: { ChatbotNode: true },
          },
        },
      });

      if (activeExecution) {
        // Continuar fluxo existente
        const engine = new ChatbotEngine(
          customer.companyId,
          customer.id,
          activeExecution.id
        );
        await engine.resume(messageText);
        console.log(`Flow resumed: ${(activeExecution as any).ChatbotFlow?.name}`);
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

      // 4. Nenhum fluxo encontrado — tentar OpenAI se habilitado
      console.log(`No chatbot flow matched for message: "${messageText}"`);

      const chatbotSettings = await db.chatbotSettings.findUnique({
        where: { companyId: customer.companyId },
      });

      if (chatbotSettings?.openAIEnabled && (process.env.OPENAI_API_KEY || chatbotSettings.openaiApiKey)) {
        try {
          const { chatCompletion, buildSystemPrompt } = await import("@/lib/openai");
          const { sendWhatsText, sendWhatsAudio } = await import("@/lib/wa/client");

          // Build system prompt — custom overrides auto-built one
          const systemPrompt = chatbotSettings.openAISystemPrompt?.trim()
            ? chatbotSettings.openAISystemPrompt
            : buildSystemPrompt({
                botName: chatbotSettings.botName,
                botEmoji: chatbotSettings.botEmoji,
                tone: chatbotSettings.tone,
                companyName: customer.Company?.name,
                agentPersonality: chatbotSettings.agentPersonality ?? undefined,
                agentContext: chatbotSettings.agentContext ?? undefined,
                responseLength: chatbotSettings.responseLength,
              });

          // Strip audio transcription prefix for AI context
          const cleanMessage = messageText
            .replace(/^🎤 \[Áudio transcrito\]: /, "")
            .trim();

          // Fetch conversation history if context window > 0
          const contextCount = chatbotSettings.openAIContextMessages ?? 10;
          const history: { role: "user" | "assistant"; content: string }[] = [];
          if (contextCount > 0) {
            const pastMessages = await db.whatsMessage.findMany({
              where: {
                customerId: customer.id,
                companyId: customer.companyId,
                type: "text",
                body: { not: null },
              },
              orderBy: { createdAt: "desc" },
              take: contextCount,
              select: { direction: true, body: true },
            });
            // Reverse to chronological order
            pastMessages.reverse().forEach((m) => {
              if (m.body) {
                history.push({
                  role: m.direction === "IN" ? "user" : "assistant",
                  content: m.body,
                });
              }
            });
          }

          const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
            { role: "system", content: systemPrompt },
            ...history,
            { role: "user", content: cleanMessage },
          ];

          const reply = await chatCompletion(messages, {
            model: chatbotSettings.openAIModel || "gpt-4o-mini",
            temperature: chatbotSettings.openAITemperature ?? 0.7,
            maxTokens: chatbotSettings.openAIMaxTokens ?? 512,
            apiKey: chatbotSettings.openaiApiKey || undefined,
          });

          if (reply) {
            // If ElevenLabs + voice enabled, send audio reply
            if (
              chatbotSettings.elevenLabsEnabled &&
              (process.env.ELEVENLABS_API_KEY || chatbotSettings.elevenLabsApiKey)
            ) {
              try {
                const { textToSpeech } = await import("@/lib/elevenlabs");
                const audioBuffer = await textToSpeech(reply, {
                  voiceId: chatbotSettings.elevenLabsVoiceId || undefined,
                  modelId: chatbotSettings.elevenLabsModel || undefined,
                  stability: chatbotSettings.elevenLabsStability ?? undefined,
                  similarityBoost: chatbotSettings.elevenLabsSimilarity ?? undefined,
                  style: chatbotSettings.elevenLabsStyle ?? undefined,
                  apiKey: chatbotSettings.elevenLabsApiKey || undefined,
                });

                // Upload audio to get a public URL, then send
                const form = new FormData();
                form.append(
                  "file",
                  new Blob([new Uint8Array(audioBuffer)], { type: "audio/mpeg" }),
                  "reply.mp3"
                );
                const uploadRes = await fetch(
                  `${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/media/upload`,
                  { method: "POST", body: form }
                );

                if (uploadRes.ok) {
                  const { url } = await uploadRes.json();
                  await sendWhatsAudio(customer.phoneE164, url);
                  console.log(`AI voice reply sent to ${customer.phoneE164}`);
                } else {
                  // Fallback to text if upload fails
                  await sendWhatsText(customer.phoneE164, reply);
                }
              } catch (ttsErr) {
                console.error("ElevenLabs TTS failed, sending text:", ttsErr);
                await sendWhatsText(customer.phoneE164, reply);
              }
            } else {
              await sendWhatsText(customer.phoneE164, reply);
            }
            console.log(`OpenAI reply sent to ${customer.phoneE164}`);
          }
        } catch (aiErr) {
          console.error("OpenAI reply failed:", aiErr);
          // Fall through to regular fallback
          const fallback = await getChatbotFallbackMessage(customer.companyId);
          if (fallback) {
            const { sendWhatsText } = await import("@/lib/wa/client");
            await sendWhatsText(customer.phoneE164, fallback).catch(
              (e: unknown) => console.error("Fallback reply failed:", e)
            );
          }
        }
        continue;
      }

      // 5. Fallback padrão (sem OpenAI)
      const fallback = await getChatbotFallbackMessage(customer.companyId);
      if (fallback) {
        const { sendWhatsText } = await import("@/lib/wa/client");
        await sendWhatsText(customer.phoneE164, fallback).catch(
          (e: unknown) => console.error("Fallback reply failed:", e)
        );
      }
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

      // Buscar mensagens correspondentes para atualizar raw com erro, se necessário
      const existingMessages = await db.whatsMessage.findMany({
        where: {
          raw: {
            path: ["whatsappMessageId"],
            equals: messageId,
          },
        },
        select: { id: true, raw: true },
      });

      for (const msg of existingMessages) {
        const currentRaw = (msg.raw as Record<string, any>) || {};
        const newRaw: Record<string, any> = { ...currentRaw };

        // Se falhou, salva detalhes do erro no raw para exibição na UI
        if (statusValue === "failed" && status.errors?.length > 0) {
          const err = status.errors[0];
          newRaw.deliveryError = {
            code: err.code,
            title: err.title,
            message: err.message || err.title,
          };
          console.error(`[WA Webhook] Message ${messageId} delivery failed:`, err);
        }

        await db.whatsMessage.update({
          where: { id: msg.id },
          data: {
            status: statusValue.toLowerCase(),
            raw: newRaw,
          },
        });
      }

      if (existingMessages.length > 0) {
        console.log(`[WA Webhook] Message ${messageId} status updated to ${statusValue} (${existingMessages.length} record(s))`);
      }
    } catch (error) {
      console.error("Error processing message status:", error);
    }
  }
}

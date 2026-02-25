import { prisma } from "@wacrm/db";
import { buildWhatsAppClient } from "@/lib/wa/client";
import crypto from "crypto";

type NodeData = {
  message?: string;
  variable?: string;
  delay?: number;
  condition?: string;
  action?: string;
  flowId?: string;
  tags?: string[];
  apiUrl?: string;
  apiMethod?: string;
  apiBody?: any;
};

type Connection = {
  targetNodeId: string;
  condition?: string;
  label?: string;
};

type ExecutionContext = {
  customerId: string;
  messageId?: string;
  variables: Record<string, any>;
  lastInput?: string;
  msgCount?: number;
};

// ── Load chatbot settings (with defaults) ─────────────────
async function loadChatbotSettings(companyId: string) {
  const s = await prisma.chatbotSettings.findUnique({ where: { companyId } });
  return {
    botName: s?.botName ?? "Assistente",
    botEmoji: s?.botEmoji ?? "🤖",
    tone: s?.tone ?? "friendly",
    autoReplyEnabled: s?.autoReplyEnabled ?? true,
    typingDelay: s?.typingDelay ?? 1500,
    sessionTimeoutMinutes: s?.sessionTimeoutMinutes ?? 30,
    maxMessagesPerSession: s?.maxMessagesPerSession ?? 50,
    welcomeMessage: s?.welcomeMessage ?? "Olá! Como posso ajudar você hoje? 😊",
    farewellMessage: s?.farewellMessage ?? "Obrigado pelo contato! Até logo! 👋",
    unknownCommandMessage: s?.unknownCommandMessage ?? "Desculpe, não entendi. Poderia reformular sua pergunta?",
    offHoursEnabled: s?.offHoursEnabled ?? false,
    offHoursMessage: s?.offHoursMessage ?? "Estamos fora do horário de atendimento. Retornaremos em breve!",
    businessHoursStart: s?.businessHoursStart ?? "08:00",
    businessHoursEnd: s?.businessHoursEnd ?? "18:00",
    businessDays: (s?.businessDays as string[]) ?? ["MON","TUE","WED","THU","FRI"],
    handoffEnabled: s?.handoffEnabled ?? true,
    handoffKeyword: s?.handoffKeyword ?? "humano",
    handoffMessage: s?.handoffMessage ?? "Transferindo para um atendente humano...",
    // Personality / prompt settings
    language: s?.language ?? "pt-BR",
    agentPersonality: s?.agentPersonality ?? "",
    agentContext: s?.agentContext ?? "",
    responseLength: s?.responseLength ?? "normal",
  };
}

// ── Check if currently within business hours ──────────────
function isWithinBusinessHours(settings: Awaited<ReturnType<typeof loadChatbotSettings>>): boolean {
  const now = new Date();
  const dayNames = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
  const today = dayNames[now.getDay()];
  if (!settings.businessDays.includes(today)) return false;

  const [startH, startM] = settings.businessHoursStart.split(":").map(Number);
  const [endH, endM] = settings.businessHoursEnd.split(":").map(Number);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

// ── Public: check if currently outside business hours ───────────────────────
export async function isCurrentlyOffHours(companyId: string): Promise<boolean> {
  const settings = await loadChatbotSettings(companyId);
  return settings.offHoursEnabled && !isWithinBusinessHours(settings);
}

// ── Public helper: pre-flight checks before starting a new flow ──
export async function chatbotPreFlight(
  companyId: string,
  customerPhone: string,
  incomingMessage: string
): Promise<{ blocked: true; reason: string; replyWith?: string } | { blocked: false }> {
  const settings = await loadChatbotSettings(companyId);

  if (!settings.autoReplyEnabled) {
    return { blocked: true, reason: "auto_reply_disabled" };
  }

  // Check handoff keyword
  if (
    settings.handoffEnabled &&
    incomingMessage.toLowerCase().includes(settings.handoffKeyword.toLowerCase())
  ) {
    return { blocked: true, reason: "handoff_requested", replyWith: settings.handoffMessage };
  }

  // Check off-hours
  if (settings.offHoursEnabled && !isWithinBusinessHours(settings)) {
    return { blocked: true, reason: "off_hours", replyWith: settings.offHoursMessage };
  }

  return { blocked: false };
}

// ── Public: get fallback message when no flow matches ─────
export async function getChatbotFallbackMessage(companyId: string): Promise<string | null> {
  const s = await prisma.chatbotSettings.findUnique({ where: { companyId } });
  return s?.unknownCommandMessage ?? null;
}

// ── Public: get welcome message ───────────────────────────
export async function getChatbotWelcomeMessage(companyId: string): Promise<string | null> {
  const s = await prisma.chatbotSettings.findUnique({ where: { companyId } });
  return s?.welcomeMessage ?? null;
}


export class ChatbotEngine {
  private companyId: string;
  private customerId: string;
  private executionId: string;
  private context: ExecutionContext;
  private settings: Awaited<ReturnType<typeof loadChatbotSettings>> | null = null;

  constructor(companyId: string, customerId: string, executionId: string) {
    this.companyId = companyId;
    this.customerId = customerId;
    this.executionId = executionId;
    this.context = {
      customerId,
      variables: {},
    };
  }

  private async getSettings() {
    if (!this.settings) {
      this.settings = await loadChatbotSettings(this.companyId);
    }
    return this.settings;
  }

  /** Retorna cliente WhatsApp + dados do canal (necessário para salvar mensagens no DB) */
  private async getWaClientWithChannel() {
    const channel = await prisma.whatsChannel.findFirst({
      where: { companyId: this.companyId, status: 'ACTIVE' },
      select: { id: true, phoneNumberId: true, waAccessToken: true },
    });
    if (!channel) throw new Error(`No active WhatsApp channel for company ${this.companyId}`);
    return { wa: buildWhatsAppClient(channel.phoneNumberId, channel.waAccessToken), channel };
  }

  /** @deprecated use getWaClientWithChannel */
  private async getWaClient() {
    const { wa } = await this.getWaClientWithChannel();
    return wa;
  }

  async start(flowId: string, initialMessage?: string) {
    const flow = await prisma.chatbotFlow.findUnique({
      where: { id: flowId },
      include: { ChatbotNode: { orderBy: { order: "asc" } } },
    });

    if (!flow || (flow.status !== "ACTIVE" && !flow.active)) {
      throw new Error("Flow not found or not active");
    }

    const nodes = flow.ChatbotNode as any[];

    // Find the trigger node — se não existir, usa o primeiro nó pelo order
    const triggerNode =
      nodes.find((n: any) => n.type === "TRIGGER") ||
      [...nodes].sort((a, b) => a.order - b.order)[0];

    if (!triggerNode) {
      throw new Error("Flow has no nodes");
    }

    // Initialize execution
    await prisma.chatbotExecution.create({
      data: {
        id: this.executionId,
        flowId: flow.id,
        customerId: this.customerId,
        currentNode: triggerNode.id,
        context: this.context as any,
        status: "RUNNING",
      },
    });

    if (initialMessage) {
      this.context.lastInput = initialMessage;
    }

    // Start execution from trigger
    await this.executeNode(triggerNode, nodes);
  }

  async resume(userInput: string) {
    const execution = await prisma.chatbotExecution.findUnique({
      where: { id: this.executionId },
      include: {
        ChatbotFlow: {
          include: { ChatbotNode: { orderBy: { order: "asc" } } },
        },
      },
    });

    if (!execution || execution.status !== "WAITING_INPUT") {
      throw new Error("Execution not found or not waiting for input");
    }

    this.context = (execution.context as unknown as ExecutionContext) || {
      customerId: this.customerId,
      variables: {},
    };
    this.context.lastInput = userInput;

    // Track per-session message count and enforce maxMessagesPerSession
    this.context.msgCount = (this.context.msgCount ?? 0) + 1;
    const sessionSettings = await this.getSettings();
    if (this.context.msgCount >= sessionSettings.maxMessagesPerSession) {
      console.log(`Max messages per session (${sessionSettings.maxMessagesPerSession}) reached for execution ${this.executionId}`);
      if (sessionSettings.farewellMessage) {
        await this.sendMessage(sessionSettings.farewellMessage).catch((e: unknown) =>
          console.error("Farewell (max-messages) failed:", e)
        );
      }
      await prisma.chatbotExecution.update({
        where: { id: this.executionId },
        data: { status: "COMPLETED", completedAt: new Date(), context: this.context as any },
      });
      return;
    }

    const nodes = ((execution as any).ChatbotFlow?.ChatbotNode || []) as any[];
    const currentNode = nodes.find((n: any) => n.id === execution.currentNode);
    if (!currentNode) {
      throw new Error("Current node not found");
    }

    // Update execution status (include updated msgCount in context)
    await prisma.chatbotExecution.update({
      where: { id: this.executionId },
      data: {
        status: "RUNNING",
        context: this.context as any,
      },
    });

    // QUESTION nodes: don't re-execute (that would re-send the question).
    // Instead, store the user's answer in the named variable and advance.
    if (currentNode.type === "QUESTION") {
      const nodeData = ((currentNode.data || currentNode.config) ?? {}) as NodeData;
      const connections = (currentNode.connections || []) as Connection[];
      if (nodeData.variable && userInput) {
        this.context.variables[nodeData.variable] = userInput;
        await prisma.chatbotExecution.update({
          where: { id: this.executionId },
          data: { context: this.context as any },
        });
      }
      await this.goToNextNode(connections[0]?.targetNodeId, nodes);
      return;
    }

    await this.executeNode(currentNode, nodes);
  }

  private async executeNode(node: any, allNodes: any[]) {
    const nodeData = ((node.data || node.config) ?? {}) as NodeData;
    const connections = (node.connections || []) as Connection[];

    switch (node.type) {
      case "TRIGGER": {
        // Continue to next connected node.
        // If the trigger node has no explicit connection, jump to the first non-trigger node.
        const nextId =
          connections[0]?.targetNodeId ??
          allNodes.find((n: any) => n.type !== "TRIGGER" && n.id !== node.id)?.id;
        await this.goToNextNode(nextId, allNodes);
        break;
      }

      case "MESSAGE":
        await this.sendMessage(nodeData.message || "");
        await this.goToNextNode(connections[0]?.targetNodeId, allNodes);
        break;

      case "QUESTION":
        await this.sendMessage(nodeData.message || "");
        // Wait for user input
        await this.waitForInput(node.id);
        break;

      case "CONDITION":
        const result = await this.evaluateCondition(nodeData.condition || "");
        const targetConnection = connections.find((c) => c.condition === result.toString());
        await this.goToNextNode(targetConnection?.targetNodeId, allNodes);
        break;

      case "ACTION":
        await this.executeAction(nodeData.action || "", nodeData);
        await this.goToNextNode(connections[0]?.targetNodeId, allNodes);
        break;

      case "DELAY":
        await this.delay(nodeData.delay || 1000);
        await this.goToNextNode(connections[0]?.targetNodeId, allNodes);
        break;

      case "GOTO_FLOW":
        if (nodeData.flowId) {
          await this.jumpToFlow(nodeData.flowId);
        }
        break;

      case "API_CALL":
        await this.callExternalAPI(nodeData);
        await this.goToNextNode(connections[0]?.targetNodeId, allNodes);
        break;

      case "ASSIGN_TAG": {
        // tags may be stored as a comma-separated string from the editor
        const rawTags = nodeData.tags as unknown;
        const tagsArray: string[] = Array.isArray(rawTags)
          ? (rawTags as string[])
          : typeof rawTags === "string"
            ? (rawTags as string).split(",").map((t) => t.trim()).filter(Boolean)
            : [];
        await this.assignTags(tagsArray);
        await this.goToNextNode(connections[0]?.targetNodeId, allNodes);
        break;
      }

      // VIII – AI_RESPONSE: gera resposta via OpenAI GPT
      case "AI_RESPONSE": {
        const aiText = await this.generateAIResponse(nodeData);
        await this.sendMessage(aiText);
        await this.goToNextNode(connections[0]?.targetNodeId, allNodes);
        break;
      }

      // IV – VOICE_REPLY: envia resposta em voz via ElevenLabs
      case "VOICE_REPLY": {
        const textToSpeak = this.replaceVariables(nodeData.message || "");
        if (textToSpeak) {
          await this.sendVoiceMessage(textToSpeak, nodeData);
        }
        await this.goToNextNode(connections[0]?.targetNodeId, allNodes);
        break;
      }

      case "HANDOFF":
        await this.handoffToHuman();
        break;

      case "END_FLOW":
        await this.completeExecution(true);
        break;

      default:
        console.error(`Unknown node type: ${node.type}`);
        await this.completeExecution(false);
    }
  }

  private async goToNextNode(nodeId: string | undefined, allNodes: any[]) {
    if (!nodeId) {
      await this.completeExecution(false);
      return;
    }

    const nextNode = allNodes.find((n) => n.id === nodeId);
    if (!nextNode) {
      await this.completeExecution(false);
      return;
    }

    await prisma.chatbotExecution.update({
      where: { id: this.executionId },
      data: { currentNode: nodeId },
    });

    await this.executeNode(nextNode, allNodes);
  }

  private async sendMessage(message: string) {
    const processedMessage = this.replaceVariables(message);

    const customer = await prisma.customer.findUnique({
      where: { id: this.customerId },
    });

    if (!customer) return;

    // Apply typing delay
    const s = await this.getSettings();
    if (s.typingDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, s.typingDelay));
    }

    const { wa, channel } = await this.getWaClientWithChannel();
    const resp = await wa.sendText(customer.phoneE164, processedMessage);

    // Persist message so it appears in the chat UI
    try {
      await prisma.whatsMessage.create({
        data: {
          companyId: this.companyId,
          customerId: this.customerId,
          channelId: channel.id,
          direction: "OUT",
          type: "text",
          body: processedMessage,
          status: "sent",
          raw: {
            whatsappMessageId: resp.messages?.[0]?.id ?? null,
            automated: true,
            flowExecutionId: this.executionId,
          },
        },
      });
    } catch (dbErr) {
      // Non-fatal — message was already sent via WhatsApp
      console.error("[ChatbotEngine] Failed to persist bot message to DB:", dbErr);
    }
  }

  // VIII – Generate AI reply using OpenAI
  private async generateAIResponse(nodeData: NodeData): Promise<string> {
    try {
      const { chatCompletion, buildSystemPrompt, isOpenAIConfigured } = await import("@/lib/openai");

      // Load per-company API key from DB
      const cbRow = await prisma.chatbotSettings.findUnique({
        where: { companyId: this.companyId },
        select: { openaiApiKey: true, openAIModel: true, openAITemperature: true, openAIMaxTokens: true },
      });
      const companyApiKey = cbRow?.openaiApiKey || undefined;

      if (!isOpenAIConfigured(companyApiKey)) {
        console.warn("OpenAI not configured – returning fallback message");
        return nodeData.message || "No momento não consigo responder automaticamente.";
      }

      const s = await this.getSettings();

      // Build a contextual system prompt from chatbot settings
      const company = await prisma.company.findUnique({
        where: { id: this.companyId },
        select: { name: true },
      });

      const systemPrompt = (nodeData as any).systemPrompt || buildSystemPrompt({
        botName: s.botName,
        botEmoji: s.botEmoji,
        tone: s.tone,
        companyName: company?.name,
        agentPersonality: s.agentPersonality || undefined,
        agentContext: s.agentContext || undefined,
        responseLength: s.responseLength,
      });

      // Build conversation history from context variables
      const history = ((this.context.variables._aiHistory || []) as any[]).map(
        (m: any) => ({ role: m.role as "user" | "assistant", content: m.content as string })
      );

      const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: this.context.lastInput || (nodeData.message as string) || "Olá" },
      ];

      const reply = await chatCompletion(messages, {
        model: cbRow?.openAIModel || undefined,
        temperature: cbRow?.openAITemperature ?? undefined,
        maxTokens: cbRow?.openAIMaxTokens ?? undefined,
        apiKey: companyApiKey,
      });

      // Store in history
      this.context.variables._aiHistory = [
        ...history,
        { role: "user", content: this.context.lastInput || "" },
        { role: "assistant", content: reply },
      ].slice(-20); // keep last 20 messages

      return reply;
    } catch (err) {
      console.error("AI response error:", err);
      return nodeData.message || "Desculpe, ocorreu um erro ao processar sua mensagem.";
    }
  }

  // IV – Send voice message via ElevenLabs + WhatsApp upload
  private async sendVoiceMessage(text: string, nodeData: NodeData): Promise<void> {
    try {
      const { isElevenLabsConfigured, generateVoiceMessage } = await import("@/lib/elevenlabs");

      if (!isElevenLabsConfigured()) {
        console.warn("ElevenLabs not configured – sending as text instead");
        await this.sendMessage(text);
        return;
      }

      const customer = await prisma.customer.findUnique({
        where: { id: this.customerId },
      });

      if (customer) {
        const voiceId = (nodeData as any).voiceId as string | undefined;
        const { audioBuffer, mimeType } = await generateVoiceMessage(text, { voiceId });
        const wa = await this.getWaClient();
        const mediaId = await wa.uploadMedia(
          Buffer.from(audioBuffer),
          mimeType || "audio/mpeg",
          "voice.mp3"
        );
        await wa.sendAudio(customer.phoneE164, mediaId);
        console.log(`Voice message sent to ${customer.phoneE164}`);
      }
    } catch (err) {
      console.error("Voice message error:", err);
      // Fallback: send as text
      await this.sendMessage(text);
    }
  }

  private async waitForInput(currentNodeId: string) {
    await prisma.chatbotExecution.update({
      where: { id: this.executionId },
      data: {
        status: "WAITING_INPUT",
        currentNode: currentNodeId,
        context: this.context as any,
      },
    });
  }

  private async evaluateCondition(condition: string): Promise<boolean | string> {
    // Simple condition evaluation
    // Format: "variable == value" or "variable contains value"
    const lastInput = this.context.lastInput?.toLowerCase() || "";

    if (condition.includes("contains")) {
      const [, value] = condition.split("contains").map((s) => s.trim());
      return lastInput.includes(value.toLowerCase()) ? "true" : "false";
    }

    if (condition.includes("==")) {
      const [variable, value] = condition.split("==").map((s) => s.trim());
      const varValue = this.context.variables[variable] || lastInput;
      return varValue === value ? "true" : "false";
    }

    // Default: check if last input matches
    return lastInput.includes(condition.toLowerCase()) ? "true" : "false";
  }

  private async executeAction(action: string, data: NodeData) {
    switch (action) {
      case "save_variable":
        if (data.variable) {
          this.context.variables[data.variable] = this.context.lastInput;
        }
        break;

      case "create_quote":
        await this.createQuote(data);
        break;

      case "create_order":
        await this.createOrder(data);
        break;

      case "update_customer":
        await this.updateCustomer(data);
        break;

      default:
        console.log(`Action ${action} not implemented`);
    }

    await prisma.chatbotExecution.update({
      where: { id: this.executionId },
      data: { context: this.context as any },
    });
  }

  private async delay(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async jumpToFlow(flowId: string) {
    await this.completeExecution(false);
    await this.start(flowId);
  }

  private async callExternalAPI(data: NodeData) {
    try {
      const response = await fetch(data.apiUrl || "", {
        method: data.apiMethod || "GET",
        headers: { "Content-Type": "application/json" },
        body: data.apiBody ? JSON.stringify(data.apiBody) : undefined,
      });

      const result = await response.json();
      this.context.variables.apiResponse = result;

      await prisma.chatbotExecution.update({
        where: { id: this.executionId },
        data: { context: this.context as any },
      });
    } catch (error) {
      console.error("API call failed:", error);
      this.context.variables.apiError = String(error);
    }
  }

  private async assignTags(tags: string[]) {
    await prisma.customer.update({
      where: { id: this.customerId },
      data: {
        tags: {
          push: tags,
        },
      },
    });
  }

  private async handoffToHuman() {
    await prisma.chatbotExecution.update({
      where: { id: this.executionId },
      data: {
        status: "HANDOFF",
        completedAt: new Date(),
      },
    });

    // Send configured handoff message
    const customer = await prisma.customer.findUnique({
      where: { id: this.customerId },
    });

    if (customer) {
      const s = await this.getSettings();
      const handoffMsg = s.handoffMessage || "Vou transferir você para um de nossos atendentes. Aguarde um momento.";
      const { wa, channel } = await this.getWaClientWithChannel();
      await wa.sendText(customer.phoneE164, handoffMsg);
      // Persist so it appears in the chat UI
      await prisma.whatsMessage.create({
        data: {
          companyId: this.companyId,
          customerId: this.customerId,
          channelId: channel.id,
          direction: "OUT",
          type: "text",
          body: handoffMsg,
          status: "sent",
          raw: { automated: true, type: "handoff" },
        },
      }).catch((e: unknown) => console.error("Persist handoff message failed:", e));
    }
  }

  private async completeExecution(sendFarewell = false) {
    // Send farewell message only when flow explicitly ends (END_FLOW node)
    if (sendFarewell) {
      const s = await this.getSettings();
      if (s.farewellMessage) {
        await this.sendMessage(s.farewellMessage).catch((e: unknown) =>
          console.error("Farewell message failed:", e)
        );
      }
    }
    await prisma.chatbotExecution.update({
      where: { id: this.executionId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });
  }

  private replaceVariables(message: string): string {
    let processed = message;

    // Replace {{variable}} with actual values
    const matches = message.match(/\{\{([^}]+)\}\}/g);
    if (matches) {
      matches.forEach((match) => {
        const variable = match.replace(/[{}]/g, "");
        const value = this.context.variables[variable] || "";
        processed = processed.replace(match, value);
      });
    }

    return processed;
  }

  private async createQuote(data: NodeData) {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: this.customerId },
      });

      if (!customer) return;

      // Create quote with items from variables
      const items = this.context.variables.quoteItems || [];
      const total = items.reduce((sum: number, item: any) => sum + (item.qty * item.priceCents || 0), 0);

      const quote = await prisma.quote.create({
        data: {
          id: crypto.randomUUID(),
          companyId: customer.companyId,
          customerId: customer.id,
          status: "DRAFT",
          total,
          QuoteItem: {
            create: items.map((item: any) => ({
              id: crypto.randomUUID(),
              productId: item.productId,
              qty: item.qty,
              priceCents: item.priceCents,
            })),
          },
        },
      });

      this.context.variables.quoteId = quote.id;
      console.log(`Quote created: ${quote.id}`);
    } catch (error) {
      console.error("Failed to create quote:", error);
      this.context.variables.quoteError = error;
    }
  }

  private async createOrder(data: NodeData) {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: this.customerId },
      });

      if (!customer) return;

      // Create order with items from variables
      const items = this.context.variables.orderItems || [];
      const total = items.reduce((sum: number, item: any) => sum + (item.qty * item.priceCents || 0), 0);

      const order = await prisma.order.create({
        data: {
          id: crypto.randomUUID(),
          companyId: customer.companyId,
          customerId: customer.id,
          status: "PENDING",
          total,
          OrderItem: {
            create: items.map((item: any) => ({
              id: crypto.randomUUID(),
              productId: item.productId,
              qty: item.qty,
              priceCents: item.priceCents,
            })),
          },
        },
      });

      this.context.variables.orderId = order.id;
      console.log(`Order created: ${order.id}`);
    } catch (error) {
      console.error("Failed to create order:", error);
      this.context.variables.orderError = error;
    }
  }

  private async updateCustomer(data: NodeData) {
    try {
      const updates: any = {};

      // Update customer fields from variables
      if (this.context.variables.customerName) {
        updates.name = this.context.variables.customerName;
      }
      if (this.context.variables.customerEmail) {
        updates.email = this.context.variables.customerEmail;
      }
      if (this.context.variables.customerTags) {
        updates.tags = this.context.variables.customerTags;
      }

      if (Object.keys(updates).length > 0) {
        await prisma.customer.update({
          where: { id: this.customerId },
          data: updates,
        });
        console.log(`Customer updated: ${this.customerId}`);
      }
    } catch (error) {
      console.error("Failed to update customer:", error);
      this.context.variables.updateError = String(error);
    }
  }
}

// Helper function to match incoming messages with active flows
export async function matchFlowByMessage(
  companyId: string,
  message: string
): Promise<string | null> {
  const flows = await prisma.chatbotFlow.findMany({
    where: {
      companyId,
      OR: [{ status: "ACTIVE" }, { active: true }],
    },
    orderBy: { priority: "desc" },
  });

  const messageLower = message.toLowerCase();
  let catchAllFlowId: string | null = null;

  for (const flow of flows) {
    const keywords = (flow.triggerKeywords as string[]) || [];
    const triggerType = (flow as any).triggerType as string | undefined;

    // Flows with no keywords OR triggerType ALL_MESSAGES = catch-all (lower priority)
    if (keywords.length === 0 || triggerType === "ALL_MESSAGES") {
      if (!catchAllFlowId) catchAllFlowId = flow.id; // keep first (highest priority) catch-all
      continue;
    }

    // Keyword match
    for (const keyword of keywords) {
      if (keyword && messageLower.includes(keyword.toLowerCase())) {
        return flow.id;
      }
    }
  }

  // No keyword match — fall back to catch-all flow (if any)
  return catchAllFlowId;
}

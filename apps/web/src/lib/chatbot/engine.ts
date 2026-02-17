import { prisma } from "@wacrm/db";
import { sendWhatsText } from "@/lib/wa/client";

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
};

export class ChatbotEngine {
  private companyId: string;
  private customerId: string;
  private executionId: string;
  private context: ExecutionContext;

  constructor(companyId: string, customerId: string, executionId: string) {
    this.companyId = companyId;
    this.customerId = customerId;
    this.executionId = executionId;
    this.context = {
      customerId,
      variables: {},
    };
  }

  async start(flowId: string, initialMessage?: string) {
    const flow = await prisma.chatbotFlow.findUnique({
      where: { id: flowId },
      include: { nodes: true },
    });

    if (!flow || flow.status !== "ACTIVE") {
      throw new Error("Flow not found or not active");
    }

    // Find the trigger node
    const triggerNode = flow.nodes.find((n) => n.type === "TRIGGER");
    if (!triggerNode) {
      throw new Error("Flow has no trigger node");
    }

    // Initialize execution
    await prisma.chatbotExecution.create({
      data: {
        id: this.executionId,
        flowId: flow.id,
        customerId: this.customerId,
        currentNode: triggerNode.id,
        context: this.context,
        status: "RUNNING",
      },
    });

    if (initialMessage) {
      this.context.lastInput = initialMessage;
    }

    // Start execution from trigger
    await this.executeNode(triggerNode, flow.nodes);
  }

  async resume(userInput: string) {
    const execution = await prisma.chatbotExecution.findUnique({
      where: { id: this.executionId },
      include: { flow: { include: { nodes: true } } },
    });

    if (!execution || execution.status !== "WAITING_INPUT") {
      throw new Error("Execution not found or not waiting for input");
    }

    this.context = execution.context as ExecutionContext;
    this.context.lastInput = userInput;

    const currentNode = execution.flow.nodes.find((n) => n.id === execution.currentNode);
    if (!currentNode) {
      throw new Error("Current node not found");
    }

    // Update execution
    await prisma.chatbotExecution.update({
      where: { id: this.executionId },
      data: {
        status: "RUNNING",
        context: this.context,
      },
    });

    await this.executeNode(currentNode, execution.flow.nodes);
  }

  private async executeNode(node: any, allNodes: any[]) {
    const nodeData = node.data as NodeData;
    const connections = node.connections as Connection[];

    switch (node.type) {
      case "TRIGGER":
        // Just continue to next node
        await this.goToNextNode(connections[0]?.targetNodeId, allNodes);
        break;

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

      case "ASSIGN_TAG":
        await this.assignTags(nodeData.tags || []);
        await this.goToNextNode(connections[0]?.targetNodeId, allNodes);
        break;

      case "HANDOFF":
        await this.handoffToHuman();
        break;

      case "END_FLOW":
        await this.completeExecution();
        break;

      default:
        console.error(`Unknown node type: ${node.type}`);
        await this.completeExecution();
    }
  }

  private async goToNextNode(nodeId: string | undefined, allNodes: any[]) {
    if (!nodeId) {
      await this.completeExecution();
      return;
    }

    const nextNode = allNodes.find((n) => n.id === nodeId);
    if (!nextNode) {
      await this.completeExecution();
      return;
    }

    await prisma.chatbotExecution.update({
      where: { id: this.executionId },
      data: { currentNode: nodeId },
    });

    await this.executeNode(nextNode, allNodes);
  }

  private async sendMessage(message: string) {
    // Replace variables in message
    const processedMessage = this.replaceVariables(message);

    const customer = await prisma.customer.findUnique({
      where: { id: this.customerId },
    });

    if (customer) {
      await sendWhatsText(customer.phoneE164, processedMessage);
    }
  }

  private async waitForInput(currentNodeId: string) {
    await prisma.chatbotExecution.update({
      where: { id: this.executionId },
      data: {
        status: "WAITING_INPUT",
        currentNode: currentNodeId,
        context: this.context,
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
        // TODO: Create quote logic
        break;

      case "create_order":
        // TODO: Create order logic
        break;

      case "update_customer":
        // TODO: Update customer logic
        break;

      default:
        console.log(`Action ${action} not implemented`);
    }

    await prisma.chatbotExecution.update({
      where: { id: this.executionId },
      data: { context: this.context },
    });
  }

  private async delay(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async jumpToFlow(flowId: string) {
    await this.completeExecution();
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
        data: { context: this.context },
      });
    } catch (error) {
      console.error("API call failed:", error);
      this.context.variables.apiError = error;
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

    // Send message to notify handoff
    const customer = await prisma.customer.findUnique({
      where: { id: this.customerId },
    });

    if (customer) {
      await sendWhatsText(
        customer.phoneE164,
        "Vou transferir você para um de nossos atendentes. Aguarde um momento."
      );
    }
  }

  private async completeExecution() {
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
}

// Helper function to match incoming messages with flows
export async function matchFlowByMessage(
  companyId: string,
  message: string
): Promise<string | null> {
  const flows = await prisma.chatbotFlow.findMany({
    where: {
      companyId,
      status: "ACTIVE",
    },
    orderBy: { priority: "desc" },
  });

  const messageLower = message.toLowerCase();

  for (const flow of flows) {
    for (const trigger of flow.triggers) {
      if (messageLower.includes(trigger.toLowerCase())) {
        return flow.id;
      }
    }
  }

  return null;
}

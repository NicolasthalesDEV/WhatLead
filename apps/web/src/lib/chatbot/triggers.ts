import { prisma } from "@wacrm/db";
import { ChatbotEngine } from "./engine";
import crypto from "crypto";

type TriggerConditions = {
  keywords?: string[];
  customerStatus?: string;
  orderStatus?: string;
  timeOfDay?: { start: string; end: string };
  dayOfWeek?: number[];
  customerTags?: string[];
  idleMinutes?: number;
};

export class TriggerManager {
  private companyId: string;

  constructor(companyId: string) {
    this.companyId = companyId;
  }

  // Check if message should trigger any chatbot flow
  async checkMessageTriggers(customerId: string, message: string, messageId: string) {
    const triggers = await prisma.chatbotTrigger.findMany({
      where: {
        companyId: this.companyId,
        enabled: true,
        type: { in: ["MESSAGE_RECEIVED", "KEYWORD"] },
      },
      orderBy: { priority: "desc" },
    });

    for (const trigger of triggers) {
      const conditions = trigger.conditions as TriggerConditions;
      
      if (trigger.type === "KEYWORD" && conditions.keywords) {
        const messageLower = message.toLowerCase();
        const matched = conditions.keywords.some((keyword) =>
          messageLower.includes(keyword.toLowerCase())
        );

        if (matched) {
          await this.executeTrigger(trigger.flowId, customerId, messageId);
          return true;
        }
      }

      if (trigger.type === "MESSAGE_RECEIVED") {
        await this.executeTrigger(trigger.flowId, customerId, messageId);
        return true;
      }
    }

    return false;
  }

  // Check triggers when a new customer is created
  async checkNewCustomerTriggers(customerId: string) {
    const triggers = await prisma.chatbotTrigger.findMany({
      where: {
        companyId: this.companyId,
        enabled: true,
        type: "NEW_CUSTOMER",
      },
    });

    for (const trigger of triggers) {
      await this.executeTrigger(trigger.flowId, customerId);
    }
  }

  // Check triggers when an order is created
  async checkOrderCreatedTriggers(customerId: string, orderId: string) {
    const triggers = await prisma.chatbotTrigger.findMany({
      where: {
        companyId: this.companyId,
        enabled: true,
        type: "ORDER_CREATED",
      },
    });

    for (const trigger of triggers) {
      await this.executeTrigger(trigger.flowId, customerId, undefined, { orderId });
    }
  }

  // Check triggers when payment is confirmed
  async checkOrderPaidTriggers(customerId: string, orderId: string) {
    const triggers = await prisma.chatbotTrigger.findMany({
      where: {
        companyId: this.companyId,
        enabled: true,
        type: "ORDER_PAID",
      },
    });

    for (const trigger of triggers) {
      await this.executeTrigger(trigger.flowId, customerId, undefined, { orderId });
    }
  }

  // Check triggers for idle customers (call this from a cron job)
  async checkIdleCustomerTriggers() {
    const triggers = await prisma.chatbotTrigger.findMany({
      where: {
        companyId: this.companyId,
        enabled: true,
        type: "CUSTOMER_IDLE",
      },
    });

    for (const trigger of triggers) {
      const conditions = trigger.conditions as TriggerConditions;
      const idleMinutes = conditions.idleMinutes || 60;

      // Find customers who haven't received a message in X minutes
      const idleCustomers = await prisma.customer.findMany({
        where: {
          companyId: this.companyId,
          messages: {
            none: {
              createdAt: {
                gte: new Date(Date.now() - idleMinutes * 60 * 1000),
              },
            },
          },
        },
        take: 100, // Limit to prevent overload
      });

      for (const customer of idleCustomers) {
        await this.executeTrigger(trigger.flowId, customer.id);
      }
    }
  }

  // Check time-based triggers (call this from a cron job)
  async checkTimeBasedTriggers() {
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
    const dayOfWeek = now.getDay();

    const triggers = await prisma.chatbotTrigger.findMany({
      where: {
        companyId: this.companyId,
        enabled: true,
        type: "TIME_BASED",
      },
    });

    for (const trigger of triggers) {
      const conditions = trigger.conditions as TriggerConditions;

      // Check if current time matches
      if (conditions.timeOfDay) {
        const isTimeMatch =
          timeString >= conditions.timeOfDay.start && timeString <= conditions.timeOfDay.end;

        if (!isTimeMatch) continue;
      }

      // Check if current day matches
      if (conditions.dayOfWeek && !conditions.dayOfWeek.includes(dayOfWeek)) {
        continue;
      }

      // Get customers matching criteria
      const customers = await this.getCustomersForTrigger(conditions);

      for (const customer of customers) {
        await this.executeTrigger(trigger.flowId, customer.id);
      }
    }
  }

  // Check funnel stage triggers
  async checkFunnelStageTriggers(customerId: string, stageId: string) {
    const triggers = await prisma.chatbotTrigger.findMany({
      where: {
        companyId: this.companyId,
        enabled: true,
        type: "FUNNEL_STAGE",
      },
    });

    for (const trigger of triggers) {
      const conditions = trigger.conditions as any;
      if (conditions.stageId === stageId) {
        await this.executeTrigger(trigger.flowId, customerId);
      }
    }
  }

  // Execute custom event trigger
  async triggerCustomEvent(eventName: string, customerId: string, metadata?: any) {
    const triggers = await prisma.chatbotTrigger.findMany({
      where: {
        companyId: this.companyId,
        enabled: true,
        type: "CUSTOM_EVENT",
      },
    });

    for (const trigger of triggers) {
      const conditions = trigger.conditions as any;
      if (conditions.eventName === eventName) {
        await this.executeTrigger(trigger.flowId, customerId, undefined, metadata);
      }
    }
  }

  private async executeTrigger(
    flowId: string,
    customerId: string,
    messageId?: string,
    metadata?: any
  ) {
    // Check if there's already an active execution for this customer
    const activeExecution = await prisma.chatbotExecution.findFirst({
      where: {
        customerId,
        status: { in: ["RUNNING", "WAITING_INPUT"] },
      },
    });

    if (activeExecution) {
      // Don't start a new flow if one is already running
      return;
    }

    const executionId = crypto.randomUUID();
    const engine = new ChatbotEngine(this.companyId, customerId, executionId);

    try {
      await engine.start(flowId);

      // Update analytics
      await this.updateAnalytics(flowId);
    } catch (error) {
      console.error("Failed to execute chatbot flow:", error);
      
      await prisma.chatbotExecution.update({
        where: { id: executionId },
        data: { status: "FAILED", completedAt: new Date() },
      });
    }
  }

  private async getCustomersForTrigger(conditions: TriggerConditions) {
    const whereClause: any = {
      companyId: this.companyId,
    };

    if (conditions.customerTags && conditions.customerTags.length > 0) {
      whereClause.tags = {
        hasSome: conditions.customerTags,
      };
    }

    return prisma.customer.findMany({
      where: whereClause,
      take: 100,
    });
  }

  private async updateAnalytics(flowId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.chatbotAnalytics.upsert({
      where: {
        companyId_flowId_date: {
          companyId: this.companyId,
          flowId,
          date: today,
        },
      },
      create: {
        companyId: this.companyId,
        flowId,
        date: today,
        totalExecutions: 1,
      },
      update: {
        totalExecutions: { increment: 1 },
      },
    });
  }
}

// Background job to process time-based and idle triggers
export async function processScheduledTriggers() {
  const companies = await prisma.company.findMany({
    select: { id: true },
  });

  for (const company of companies) {
    const manager = new TriggerManager(company.id);
    
    await manager.checkTimeBasedTriggers();
    await manager.checkIdleCustomerTriggers();
  }
}

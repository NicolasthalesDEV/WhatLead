/**
 * Shared BullMQ queue clients.
 *
 * Import from here in both the worker (producers + consumers)
 * and from the Next.js app (producers only) to push jobs.
 */
import { Queue } from "bullmq";
import IORedis from "ioredis";

export const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

export const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  retryStrategy: (times) => {
    if (times > 3) return null;
    return Math.min(times * 500, 2000);
  },
  enableOfflineQueue: false,
});

connection.on("error", (err) => {
  if ((err as any).code !== "ECONNREFUSED") {
    console.warn("[queue] Redis error:", err.message);
  }
});

export const prefix = process.env.BULLMQ_PREFIX || "wacrm";

// ── Job type definitions ────────────────────────────────────

/** Outbound WhatsApp message to be sent asynchronously */
export interface MessageJob {
  companyId: string;
  customerId: string;
  channelId: string;
  to: string; // E.164 phone number
  type: "text" | "image" | "document" | "audio" | "video";
  body?: string;
  mediaUrl?: string;
  mediaId?: string;
  caption?: string;
  filename?: string;
  /** If set, the saved WhatsMessage.id to update status after delivery */
  messageDbId?: string;
}

/** Webhook delivery job */
export interface WebhookJob {
  deliveryId: string;
  endpointId: string;
  url: string;
  secret: string;
  payload: {
    event: string;
    timestamp: number;
    data: unknown;
    companyId: string;
  };
  attempt: number;
}

// ── Queue instances ─────────────────────────────────────────

export const messagesQueue = new Queue<MessageJob>("messages", {
  connection,
  prefix,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 500 },
  },
});

export const webhooksQueue = new Queue<WebhookJob>("webhooks", {
  connection,
  prefix,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 300 },
  },
});

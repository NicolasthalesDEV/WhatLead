import 'dotenv/config';
import path from 'path';
import dotenv from 'dotenv';

// Load root .env when running in monorepo (dotenv/config only loads CWD/.env)
const rootEnv = path.resolve(__dirname, '../../../.env');
dotenv.config({ path: rootEnv, override: false });

// Suppress BullMQ's repeated eviction policy warning for Upstash Redis
// (Upstash uses "optimistic-volatile" and doesn't allow changing it)
const _origError = console.error.bind(console);
console.error = (...args: any[]) => {
  if (typeof args[0] === 'string' && args[0].includes('Eviction policy')) return;
  _origError(...args);
};

import { Queue, Worker, QueueEvents } from "bullmq";
import IORedis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  // In local dev without Redis, limit retries to avoid log spam
  retryStrategy: (times) => {
    if (times > 3) {
      console.warn(`[worker] Redis unavailable (${redisUrl.replace(/:([^@]+)@/, ':***@')}). Filas desabilitadas no dev local.`);
      return null; // stop retrying
    }
    return Math.min(times * 500, 2000);
  },
  enableOfflineQueue: false,
});
connection.on('error', (err) => {
  // Suppress repeated connection refused logs in local dev
  if ((err as any).code !== 'ECONNREFUSED') {
    console.warn('[worker] Redis error:', err.message);
  }
});

const prefix = process.env.BULLMQ_PREFIX || "wacrm";

const messagesQueue = new Queue("messages", { connection, prefix });
const webhooksQueue = new Queue("webhooks", { connection, prefix });

new Worker("messages", async job => {
  console.log("Process message job", job.id, job.data);
}, { connection, prefix });

new Worker("webhooks", async job => {
  console.log("Deliver webhook job", job.id, job.data);
}, { connection, prefix });

new QueueEvents("messages", { connection, prefix });
new QueueEvents("webhooks", { connection, prefix });

console.log("Worker running...");

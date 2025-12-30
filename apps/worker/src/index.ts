import 'dotenv/config';
import { Queue, Worker, QueueEvents } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null
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

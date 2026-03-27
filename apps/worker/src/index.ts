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

import { Worker, QueueEvents } from "bullmq";
import crypto from "crypto";
import { prisma } from "@wacrm/db";
import { connection, prefix, type MessageJob, type WebhookJob } from "./queues";

// ── Messages Worker ─────────────────────────────────────────
// Processes outbound WhatsApp messages queued by the web app.
new Worker<MessageJob>("messages", async (job) => {
  const { companyId, customerId, channelId, to, type, body, mediaUrl, mediaId, caption, filename, messageDbId } = job.data;

  console.log(`[worker:messages] job=${job.id} to=${to} type=${type}`);

  // Fetch channel credentials
  const channel = await prisma.whatsChannel.findUnique({
    where: { id: channelId },
    select: { phoneNumberId: true, waAccessToken: true },
  });

  if (!channel) {
    throw new Error(`Channel ${channelId} not found`);
  }

  const apiVersion = process.env.WA_API_VERSION || "v21.0";
  const baseUrl = `https://graph.facebook.com/${apiVersion}/${channel.phoneNumberId}/messages`;

  // Build the WhatsApp Cloud API payload
  let waPayload: Record<string, unknown>;

  if (type === "text") {
    waPayload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { body: body || "" },
    };
  } else {
    const mediaObject: Record<string, string> = {};
    if (mediaId) mediaObject.id = mediaId;
    else if (mediaUrl) mediaObject.link = mediaUrl;
    if (caption) mediaObject.caption = caption;
    if (filename) mediaObject.filename = filename;

    waPayload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type,
      [type]: mediaObject,
    };
  }

  const resp = await fetch(baseUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${channel.waAccessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(waPayload),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`WhatsApp API error ${resp.status}: ${errText}`);
  }

  const result = (await resp.json()) as { messages?: Array<{ id: string }> };
  const waMessageId = result?.messages?.[0]?.id;

  // Update DB record status if provided
  if (messageDbId) {
    await prisma.whatsMessage.update({
      where: { id: messageDbId },
      data: {
        status: "sent",
        raw: { whatsappMessageId: waMessageId ?? null },
      },
    });
  }

  console.log(`[worker:messages] job=${job.id} sent waId=${waMessageId}`);
}, { connection, prefix, concurrency: 10 });

// ── Webhooks Worker ─────────────────────────────────────────
// Delivers webhook payloads to registered endpoints with HMAC signature.
new Worker<WebhookJob>("webhooks", async (job) => {
  const { deliveryId, url, secret, payload, attempt } = job.data;

  console.log(`[worker:webhooks] job=${job.id} event=${payload.event} url=${url} attempt=${attempt}`);

  const payloadString = JSON.stringify(payload);
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payloadString)
    .digest("hex");

  let statusCode: number | undefined;
  let errorMessage: string | undefined;
  let success = false;

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Event": payload.event,
        "X-Webhook-Timestamp": payload.timestamp.toString(),
        "X-Webhook-Attempt": attempt.toString(),
        "User-Agent": "WhatLead-Webhook/1.0",
      },
      body: payloadString,
      signal: AbortSignal.timeout(30_000),
    });

    statusCode = resp.status;
    success = resp.ok;
    if (!resp.ok) errorMessage = `HTTP ${resp.status}: ${resp.statusText}`;
  } catch (err: any) {
    errorMessage = err?.message || "Network error";
  }

  // Update delivery record
  try {
    await prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: success ? "delivered" : "failed",
        attempt: attempt + 1,
      },
    });
  } catch (dbErr) {
    console.warn(`[worker:webhooks] Failed to update delivery ${deliveryId}:`, dbErr);
  }

  if (!success) {
    throw new Error(errorMessage || `Delivery failed with status ${statusCode}`);
  }

  console.log(`[worker:webhooks] job=${job.id} delivered statusCode=${statusCode}`);
}, { connection, prefix, concurrency: 20 });

new QueueEvents("messages", { connection, prefix });
new QueueEvents("webhooks", { connection, prefix });

console.log("[worker] Started — listening on 'messages' and 'webhooks' queues");

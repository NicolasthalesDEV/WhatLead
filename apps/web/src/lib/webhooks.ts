import crypto from 'crypto';
import { prisma } from '@wacrm/db';

// Lazy-load BullMQ queue so the web app can enqueue webhook jobs
// when Redis is available. Falls back to in-process delivery otherwise.
let _webhooksQueue: import('bullmq').Queue | null = null;
async function getWebhooksQueue() {
  if (_webhooksQueue !== null) return _webhooksQueue;
  if (!process.env.REDIS_URL) return null;
  try {
    const { Queue } = await import('bullmq');
    const IORedis = (await import('ioredis')).default;
    const conn = new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
    });
    _webhooksQueue = new Queue('webhooks', {
      connection: conn,
      prefix: process.env.BULLMQ_PREFIX || 'wacrm',
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 300 },
      },
    });
    return _webhooksQueue;
  } catch {
    return null;
  }
}

/**
 * Webhook Delivery System
 * 
 * Sistema de envio de webhooks com retry automático e assinatura HMAC
 */

export interface WebhookPayload {
  event: string;
  timestamp: number;
  data: any;
  companyId: string;
}

export interface WebhookEndpoint {
  id: string;
  url: string;
  secret: string;
  events: string[];
  active: boolean;
}

const MAX_RETRIES = 5;
const RETRY_DELAYS = [1000, 5000, 15000, 60000, 300000]; // 1s, 5s, 15s, 1m, 5m

/**
 * Gera assinatura HMAC-SHA256 do payload
 */
export function generateWebhookSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Verifica se a assinatura do webhook é válida
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateWebhookSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Envia webhook para um endpoint específico
 */
async function deliverWebhook(
  endpoint: WebhookEndpoint,
  payload: WebhookPayload,
  attempt: number = 0
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  try {
    const payloadString = JSON.stringify(payload);
    const signature = generateWebhookSignature(payloadString, endpoint.secret);

    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': payload.event,
        'X-Webhook-Timestamp': payload.timestamp.toString(),
        'X-Webhook-Attempt': attempt.toString(),
        'User-Agent': 'WhatLead-Webhook/1.0',
      },
      body: payloadString,
      signal: AbortSignal.timeout(30000), // 30s timeout
    });

    if (response.ok) {
      return { success: true, statusCode: response.status };
    }

    return {
      success: false,
      statusCode: response.status,
      error: `HTTP ${response.status}: ${response.statusText}`,
    };

  } catch (error: any) {
    console.error(`Webhook delivery error (attempt ${attempt}):`, error);
    return {
      success: false,
      error: error.message || 'Network error',
    };
  }
}

/**
 * Envia webhook com retry automático
 */
async function deliverWithRetry(
  endpoint: WebhookEndpoint,
  payload: WebhookPayload,
  deliveryId: string,
  attempt: number = 0
): Promise<void> {
  const result = await deliverWebhook(endpoint, payload, attempt);

  // Atualizar status da entrega no banco
  await prisma.webhookDelivery.update({
    where: { id: deliveryId },
    data: {
      status: result.success ? 'delivered' : 'failed',
      attempt: attempt + 1,
    },
  });

  // Se falhou e ainda tem tentativas disponíveis, agendar retry
  if (!result.success && attempt < MAX_RETRIES) {
    const delay = RETRY_DELAYS[attempt] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
    
    console.log(
      `Webhook delivery failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}). Retrying in ${delay}ms...`
    );

    // Agendar próxima tentativa
    setTimeout(() => {
      deliverWithRetry(endpoint, payload, deliveryId, attempt + 1);
    }, delay);
  } else if (!result.success) {
    console.error(
      `Webhook delivery permanently failed after ${attempt + 1} attempts:`,
      result.error
    );
  }
}

/**
 * Dispara webhook para todos os endpoints que escutam o evento
 */
export async function triggerWebhook(
  companyId: string,
  event: string,
  data: any
): Promise<{ sent: number; queued: number }> {
  try {
    // Buscar endpoints ativos que escutam este evento
    const endpoints = await prisma.webhookEndpoint.findMany({
      where: {
        companyId,
        active: true,
        events: {
          has: event,
        },
      },
    });

    if (endpoints.length === 0) {
      return { sent: 0, queued: 0 };
    }

    // Criar payload
    const payload: WebhookPayload = {
      event,
      timestamp: Date.now(),
      data,
      companyId,
    };

    // Criar registros de entrega e enviar
    const deliveries = await Promise.all(
      endpoints.map(async (endpoint: any) => {
        // Criar registro de entrega
        const delivery = await prisma.webhookDelivery.create({
          data: {
            endpointId: endpoint.id,
            eventType: event,
            payload: payload as any,
            status: 'pending',
            attempt: 0,
          },
        });

        // Enqueue via Redis worker if available, otherwise fall back to in-process delivery
        const queue = await getWebhooksQueue();
        if (queue) {
          await queue.add('deliver', {
            deliveryId: delivery.id,
            endpointId: endpoint.id,
            url: endpoint.url,
            secret: endpoint.secret,
            payload,
            attempt: 0,
          });
        } else {
          // In-process fallback (no Redis)
          deliverWithRetry(endpoint, payload, delivery.id, 0);
        }

        return delivery;
      })
    );

    return {
      sent: endpoints.length,
      queued: deliveries.length,
    };

  } catch (error) {
    console.error('Error triggering webhooks:', error);
    throw error;
  }
}

/**
 * Retenta envio de um webhook que falhou
 */
export async function retryWebhookDelivery(deliveryId: string): Promise<boolean> {
  try {
    const delivery = await prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery) {
      throw new Error('Delivery not found');
    }

    const endpoint = await prisma.webhookEndpoint.findUnique({
      where: { id: delivery.endpointId },
    });

    if (!endpoint || !endpoint.active) {
      throw new Error('Endpoint not found or inactive');
    }

    const payload = delivery.payload as any as WebhookPayload;
    
    // Resetar status e tentar novamente
    await prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: 'pending',
        attempt: 0,
      },
    });

    deliverWithRetry(endpoint, payload, deliveryId, 0);

    return true;

  } catch (error) {
    console.error('Error retrying webhook delivery:', error);
    return false;
  }
}

/**
 * Eventos disponíveis para webhooks
 */
export const WEBHOOK_EVENTS = {
  // Clientes
  'customer.created': 'Cliente criado',
  'customer.updated': 'Cliente atualizado',
  'customer.deleted': 'Cliente deletado',

  // Pedidos
  'order.created': 'Pedido criado',
  'order.updated': 'Pedido atualizado',
  'order.paid': 'Pedido pago',
  'order.cancelled': 'Pedido cancelado',

  // Mensagens
  'message.received': 'Mensagem recebida',
  'message.sent': 'Mensagem enviada',

  // Pagamentos
  'payment.success': 'Pagamento confirmado',
  'payment.failed': 'Pagamento falhou',

  // NPS
  'nps.response': 'Resposta NPS recebida',

  // Chatbot
  'chatbot.conversation_ended': 'Conversa do chatbot finalizada',
} as const;

export type WebhookEvent = keyof typeof WEBHOOK_EVENTS;

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@wacrm/db';

/**
 * POST /api/webhooks/mercadopago
 * 
 * Webhook do Mercado Pago para eventos de assinatura
 * 
 * Eventos:
 * - preapproval.created: Assinatura criada
 * - preapproval.updated: Status da assinatura mudou
 * - payment.created: Pagamento recorrente criado
 * - payment.updated: Status do pagamento mudou
 */

interface MercadoPagoWebhookEvent {
  action: string;
  api_version: string;
  data: {
    id: string;
  };
  date_created: string;
  id: number;
  live_mode: boolean;
  type: 'payment' | 'subscription_preapproval' | 'subscription_authorized_payment';
  user_id: string;
}

export async function POST(req: NextRequest) {
  try {
    const event: MercadoPagoWebhookEvent = await req.json();

    console.log('[Mercado Pago Webhook]', {
      type: event.type,
      action: event.action,
      dataId: event.data?.id,
    });

    // Processar baseado no tipo de evento
    switch (event.type) {
      case 'subscription_preapproval':
        await handleSubscriptionEvent(event);
        break;

      case 'subscription_authorized_payment':
      case 'payment':
        await handlePaymentEvent(event);
        break;

      default:
        console.log('[Mercado Pago Webhook] Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error: any) {
    console.error('[Mercado Pago Webhook Error]', error);
    // Sempre retornar 200 para o webhook não ficar reenviando
    return NextResponse.json({ error: error.message }, { status: 200 });
  }
}

async function handleSubscriptionEvent(event: MercadoPagoWebhookEvent) {
  const subscriptionId = event.data.id;

  // Buscar assinatura no Mercado Pago
  const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!mpAccessToken) {
    console.error('MERCADOPAGO_ACCESS_TOKEN not configured');
    return;
  }

  const response = await fetch(`https://api.mercadopago.com/preapproval/${subscriptionId}`, {
    headers: {
      'Authorization': `Bearer ${mpAccessToken}`,
    },
  });

  if (!response.ok) {
    console.error('Failed to fetch subscription from Mercado Pago');
    return;
  }

  const subscription = await response.json();
  const companyId = subscription.external_reference;

  if (!companyId) {
    console.error('No external_reference found in subscription');
    return;
  }

  // Mapear status do MP para nosso sistema
  let planStatus = 'active';
  if (subscription.status === 'paused') {
    planStatus = 'paused';
  } else if (subscription.status === 'cancelled') {
    planStatus = 'cancelled';
  } else if (subscription.status === 'pending') {
    planStatus = 'pending';
  }

  // Calcular data de expiração baseado no billing cycle
  let planExpiresAt: Date | null = null;
  if (subscription.status === 'authorized') {
    const frequency = subscription.auto_recurring.frequency;
    const frequencyType = subscription.auto_recurring.frequency_type;
    
    const now = new Date();
    if (frequencyType === 'months') {
      planExpiresAt = new Date(now.setMonth(now.getMonth() + frequency));
    } else if (frequencyType === 'days') {
      planExpiresAt = new Date(now.setDate(now.getDate() + frequency));
    }
  }

  // Determinar o plano baseado no valor
  const amount = subscription.auto_recurring.transaction_amount;
  let plan = 'free';
  
  if (amount >= 497) {
    plan = 'enterprise';
  } else if (amount >= 197) {
    plan = 'professional';
  } else if (amount >= 97) {
    plan = 'starter';
  }

  // Atualizar empresa no banco
  await prisma.company.update({
    where: { id: companyId },
    data: {
      plan,
      planStatus,
      planStartedAt: subscription.status === 'authorized' ? new Date(subscription.date_created) : undefined,
      planExpiresAt,
      billingCycle: subscription.auto_recurring.frequency === 12 ? 'yearly' : 'monthly',
      paymentMethod: 'mercadopago',
      mercadopagoSubscriptionId: subscriptionId,
    },
  });

  console.log(`[Webhook] Updated company ${companyId} subscription status to ${planStatus}`);
}

async function handlePaymentEvent(event: MercadoPagoWebhookEvent) {
  const paymentId = event.data.id;

  // Buscar pagamento no Mercado Pago
  const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!mpAccessToken) {
    console.error('MERCADOPAGO_ACCESS_TOKEN not configured');
    return;
  }

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      'Authorization': `Bearer ${mpAccessToken}`,
    },
  });

  if (!response.ok) {
    console.error('Failed to fetch payment from Mercado Pago');
    return;
  }

  const payment = await response.json();
  const companyId = payment.external_reference;

  if (!companyId) {
    console.error('No external_reference found in payment');
    return;
  }

  // Se pagamento foi aprovado, renovar assinatura
  if (payment.status === 'approved') {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { billingCycle: true },
    });

    if (!company) {
      console.error('Company not found:', companyId);
      return;
    }

    // Calcular nova data de expiração
    const now = new Date();
    const planExpiresAt = company.billingCycle === 'yearly'
      ? new Date(now.setFullYear(now.getFullYear() + 1))
      : new Date(now.setMonth(now.getMonth() + 1));

    await prisma.company.update({
      where: { id: companyId },
      data: {
        planStatus: 'active',
        lastPaymentAt: new Date(payment.date_approved),
        planExpiresAt,
      },
    });

    console.log(`[Webhook] Payment approved for company ${companyId}, renewed until ${planExpiresAt}`);
  }
  
  // Se pagamento falhou
  else if (payment.status === 'rejected' || payment.status === 'cancelled') {
    await prisma.company.update({
      where: { id: companyId },
      data: {
        planStatus: 'payment_failed',
      },
    });

    console.log(`[Webhook] Payment ${payment.status} for company ${companyId}`);
  }
}

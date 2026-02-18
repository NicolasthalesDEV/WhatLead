import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@wacrm/db';
import { errorResponse, ValidationError, UnauthorizedError } from '@/lib/errors';
import { MercadoPagoSubscriptionClient, PLANS, PlanId } from '@/lib/mercadopago/subscription';

/**
 * POST /api/billing/create-subscription
 * 
 * Cria uma nova assinatura no Mercado Pago
 */

const createSubscriptionSchema = z.object({
  planId: z.enum(['starter', 'professional', 'enterprise']),
  billingCycle: z.enum(['monthly', 'yearly']),
  payerEmail: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) {
      return auth.res;
    }

    const body = await req.json();
    const data = createSubscriptionSchema.parse(body);

    // Buscar empresa
    const company = await prisma.company.findUnique({
      where: { id: auth.companyId },
      select: {
        id: true,
        name: true,
        plan: true,
        mercadopagoSubscriptionId: true,
      },
    });

    if (!company) {
      throw new UnauthorizedError('Empresa não encontrada');
    }

    // Verificar se já tem assinatura ativa
    if (company.mercadopagoSubscriptionId) {
      return NextResponse.json(
        { error: 'Já existe uma assinatura ativa. Cancele a atual antes de criar uma nova.' },
        { status: 400 }
      );
    }

    // Calcular preço baseado no plano e ciclo
    let price: number;
    let planName: string;

    if (data.planId === 'starter') {
      price = data.billingCycle === 'yearly' ? PLANS.starter.priceYearly : PLANS.starter.priceMonthly;
      planName = PLANS.starter.name;
    } else if (data.planId === 'professional') {
      price = data.billingCycle === 'yearly' ? PLANS.professional.priceYearly : PLANS.professional.priceMonthly;
      planName = PLANS.professional.name;
    } else if (data.planId === 'enterprise') {
      price = data.billingCycle === 'yearly' ? PLANS.enterprise.priceYearly : PLANS.enterprise.priceMonthly;
      planName = PLANS.enterprise.name;
    } else {
      throw new ValidationError('Plano inválido');
    }

    // Criar assinatura no Mercado Pago
    const mpClient = new MercadoPagoSubscriptionClient();
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    const subscription = await mpClient.createSubscription({
      reason: `${planName} - ${data.billingCycle === 'yearly' ? 'Anual' : 'Mensal'}`,
      auto_recurring: {
        frequency: data.billingCycle === 'yearly' ? 12 : 1,
        frequency_type: 'months',
        transaction_amount: price,
        currency_id: 'BRL',
      },
      back_url: `${baseUrl}/dashboard/settings?section=billing&status=success`,
      external_reference: company.id,
      payer_email: data.payerEmail,
    });

    // Salvar ID da assinatura no banco (ainda pendente até o pagamento)
    await prisma.company.update({
      where: { id: company.id },
      data: {
        mercadopagoSubscriptionId: subscription.id,
        planStatus: 'pending',
      },
    });

    // Retornar link de pagamento
    return NextResponse.json({
      subscriptionId: subscription.id,
      initPoint: subscription.init_point, // URL para redirecionar o cliente
      status: subscription.status,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Failed to create subscription:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return errorResponse(error);
  }
}

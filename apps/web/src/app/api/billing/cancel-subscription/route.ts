import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@wacrm/db';
import { errorResponse, UnauthorizedError } from '@/lib/errors';
import { MercadoPagoSubscriptionClient } from '@/lib/mercadopago/subscription';

/**
 * POST /api/billing/cancel-subscription
 * 
 * Cancela a assinatura atual
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) {
      return auth.res;
    }

    const company = await prisma.company.findUnique({
      where: { id: auth.companyId },
      select: {
        id: true,
        mercadopagoSubscriptionId: true,
        plan: true,
        planStatus: true,
      },
    });

    if (!company) {
      throw new UnauthorizedError('Empresa não encontrada');
    }

    if (!company.mercadopagoSubscriptionId) {
      return NextResponse.json(
        { error: 'Nenhuma assinatura ativa encontrada' },
        { status: 400 }
      );
    }

    // Cancelar no Mercado Pago
    const mpClient = new MercadoPagoSubscriptionClient();
    await mpClient.cancelSubscription(company.mercadopagoSubscriptionId);

    // Atualizar no banco
    await prisma.company.update({
      where: { id: company.id },
      data: {
        planStatus: 'cancelled',
        // Manter o plano ativo até a data de expiração
      },
    });

    return NextResponse.json({
      message: 'Assinatura cancelada com sucesso',
      note: 'Seu plano continuará ativo até a data de expiração',
    });

  } catch (error: any) {
    console.error('Failed to cancel subscription:', error);
    return errorResponse(error);
  }
}

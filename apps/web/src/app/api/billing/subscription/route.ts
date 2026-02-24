import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@wacrm/db';
import { errorResponse, UnauthorizedError } from '@/lib/errors';

/**
 * GET /api/billing/subscription
 * 
 * Retorna informações da assinatura atual da empresa
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) {
      return auth.res;
    }

    const company = await prisma.company.findUnique({
      where: { id: auth.companyId },
      select: {
        id: true,
        name: true,
        plan: true,
        planStatus: true,
        planStartedAt: true,
        planExpiresAt: true,
        billingCycle: true,
        paymentMethod: true,
        lastPaymentAt: true,
        mercadopagoSubscriptionId: true,
        createdAt: true,
      },
    });

    if (!company) {
      throw new UnauthorizedError('Empresa não encontrada');
    }

    // Para plano free (trial), calcular dias restantes a partir de createdAt + 14 dias
    // Para planos pagos, usar planExpiresAt
    const TRIAL_DAYS = 14;
    let daysRemaining: number | null = null;
    let expiresIn: string | null = null;
    let isTrial = false;

    const effectiveExpiresAt =
      company.planExpiresAt ??
      (company.plan === 'free'
        ? new Date(new Date(company.createdAt).getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000)
        : null);

    if (effectiveExpiresAt) {
      const now = new Date();
      const expiresAt = new Date(effectiveExpiresAt);
      const diffTime = expiresAt.getTime() - now.getTime();
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      isTrial = company.plan === 'free';

      if (daysRemaining < 0) {
        expiresIn = isTrial ? 'Trial expirado' : 'Expirado';
      } else if (daysRemaining === 0) {
        expiresIn = isTrial ? 'Último dia de trial' : 'Expira hoje';
      } else if (daysRemaining === 1) {
        expiresIn = isTrial ? '1 dia de trial restante' : 'Expira amanhã';
      } else if (isTrial) {
        expiresIn = `${daysRemaining} dias de trial restantes`;
      } else if (daysRemaining <= 30) {
        expiresIn = `Expira em ${daysRemaining} dias`;
      } else {
        const months = Math.floor(daysRemaining / 30);
        expiresIn = `Expira em ${months} ${months === 1 ? 'mês' : 'meses'}`;
      }
    }

    // Retornar resposta plana (sem wrapper `subscription`) para compatibilidade com frontend
    return NextResponse.json({
      id: company.id,
      name: company.name,
      plan: company.plan,
      planStatus: company.plan === 'free' ? 'trial' : company.planStatus,
      planStartedAt: company.planStartedAt,
      planExpiresAt: company.planExpiresAt,
      billingCycle: company.billingCycle,
      paymentMethod: company.paymentMethod,
      lastPaymentAt: company.lastPaymentAt,
      mercadopagoSubscriptionId: company.mercadopagoSubscriptionId,
      daysRemaining,
      expiresIn,
      isTrial,
      isExpired: daysRemaining !== null && daysRemaining < 0,
      isExpiringSoon: daysRemaining !== null && daysRemaining <= 7 && daysRemaining >= 0,
    });

  } catch (error: any) {
    console.error('Failed to get subscription:', error);
    return errorResponse(error);
  }
}

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
      },
    });

    if (!company) {
      throw new UnauthorizedError('Empresa não encontrada');
    }

    // Calcular dias restantes
    let daysRemaining: number | null = null;
    let expiresIn: string | null = null;
    
    if (company.planExpiresAt) {
      const now = new Date();
      const expiresAt = new Date(company.planExpiresAt);
      const diffTime = expiresAt.getTime() - now.getTime();
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (daysRemaining < 0) {
        expiresIn = 'Expirado';
      } else if (daysRemaining === 0) {
        expiresIn = 'Expira hoje';
      } else if (daysRemaining === 1) {
        expiresIn = 'Expira amanhã';
      } else if (daysRemaining <= 30) {
        expiresIn = `Expira em ${daysRemaining} dias`;
      } else {
        const months = Math.floor(daysRemaining / 30);
        expiresIn = `Expira em ${months} ${months === 1 ? 'mês' : 'meses'}`;
      }
    }

    return NextResponse.json({
      subscription: {
        ...company,
        daysRemaining,
        expiresIn,
        isExpired: daysRemaining !== null && daysRemaining < 0,
        isExpiringSoon: daysRemaining !== null && daysRemaining <= 7 && daysRemaining >= 0,
      },
    });

  } catch (error: any) {
    console.error('Failed to get subscription:', error);
    return errorResponse(error);
  }
}

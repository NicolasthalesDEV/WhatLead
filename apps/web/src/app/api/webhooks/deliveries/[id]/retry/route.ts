import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@wacrm/db';
import { verifyAuth } from '@/lib/auth';
import { retryWebhookDelivery } from '@/lib/webhooks';

/**
 * POST /api/webhooks/deliveries/[id]/retry
 * 
 * Retenta envio de um webhook que falhou
 */

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Apenas OWNER e ADMIN podem retentar webhooks
    if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Permissão negada' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Verificar se delivery existe e pertence à empresa
    const delivery = await prisma.webhookDelivery.findUnique({
      where: { id },
      include: {
        endpoint: {
          select: {
            companyId: true,
          },
        },
      },
    });

    if (!delivery || delivery.endpoint.companyId !== user.companyId) {
      return NextResponse.json(
        { error: 'Entrega não encontrada' },
        { status: 404 }
      );
    }

    // Retentar envio
    const success = await retryWebhookDelivery(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Erro ao retentar envio' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook reenviado. Verifique o status em alguns segundos.',
    });

  } catch (error) {
    console.error('Error retrying webhook:', error);
    return NextResponse.json(
      { error: 'Erro ao retentar webhook' },
      { status: 500 }
    );
  }
}

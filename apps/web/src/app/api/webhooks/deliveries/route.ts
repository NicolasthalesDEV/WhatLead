import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@wacrm/db';
import { verifyAuth } from '@/lib/auth';
import { retryWebhookDelivery } from '@/lib/webhooks';

/**
 * GET /api/webhooks/deliveries
 * 
 * Lista entregas de webhooks com filtros
 * 
 * Query params:
 * - endpointId: filtrar por endpoint (opcional)
 * - status: pending | delivered | failed (opcional)
 * - eventType: tipo de evento (opcional)
 * - page: número da página (default: 1)
 * - limit: itens por página (default: 50, max: 100)
 */

const querySchema = z.object({
  endpointId: z.string().optional(),
  status: z.enum(['pending', 'delivered', 'failed']).optional(),
  eventType: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = querySchema.parse({
      endpointId: searchParams.get('endpointId') || undefined,
      status: searchParams.get('status') || undefined,
      eventType: searchParams.get('eventType') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '50',
    });

    const skip = (query.page - 1) * query.limit;

    // Buscar deliveries com join no endpoint
    const deliveries = await prisma.webhookDelivery.findMany({
      where: {
        ...(query.endpointId && { endpointId: query.endpointId }),
        ...(query.status && { status: query.status }),
        ...(query.eventType && { eventType: query.eventType }),
      },
      take: query.limit,
      skip,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        endpointId: true,
        eventType: true,
        payload: true,
        status: true,
        attempt: true,
        createdAt: true,
      },
    });

    // Buscar endpoints relacionados
    const endpointIds = [...new Set(deliveries.map((d: any) => d.endpointId))];
    const endpoints = await prisma.webhookEndpoint.findMany({
      where: {
        id: { in: endpointIds },
        companyId: user.companyId,
      },
      select: {
        id: true,
        url: true,
      },
    });

    const endpointMap = new Map(endpoints.map((e: any) => [e.id, e.url]));

    // Formatar deliveries com URL do endpoint
    const formattedDeliveries = deliveries
      .filter((d: any) => endpointMap.has(d.endpointId)) // Apenas da empresa do usuário
      .map((d: any) => ({
        id: d.id,
        endpointUrl: endpointMap.get(d.endpointId),
        eventType: d.eventType,
        status: d.status,
        attempt: d.attempt,
        createdAt: d.createdAt,
        payload: d.payload,
      }));

    // Contar total
    const total = await prisma.webhookDelivery.count({
      where: {
        ...(query.endpointId && { endpointId: query.endpointId }),
        ...(query.status && { status: query.status }),
        ...(query.eventType && { eventType: query.eventType }),
      },
    });

    return NextResponse.json({
      deliveries: formattedDeliveries,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
    });

  } catch (error) {
    console.error('Error fetching webhook deliveries:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao buscar entregas' },
      { status: 500 }
    );
  }
}

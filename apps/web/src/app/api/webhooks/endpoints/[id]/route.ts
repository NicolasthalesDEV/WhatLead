import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@wacrm/db';
import { verifyAuth } from '@/lib/auth';

/**
 * GET /api/webhooks/endpoints/[id]
 * 
 * Retorna detalhes de um webhook endpoint
 */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string> } }
) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const endpoint = await prisma.webhookEndpoint.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
      select: {
        id: true,
        url: true,
        active: true,
        events: true,
        secret: true,
        createdAt: true,
      },
    });

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Webhook não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ endpoint });

  } catch (error) {
    console.error('Error fetching webhook endpoint:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar webhook' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/webhooks/endpoints/[id]
 * 
 * Atualiza um webhook endpoint
 * 
 * Body:
 * - url: URL do endpoint (opcional)
 * - events: array de eventos (opcional)
 * - active: ativar/desativar (opcional)
 * - secret: novo secret (opcional)
 */

const updateEndpointSchema = z.object({
  url: z.string().url('URL inválida').optional(),
  events: z.array(z.string()).min(1, 'Selecione pelo menos um evento').optional(),
  active: z.boolean().optional(),
  secret: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string> } }
) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Apenas OWNER e ADMIN podem atualizar webhooks
    if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Permissão negada' },
        { status: 403 }
      );
    }

    // Verificar se webhook existe e pertence à empresa
    const existing = await prisma.webhookEndpoint.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Webhook não encontrado' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const data = updateEndpointSchema.parse(body);

    // Atualizar endpoint
    const endpoint = await prisma.webhookEndpoint.update({
      where: { id: params.id },
      data: {
        ...(data.url && { url: data.url }),
        ...(data.events && { events: data.events }),
        ...(data.active !== undefined && { active: data.active }),
        ...(data.secret && { secret: data.secret }),
      },
      select: {
        id: true,
        url: true,
        active: true,
        events: true,
        secret: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ endpoint });

  } catch (error) {
    console.error('Error updating webhook endpoint:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao atualizar webhook' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/webhooks/endpoints/[id]
 * 
 * Remove um webhook endpoint
 */

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string> } }
) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Apenas OWNER e ADMIN podem deletar webhooks
    if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Permissão negada' },
        { status: 403 }
      );
    }

    // Verificar se webhook existe e pertence à empresa
    const existing = await prisma.webhookEndpoint.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Webhook não encontrado' },
        { status: 404 }
      );
    }

    // Deletar endpoint
    await prisma.webhookEndpoint.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting webhook endpoint:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar webhook' },
      { status: 500 }
    );
  }
}

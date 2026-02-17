import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@wacrm/db';
import { verifyAuth } from '@/lib/auth';
import crypto from 'crypto';

/**
 * GET /api/webhooks/endpoints
 * 
 * Lista todos os webhook endpoints da empresa
 */

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const endpoints = await prisma.webhookEndpoint.findMany({
      where: {
        companyId: user.companyId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        url: true,
        active: true,
        events: true,
        createdAt: true,
        // Não retornar o secret por segurança
      },
    });

    return NextResponse.json({ endpoints });

  } catch (error) {
    console.error('Error fetching webhook endpoints:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar webhooks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/webhooks/endpoints
 * 
 * Cria um novo webhook endpoint
 * 
 * Body:
 * - url: URL do endpoint
 * - events: array de eventos para escutar
 * - secret: (opcional) secret para assinatura HMAC
 */

const createEndpointSchema = z.object({
  url: z.string().url('URL inválida'),
  events: z.array(z.string()).min(1, 'Selecione pelo menos um evento'),
  secret: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Apenas OWNER e ADMIN podem criar webhooks
    if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Permissão negada' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const data = createEndpointSchema.parse(body);

    // Gerar secret automaticamente se não fornecido
    const secret = data.secret || crypto.randomBytes(32).toString('hex');

    // Criar endpoint
    const endpoint = await prisma.webhookEndpoint.create({
      data: {
        companyId: user.companyId,
        url: data.url,
        events: data.events,
        secret,
        active: true,
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

    return NextResponse.json({ endpoint }, { status: 201 });

  } catch (error) {
    console.error('Error creating webhook endpoint:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao criar webhook' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@wacrm/db';
import { verifyAuth } from '@/lib/auth';

/**
 * GET /api/whatsapp/conversations/[customerId]
 * 
 * Retorna mensagens de uma conversa específica com um cliente
 * 
 * Query params:
 * - page: número da página (default: 1)
 * - limit: mensagens por página (default: 50, max: 100)
 * - before: buscar mensagens antes de um timestamp (ISO 8601)
 * - after: buscar mensagens depois de um timestamp (ISO 8601)
 */

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  before: z.string().datetime().optional(),
  after: z.string().datetime().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { customerId } = params;

    // Verificar se o cliente existe e pertence à empresa do usuário
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        companyId: user.companyId,
      },
      select: {
        id: true,
        name: true,
        phoneE164: true,
        email: true,
        tags: true,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const query = querySchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '50',
      before: searchParams.get('before') || undefined,
      after: searchParams.get('after') || undefined,
    });

    const skip = (query.page - 1) * query.limit;

    // Construir filtro de data
    const dateFilter: Record<string, any> = {};
    if (query.before) {
      dateFilter.lt = new Date(query.before);
    }
    if (query.after) {
      dateFilter.gt = new Date(query.after);
    }

    // Buscar mensagens
    const messages = await prisma.whatsMessage.findMany({
      where: {
        customerId,
        companyId: user.companyId,
        ...(Object.keys(dateFilter).length > 0 && {
          createdAt: dateFilter,
        }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: query.limit,
      skip,
      select: {
        id: true,
        direction: true,
        type: true,
        body: true,
        templateName: true,
        status: true,
        raw: true,
        createdAt: true,
      },
    });

    // Contar total de mensagens
    const total = await prisma.whatsMessage.count({
      where: {
        customerId,
        companyId: user.companyId,
        ...(Object.keys(dateFilter).length > 0 && {
          createdAt: dateFilter,
        }),
      },
    });

    // Marcar mensagens recebidas como lidas
    const unreadMessageIds = messages
      .filter((m: any) => m.direction === 'IN' && m.status !== 'read')
      .map((m: any) => m.id);

    if (unreadMessageIds.length > 0) {
      await prisma.whatsMessage.updateMany({
        where: {
          id: { in: unreadMessageIds },
        },
        data: {
          status: 'read',
        },
      });
    }

    // Formatar mensagens (mais recentes primeiro)
    const formattedMessages = messages.reverse().map((msg: any) => {
      // Extrair informações de mídia do campo raw se disponível
      let mediaUrl: string | null = null;
      let mimeType: string | null = null;
      let fileName: string | null = null;

      if (msg.raw && typeof msg.raw === 'object') {
        const raw = msg.raw as any;
        
        // Para mensagens recebidas
        if (raw.image?.id || raw.video?.id || raw.document?.id || raw.audio?.id) {
          const mediaType = raw.image ? 'image' : raw.video ? 'video' : raw.document ? 'document' : 'audio';
          const media = raw[mediaType];
          
          // URL será construída pelo frontend usando a API de download
          mediaUrl = `/api/whatsapp/media/${media.id}`;
          mimeType = media.mime_type;
          fileName = media.filename || null;
        }
        
        // Para mensagens enviadas (pode já ter URL)
        if (raw.mediaUrl) {
          mediaUrl = raw.mediaUrl;
          mimeType = raw.mimeType || null;
          fileName = raw.fileName || null;
        }
      }

      return {
        id: msg.id,
        direction: msg.direction,
        type: msg.type,
        body: msg.body,
        templateName: msg.templateName,
        status: msg.status,
        media: mediaUrl ? {
          url: mediaUrl,
          mimeType,
          fileName,
        } : null,
        timestamp: msg.createdAt,
      };
    });

    return NextResponse.json({
      customer,
      messages: formattedMessages,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
      markedAsRead: unreadMessageIds.length,
    });

  } catch (error) {
    console.error('Error fetching conversation:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Erro ao buscar conversa' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@wacrm/db';
import { verifyAuth } from '@/lib/auth';

/**
 * GET /api/whatsapp/conversations
 * 
 * Lista conversas do WhatsApp com resumo de cada conversa
 * 
 * Query params:
 * - page: número da página (default: 1)
 * - limit: itens por página (default: 20, max: 100)
 * - search: busca por nome ou telefone do cliente
 * - unreadOnly: filtrar apenas não lidas (true/false)
 * - assignedTo: filtrar por vendedor atribuído (userId)
 */

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  unreadOnly: z.enum(['true', 'false']).optional(),
  assignedTo: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = querySchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      search: searchParams.get('search') || undefined,
      unreadOnly: searchParams.get('unreadOnly') || undefined,
      assignedTo: searchParams.get('assignedTo') || undefined,
    });

    const skip = (query.page - 1) * query.limit;

    // Construir condições WHERE dinamicamente usando strings SQL
    const searchCondition = query.search 
      ? `AND (c.name ILIKE '%${query.search}%' OR c."phoneE164" ILIKE '%${query.search}%')`
      : '';

    const unreadCondition = query.unreadOnly === 'true'
      ? `AND COALESCE(uc.unread, 0) > 0`
      : '';

    const assignedCondition = query.assignedTo
      ? `AND fc."assignedToId" = '${query.assignedTo}'`
      : '';

    // Buscar últimas mensagens por cliente
    // Agrupamos por customerId e pegamos a mensagem mais recente
    const conversations = await prisma.$queryRawUnsafe(
      `WITH last_messages AS (
        SELECT DISTINCT ON (wm."customerId")
          wm."customerId",
          wm.body,
          wm.type,
          wm.direction,
          wm."createdAt",
          wm.status
        FROM "WhatsMessage" wm
        WHERE wm."companyId" = '${user.companyId}'
        ORDER BY wm."customerId", wm."createdAt" DESC
      ),
      unread_counts AS (
        SELECT
          wm."customerId",
          COUNT(*)::bigint as unread
        FROM "WhatsMessage" wm
        WHERE wm."companyId" = '${user.companyId}'
          AND wm.direction = 'IN'
          AND wm.status != 'read'
        GROUP BY wm."customerId"
      )
      SELECT
        c.id as "customerId",
        c.name as "customerName",
        c."phoneE164" as "customerPhone",
        lm.body as "lastMessageBody",
        lm.type as "lastMessageType",
        lm.direction as "lastMessageDirection",
        lm."createdAt" as "lastMessageAt",
        COALESCE(uc.unread, 0) as "unreadCount",
        fc."assignedToId" as "assignedToId",
        u.name as "assignedToName"
      FROM "Customer" c
      INNER JOIN last_messages lm ON lm."customerId" = c.id
      LEFT JOIN unread_counts uc ON uc."customerId" = c.id
      LEFT JOIN "FunnelCard" fc ON fc."customerId" = c.id AND fc."companyId" = '${user.companyId}'
      LEFT JOIN "User" u ON u.id = fc."assignedToId"
      WHERE c."companyId" = '${user.companyId}'
        ${searchCondition}
        ${unreadCondition}
        ${assignedCondition}
      ORDER BY lm."createdAt" DESC
      LIMIT ${query.limit}
      OFFSET ${skip}`
    ) as Array<{
      customerId: string;
      customerName: string;
      customerPhone: string;
      lastMessageBody: string | null;
      lastMessageType: string;
      lastMessageDirection: string;
      lastMessageAt: Date;
      unreadCount: bigint;
      assignedToId: string | null;
      assignedToName: string | null;
    }>;

    // Contar total de conversas (para paginação)
    const totalResult = await prisma.$queryRawUnsafe(
      `SELECT COUNT(DISTINCT wm."customerId")::bigint as total
      FROM "WhatsMessage" wm
      INNER JOIN "Customer" c ON c.id = wm."customerId"
      WHERE wm."companyId" = '${user.companyId}'
        ${searchCondition}`
    ) as Array<{ total: bigint }>;

    const total = Number(totalResult[0]?.total || 0);

    // Formatar resultado
    const formattedConversations = conversations.map((conv: any) => ({
      customerId: conv.customerId,
      customer: {
        name: conv.customerName,
        phone: conv.customerPhone,
      },
      lastMessage: {
        body: conv.lastMessageBody,
        type: conv.lastMessageType,
        direction: conv.lastMessageDirection,
        timestamp: conv.lastMessageAt,
      },
      unreadCount: Number(conv.unreadCount),
      assignedTo: conv.assignedToId ? {
        id: conv.assignedToId,
        name: conv.assignedToName,
      } : null,
    }));

    return NextResponse.json({
      conversations: formattedConversations,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
    });

  } catch (error) {
    console.error('Error fetching conversations:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Erro ao buscar conversas' },
      { status: 500 }
    );
  }
}

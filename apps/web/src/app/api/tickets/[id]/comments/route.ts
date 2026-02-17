import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/authorization';
import { createAuditLog } from '@/lib/auth';
import { prisma } from '@wacrm/db';
import { z } from 'zod';

const CreateCommentSchema = z.object({
  content: z.string().min(1, 'Conteúdo é obrigatório'),
  isInternal: z.boolean().default(false),
  attachments: z.array(z.string().url()).optional(),
});

// GET /api/tickets/[id]/comments - Listar comentários do ticket
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await authorize(req, 'tickets:read');
  
  if (!authResult.authorized) {
    return authResult.response;
  }

  const { user } = authResult.data;

  try {
    // Verify ticket exists and belongs to company
    const ticket = await prisma.ticket.findFirst({
      where: {
        id,
        companyId: user.companyId,
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket não encontrado' },
        { status: 404 }
      );
    }

    const comments = await prisma.ticketComment.findMany({
      where: {
        ticketId: id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json({ comments });
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar comentários', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/tickets/[id]/comments - Adicionar comentário
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await authorize(req, 'tickets:update');
  
  if (!authResult.authorized) {
    return authResult.response;
  }

  const { user } = authResult.data;

  try {
    // Verify ticket exists and belongs to company
    const ticket = await prisma.ticket.findFirst({
      where: {
        id,
        companyId: user.companyId,
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket não encontrado' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const data = CreateCommentSchema.parse(body);

    // Create comment and update firstResponseAt if this is the first comment
    const comment = await prisma.$transaction(async (tx: any) => {
      const newComment = await tx.ticketComment.create({
        data: {
          ticketId: id,
          userId: user.id,
          content: data.content,
          isInternal: data.isInternal,
          attachments: data.attachments || [],
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      // If this is the first comment and ticket doesn't have firstResponseAt, set it
      if (!ticket.firstResponseAt) {
        await tx.ticket.update({
          where: { id },
          data: {
            firstResponseAt: new Date(),
          },
        });
      }

      return newComment;
    });

    await createAuditLog({
      userId: user.id,
      companyId: user.companyId,
      action: 'TICKET_COMMENT_ADDED',
      resource: `ticket:${id}`,
      metadata: {
        ticketId: id,
        commentId: comment.id,
        isInternal: comment.isInternal,
      },
      req,
    }).catch((err: any) => console.error('Failed to create audit log:', err));

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Erro ao criar comentário', details: error.message },
      { status: 500 }
    );
  }
}

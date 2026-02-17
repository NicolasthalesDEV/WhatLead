import { NextRequest, NextResponse } from 'next/server';
import { createAuditLog } from '@/lib/auth';
import { authorizeResource } from '@/lib/authorization';
import { prisma } from '@wacrm/db';
import { z } from 'zod';

const UpdateTicketSchema = z.object({
  subject: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'WAITING_INTERNAL', 'RESOLVED', 'CLOSED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  category: z.string().optional(),
  assignedToId: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional(),
});

// GET /api/tickets/[id] - Obter detalhes do ticket
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Note: We use regular authorize and check companyId + permissions
  const { authorize } = await import('@/lib/authorization');
  const { hasPermission } = await import('@/lib/permissions');
  
  const authResult = await authorize(req, 'tickets:read');
  
  if (!authResult.authorized) {
    return authResult.response;
  }

  const { user } = authResult.data;

  try {
    const ticket = await prisma.ticket.findFirst({
      where: {
        id,
        companyId: user.companyId,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phoneE164: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ticket });
  } catch (error: any) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar ticket', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/tickets/[id] - Atualizar ticket
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { authorize } = await import('@/lib/authorization');
  const authResult = await authorize(req, 'tickets:update');
  
  if (!authResult.authorized) {
    return authResult.response;
  }

  const { user } = authResult.data;

  try {
    // Check if ticket exists
    const existingTicket = await prisma.ticket.findFirst({
      where: {
        id,
        companyId: user.companyId,
      },
    });

    if (!existingTicket) {
      return NextResponse.json(
        { error: 'Ticket não encontrado' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const data = UpdateTicketSchema.parse(body);

    // Validate assignee if changing
    if (data.assignedToId !== undefined && data.assignedToId !== null) {
      const assignee = await prisma.user.findFirst({
        where: {
          id: data.assignedToId,
          companyId: user.companyId,
        },
      });

      if (!assignee) {
        return NextResponse.json(
          { error: 'Usuário designado não encontrado' },
          { status: 404 }
        );
      }
    }

    // Track status changes for SLA and firstResponseAt
    const updateData: any = {
      ...data,
    };

    // If status changed to RESOLVED, set resolvedAt
    if (data.status === 'RESOLVED' && existingTicket.status !== 'RESOLVED') {
      updateData.resolvedAt = new Date();
    }

    // If status changed to CLOSED, ensure resolvedAt is set
    if (data.status === 'CLOSED' && !existingTicket.resolvedAt) {
      updateData.resolvedAt = new Date();
    }

    const ticket = await prisma.ticket.update({
      where: { id },
      data: updateData,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phoneE164: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await createAuditLog({
      userId: user.id,
      companyId: user.companyId,
      action: 'TICKET_UPDATED',
      resource: `ticket:${ticket.id}`,
      metadata: {
        ticketId: ticket.id,
        changes: data,
        oldStatus: existingTicket.status,
        newStatus: ticket.status,
      },
      req,
    }).catch((err: any) => console.error('Failed to create audit log:', err));

    return NextResponse.json({ ticket });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating ticket:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar ticket', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/tickets/[id] - Deletar ticket
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { authorize } = await import('@/lib/authorization');
  const authResult = await authorize(req, 'tickets:delete');
  
  if (!authResult.authorized) {
    return authResult.response;
  }

  const { user } = authResult.data;

  try {
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

    // Delete ticket (comments will be cascade deleted)
    await prisma.ticket.delete({
      where: { id },
    });

    await createAuditLog({
      userId: user.id,
      companyId: user.companyId,
      action: 'TICKET_DELETED',
      resource: `ticket:${id}`,
      metadata: {
        ticketId: id,
        subject: ticket.subject,
      },
      req,
    }).catch((err: any) => console.error('Failed to create audit log:', err));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting ticket:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar ticket', details: error.message },
      { status: 500 }
    );
  }
}

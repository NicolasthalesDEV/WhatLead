import { NextRequest, NextResponse } from 'next/server';
import { authorize } from '@/lib/authorization';
import { hasPermission } from '@/lib/permissions';
import { prisma } from '@wacrm/db';
import { z } from 'zod';

const CreateTicketSchema = z.object({
  subject: z.string().min(1, 'Assunto é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  category: z.string().optional(),
  customerId: z.string().optional(),
  assignedToId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  slaDeadline: z.string().datetime().optional(),
});

// GET /api/tickets - Listar tickets com filtros
export async function GET(req: NextRequest) {
  const authResult = await authorize(req, 'tickets:read');
  if (!authResult.authorized) {
    return authResult.response;
  }

  const { user } = authResult.data;
  const { searchParams } = new URL(req.url);
  
  const status = searchParams.get('status');
  const priority = searchParams.get('priority');
  const assignedToId = searchParams.get('assignedToId');
  const customerId = searchParams.get('customerId');
  const category = searchParams.get('category');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {
    companyId: user.companyId,
  };

  // If user doesn't have read_all permission, filter by assigned tickets
  const canReadAll = hasPermission(user.role, 'tickets:read_all');
  if (!canReadAll) {
    where.OR = [
      { assignedToId: user.id },
      { createdById: user.id },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (priority) {
    where.priority = priority;
  }

  if (assignedToId) {
    where.assignedToId = assignedToId;
  }

  if (customerId) {
    where.customerId = customerId;
  }

  if (category) {
    where.category = category;
  }

  try {
    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
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
          _count: {
            select: {
              comments: true,
            },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        take: limit,
        skip,
      }),
      prisma.ticket.count({ where }),
    ]);

    return NextResponse.json({
      tickets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar tickets', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/tickets - Criar novo ticket
export async function POST(req: NextRequest) {
  const authResult = await authorize(req, 'tickets:create');
  if (!authResult.authorized) {
    return authResult.response;
  }

  const { user } = authResult.data;

  try {
    const body = await req.json();
    const data = CreateTicketSchema.parse(body);

    // Validate customer exists if provided
    if (data.customerId) {
      const customer = await prisma.customer.findFirst({
        where: {
          id: data.customerId,
          companyId: user.companyId,
        },
      });

      if (!customer) {
        return NextResponse.json(
          { error: 'Cliente não encontrado' },
          { status: 404 }
        );
      }
    }

    // Validate assignee exists if provided
    if (data.assignedToId) {
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

    const ticket = await prisma.ticket.create({
      data: {
        companyId: user.companyId,
        createdById: user.id,
        subject: data.subject,
        description: data.description,
        priority: data.priority,
        category: data.category,
        customerId: data.customerId,
        assignedToId: data.assignedToId || user.id, // Auto-assign to creator if not specified
        tags: data.tags || [],
        slaDeadline: data.slaDeadline ? new Date(data.slaDeadline) : undefined,
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

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        companyId: user.companyId,
        action: 'TICKET_CREATED',
        resource: `ticket:${ticket.id}`,
        metadata: {
          ticketId: ticket.id,
          subject: ticket.subject,
          priority: ticket.priority,
        },
      },
    }).catch((err: any) => console.error('Failed to create audit log:', err));

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { error: 'Erro ao criar ticket', details: error.message },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@wacrm/db";

// Validation schemas
const UpdateCustomerBody = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal("")),
  tags: z.array(z.string()).optional(),
});

// GET /api/customers/[id] - Get customer details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const customer = await prisma.customer.findFirst({
      where: {
        id: id,
        companyId: "company-1", // TODO: Get from auth
      },
      include: {
        Order: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            OrderItem: {
              include: {
                Product: true,
              },
            },
          },
        },
        Quote: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            QuoteItem: {
              include: {
                Product: true,
              },
            },
          },
        },
        WhatsMessage: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        _count: {
          select: {
            Order: true,
            Quote: true,
            WhatsMessage: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 }
      );
    }

    // Calculate metrics
    const totalSpent = await prisma.order.aggregate({
      where: {
        customerId: id,
        status: "PAID",
      },
      _sum: {
        total: true,
      },
    });

    const firstOrder = await prisma.order.findFirst({
      where: { customerId: id },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });

    return NextResponse.json({
      customer: {
        ...customer,
        orders: customer.Order,
        quotes: customer.Quote,
        messages: customer.WhatsMessage,
        metrics: {
          totalSpent: totalSpent._sum?.total || 0,
          totalOrders: customer._count.Order,
          totalQuotes: customer._count.Quote,
          totalMessages: customer._count.WhatsMessage,
          firstOrderDate: firstOrder?.createdAt || null,
          averageTicket:
            customer._count.Order > 0
              ? (totalSpent._sum?.total || 0) / customer._count.Order
              : 0,
        },
        _count: {
          orders: customer._count.Order,
          quotes: customer._count.Quote,
          messages: customer._count.WhatsMessage,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching customer:", error);
    return NextResponse.json(
      { error: "Erro ao buscar cliente" },
      { status: 500 }
    );
  }
}

// PATCH /api/customers/[id] - Update customer
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const data = UpdateCustomerBody.parse(body);

    // Check if customer exists
    const existing = await prisma.customer.findFirst({
      where: {
        id: id,
        companyId: "company-1", // TODO: Get from auth
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 }
      );
    }

    // Update customer
    const customer = await prisma.customer.update({
      where: { id: id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.email !== undefined && { email: data.email || null }),
        ...(data.tags && { tags: data.tags }),
      },
      include: {
        _count: {
          select: {
            Order: true,
            Quote: true,
            WhatsMessage: true,
          },
        },
      },
    });

    return NextResponse.json({
      customer: {
        ...customer,
        _count: {
          orders: customer._count.Order,
          quotes: customer._count.Quote,
          messages: customer._count.WhatsMessage,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating customer:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar cliente" },
      { status: 500 }
    );
  }
}

// DELETE /api/customers/[id] - Delete customer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Check if customer exists and has no orders/quotes
    const customer = await prisma.customer.findFirst({
      where: {
        id: id,
        companyId: "company-1", // TODO: Get from auth
      },
      include: {
        _count: {
          select: {
            Order: true,
            Quote: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 }
      );
    }

    if (customer._count.Order > 0 || customer._count.Quote > 0) {
      return NextResponse.json(
        {
          error: "Não é possível deletar cliente com pedidos ou orçamentos existentes",
        },
        { status: 400 }
      );
    }

    await prisma.customer.delete({
      where: { id: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { error: "Erro ao deletar cliente" },
      { status: 500 }
    );
  }
}

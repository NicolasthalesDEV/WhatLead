import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@wacrm/db";

// Validation schemas
const UpdateCustomerBody = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal("")),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
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
        orders: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
        quotes: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        funnelCards: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            stage: true,
          },
        },
        _count: {
          select: {
            orders: true,
            quotes: true,
            messages: true,
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
        metrics: {
          totalSpent: totalSpent._sum?.total || 0,
          totalOrders: customer._count.orders,
          totalQuotes: customer._count.quotes,
          totalMessages: customer._count.messages,
          firstOrderDate: firstOrder?.createdAt || null,
          averageTicket:
            customer._count.orders > 0
              ? (totalSpent._sum?.total || 0) / customer._count.orders
              : 0,
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
        ...(data.notes !== undefined && { notes: data.notes || null }),
        ...(data.address !== undefined && { address: data.address || null }),
        ...(data.city !== undefined && { city: data.city || null }),
        ...(data.state !== undefined && { state: data.state || null }),
        ...(data.zipCode !== undefined && { zipCode: data.zipCode || null }),
      },
      include: {
        _count: {
          select: {
            orders: true,
            quotes: true,
            messages: true,
          },
        },
      },
    });

    return NextResponse.json({ customer });
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
            orders: true,
            quotes: true,
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

    if (customer._count.orders > 0 || customer._count.quotes > 0) {
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

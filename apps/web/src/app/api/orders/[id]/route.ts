import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@wacrm/db";
import { authorizeResource } from "@/lib/authorization";

// GET /api/orders/[id] - Obter detalhes completos do pedido
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await authorizeResource(req, id, 'order', 'orders:read');
  if (!authResult.authorized) {
    return authResult.response;
  }

  const { user } = authResult.data;

  const order = await db.order.findFirst({
    where: {
      id,
      companyId: user.companyId,
    },
    include: {
      customer: true,
      quote: true,
      items: {
        include: {
          product: true,
        },
      },
      payments: {
        orderBy: {
          createdAt: "desc",
        },
      },
      history: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ order });
}

// PATCH /api/orders/[id] - Atualizar pedido
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await authorizeResource(req, id, 'order', 'orders:update');
  if (!authResult.authorized) {
    return authResult.response;
  }

  const { user } = authResult.data;
  const body = await req.json();
  const { status, notes } = body;

  // Verificar se o pedido existe
  const existingOrder = await db.order.findFirst({
    where: {
      id,
      companyId: user.companyId,
    },
  });

  if (!existingOrder) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const updateData: any = {};
  const historyEntries: any[] = [];

  // Atualizar status
  if (status && status !== existingOrder.status) {
    updateData.status = status;
    historyEntries.push({
      orderId: id,
      userId: user.id,
      action: "STATUS_CHANGED",
      oldValue: existingOrder.status,
      newValue: status,
      description: `Status alterado de ${existingOrder.status} para ${status}`,
    });
  }

  // Atualizar notas
  if (notes !== undefined && notes !== existingOrder.notes) {
    updateData.notes = notes;
    historyEntries.push({
      orderId: id,
      userId: user.id,
      action: "NOTE_UPDATED",
      oldValue: existingOrder.notes || "",
      newValue: notes,
      description: "Notas atualizadas",
    });
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No changes to update" }, { status: 400 });
  }

  // Atualizar pedido e criar histórico em uma transação
  const order = await db.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
        payments: true,
        history: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    // Criar entradas de histórico
    if (historyEntries.length > 0) {
      await tx.orderHistory.createMany({
        data: historyEntries,
      });
    }

    return updated;
  });

  return NextResponse.json({ order });
}

// DELETE /api/orders/[id] - Cancelar pedido
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await authorizeResource(req, id, 'order', 'orders:cancel');
  if (!authResult.authorized) {
    return authResult.response;
  }

  const { user } = authResult.data;

  const existingOrder = await db.order.findFirst({
    where: {
      id,
      companyId: user.companyId,
    },
  });

  if (!existingOrder) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Não permitir cancelar pedidos já pagos
  if (existingOrder.status === "PAID") {
    return NextResponse.json(
      { error: "Cannot cancel paid orders" },
      { status: 400 }
    );
  }

  // Atualizar status para cancelado e criar histórico
  const order = await db.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id },
      data: { status: "CANCELED" },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
        payments: true,
      },
    });

    await tx.orderHistory.create({
      data: {
        orderId: id,
        userId: user.id,
        action: "CANCELED",
        oldValue: existingOrder.status,
        newValue: "CANCELED",
        description: "Pedido cancelado",
      },
    });

    return updated;
  });

  return NextResponse.json({ order });
}

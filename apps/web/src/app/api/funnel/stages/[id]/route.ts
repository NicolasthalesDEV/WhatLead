import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@wacrm/db";
import { requireAuth } from "@/lib/auth";

// GET /api/funnel/stages/[id] - Obter detalhes de um estágio
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string> } }
) {
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stage = await db.funnelStage.findFirst({
    where: {
      id: params.id,
      companyId: authResult.companyId,
    },
    include: {
      _count: {
        select: {
          cards: true,
        },
      },
    },
  });

  if (!stage) {
    return NextResponse.json({ error: "Stage not found" }, { status: 404 });
  }

  return NextResponse.json({ stage });
}

// PATCH /api/funnel/stages/[id] - Atualizar estágio
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string> } }
) {
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, description, color, order, isActive } = body;

  // Verificar se o estágio pertence à empresa
  const existingStage = await db.funnelStage.findFirst({
    where: {
      id: params.id,
      companyId: authResult.companyId,
    },
  });

  if (!existingStage) {
    return NextResponse.json({ error: "Stage not found" }, { status: 404 });
  }

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (color !== undefined) updateData.color = color;
  if (isActive !== undefined) updateData.isActive = isActive;

  // Se a ordem mudou, precisamos reorganizar
  if (order !== undefined && order !== existingStage.order) {
    // Primeiro, atualizar todas as stages afetadas
    if (order > existingStage.order) {
      // Movendo para baixo: decrementar ordem dos estágios entre a posição antiga e nova
      await db.funnelStage.updateMany({
        where: {
          companyId: authResult.companyId,
          order: {
            gt: existingStage.order,
            lte: order,
          },
        },
        data: {
          order: {
            decrement: 1,
          },
        },
      });
    } else {
      // Movendo para cima: incrementar ordem dos estágios entre a nova e antiga posição
      await db.funnelStage.updateMany({
        where: {
          companyId: authResult.companyId,
          order: {
            gte: order,
            lt: existingStage.order,
          },
        },
        data: {
          order: {
            increment: 1,
          },
        },
      });
    }
    updateData.order = order;
  }

  const stage = await db.funnelStage.update({
    where: { id: params.id },
    data: updateData,
    include: {
      _count: {
        select: {
          cards: true,
        },
      },
    },
  });

  return NextResponse.json({ stage });
}

// DELETE /api/funnel/stages/[id] - Deletar estágio
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string> } }
) {
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stage = await db.funnelStage.findFirst({
    where: {
      id: params.id,
      companyId: authResult.companyId,
    },
    include: {
      _count: {
        select: {
          cards: true,
        },
      },
    },
  });

  if (!stage) {
    return NextResponse.json({ error: "Stage not found" }, { status: 404 });
  }

  // Não permitir deletar se tiver cards
  if (stage._count.cards > 0) {
    return NextResponse.json(
      { error: "Cannot delete stage with cards" },
      { status: 400 }
    );
  }

  await db.funnelStage.delete({
    where: { id: params.id },
  });

  // Reorganizar ordem dos estágios restantes
  await db.funnelStage.updateMany({
    where: {
      companyId: authResult.companyId,
      order: {
        gt: stage.order,
      },
    },
    data: {
      order: {
        decrement: 1,
      },
    },
  });

  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@wacrm/db";
import { requireAuth } from "@/lib/auth";

// GET /api/funnel/stages/[id] - Obter detalhes de um estágio
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const funnelStage = (db as any).funnelStage;

  if (!funnelStage) {
    return NextResponse.json(
      { error: "Funnel stages are not available in current database schema" },
      { status: 501 }
    );
  }

  const stage = await funnelStage.findFirst({
    where: {
      id: id,
      companyId: authResult.companyId,
    },
  });

  if (!stage) {
    return NextResponse.json({ error: "Stage not found" }, { status: 404 });
  }

  return NextResponse.json({
    stage: {
      ...stage,
      description: null,
      color: null,
      isActive: true,
      _count: { cards: 0 },
    },
  });
}

// PATCH /api/funnel/stages/[id] - Atualizar estágio
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const funnelStage = (db as any).funnelStage;

  if (!funnelStage) {
    return NextResponse.json(
      { error: "Funnel stages are not available in current database schema" },
      { status: 501 }
    );
  }

  const body = await req.json();
  const { name, order } = body;

  // Verificar se o estágio pertence à empresa
  const existingStage = await funnelStage.findFirst({
    where: {
      id: id,
      companyId: authResult.companyId,
    },
  });

  if (!existingStage) {
    return NextResponse.json({ error: "Stage not found" }, { status: 404 });
  }

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;

  // Se a ordem mudou, precisamos reorganizar
  if (order !== undefined && order !== existingStage.order) {
    // Primeiro, atualizar todas as stages afetadas
    if (order > existingStage.order) {
      // Movendo para baixo: decrementar ordem dos estágios entre a posição antiga e nova
      await funnelStage.updateMany({
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
      await funnelStage.updateMany({
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

  const stage = await funnelStage.update({
    where: { id: id },
    data: updateData,
  });

  return NextResponse.json({
    stage: {
      ...stage,
      description: null,
      color: null,
      isActive: true,
      _count: { cards: 0 },
    },
  });
}

// DELETE /api/funnel/stages/[id] - Deletar estágio
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const funnelStage = (db as any).funnelStage;
  const funnelCard = (db as any).funnelCard;

  if (!funnelStage) {
    return NextResponse.json(
      { error: "Funnel stages are not available in current database schema" },
      { status: 501 }
    );
  }

  const stage = await funnelStage.findFirst({
    where: {
      id: id,
      companyId: authResult.companyId,
    },
  });

  if (!stage) {
    return NextResponse.json({ error: "Stage not found" }, { status: 404 });
  }

  // Não permitir deletar se tiver cards
  if (funnelCard) {
    const cardsCount = await funnelCard.count({ where: { stageId: id } });
    if (cardsCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete stage with cards" },
        { status: 400 }
      );
    }
  }

  await funnelStage.delete({
    where: { id: id },
  });

  // Reorganizar ordem dos estágios restantes
  await funnelStage.updateMany({
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

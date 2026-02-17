import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@wacrm/db";
import { requireAuth } from "@/lib/auth";

// GET /api/funnel/cards/[id] - Obter detalhes de um card
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const funnelCard = (db as any).funnelCard;

  if (!funnelCard) {
    return NextResponse.json(
      { error: "Funnel cards are not available in current database schema" },
      { status: 501 }
    );
  }

  const card = await funnelCard.findFirst({
    where: {
      id: id,
      companyId: authResult.companyId,
    },
    include: {
      stage: true,
      customer: true,
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  return NextResponse.json({ card });
}

// PATCH /api/funnel/cards/[id] - Atualizar card
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const funnelCard = (db as any).funnelCard;
  const funnelStage = (db as any).funnelStage;

  if (!funnelCard || !funnelStage) {
    return NextResponse.json(
      { error: "Funnel cards are not available in current database schema" },
      { status: 501 }
    );
  }

  const body = await req.json();
  const {
    stageId,
    title,
    description,
    value,
    probability,
    email,
    phone,
    tags,
    assignedToId,
    position,
  } = body;

  // Verificar se o card pertence à empresa
  const existingCard = await funnelCard.findFirst({
    where: {
      id: id,
      companyId: authResult.companyId,
    },
  });

  if (!existingCard) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const updateData: any = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (value !== undefined) updateData.value = value ? parseFloat(value) : null;
  if (probability !== undefined) updateData.probability = probability;
  if (email !== undefined) updateData.email = email;
  if (phone !== undefined) updateData.phone = phone;
  if (tags !== undefined) updateData.tags = tags;
  if (assignedToId !== undefined) updateData.assignedToId = assignedToId;
  
  updateData.lastActivityAt = new Date();

  // Se mudou de estágio
  if (stageId && stageId !== existingCard.stageId) {
    // Verificar se o novo estágio existe
    const newStage = await funnelStage.findFirst({
      where: {
        id: stageId,
        companyId: authResult.companyId,
      },
    });

    if (!newStage) {
      return NextResponse.json({ error: "Stage not found" }, { status: 404 });
    }

    // Encontrar a próxima posição no novo estágio
    const lastCardInNewStage = await funnelCard.findFirst({
      where: { stageId },
      orderBy: { position: "desc" },
    });

    updateData.stageId = stageId;
    updateData.position = lastCardInNewStage ? lastCardInNewStage.position + 1 : 1;
    updateData.enteredStageAt = new Date();

    // Reorganizar cards no estágio antigo
    await funnelCard.updateMany({
      where: {
        stageId: existingCard.stageId,
        position: {
          gt: existingCard.position,
        },
      },
      data: {
        position: {
          decrement: 1,
        },
      },
    });
  } else if (position !== undefined && position !== existingCard.position) {
    // Se mudou a posição dentro do mesmo estágio
    if (position > existingCard.position) {
      // Movendo para baixo
      await funnelCard.updateMany({
        where: {
          stageId: existingCard.stageId,
          position: {
            gt: existingCard.position,
            lte: position,
          },
        },
        data: {
          position: {
            decrement: 1,
          },
        },
      });
    } else {
      // Movendo para cima
      await funnelCard.updateMany({
        where: {
          stageId: existingCard.stageId,
          position: {
            gte: position,
            lt: existingCard.position,
          },
        },
        data: {
          position: {
            increment: 1,
          },
        },
      });
    }
    updateData.position = position;
  }

  const card = await funnelCard.update({
    where: { id: id },
    data: updateData,
    include: {
      stage: true,
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
    },
  });

  return NextResponse.json({ card });
}

// DELETE /api/funnel/cards/[id] - Deletar card
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const funnelCard = (db as any).funnelCard;

  if (!funnelCard) {
    return NextResponse.json(
      { error: "Funnel cards are not available in current database schema" },
      { status: 501 }
    );
  }

  const card = await funnelCard.findFirst({
    where: {
      id: id,
      companyId: authResult.companyId,
    },
  });

  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  await funnelCard.delete({
    where: { id: id },
  });

  // Reorganizar posições dos cards restantes no estágio
  await funnelCard.updateMany({
    where: {
      stageId: card.stageId,
      position: {
        gt: card.position,
      },
    },
    data: {
      position: {
        decrement: 1,
      },
    },
  });

  return NextResponse.json({ success: true });
}

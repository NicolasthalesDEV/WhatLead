import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@wacrm/db";
import { requireAuth } from "@/lib/auth";

// GET /api/funnel/cards/[id] - Obter detalhes de um card
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const card = await db.funnelCard.findFirst({
    where: {
      id: params.id,
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
  { params }: { params: { id: string } }
) {
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  const existingCard = await db.funnelCard.findFirst({
    where: {
      id: params.id,
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
    const newStage = await db.funnelStage.findFirst({
      where: {
        id: stageId,
        companyId: authResult.companyId,
      },
    });

    if (!newStage) {
      return NextResponse.json({ error: "Stage not found" }, { status: 404 });
    }

    // Encontrar a próxima posição no novo estágio
    const lastCardInNewStage = await db.funnelCard.findFirst({
      where: { stageId },
      orderBy: { position: "desc" },
    });

    updateData.stageId = stageId;
    updateData.position = lastCardInNewStage ? lastCardInNewStage.position + 1 : 1;
    updateData.enteredStageAt = new Date();

    // Reorganizar cards no estágio antigo
    await db.funnelCard.updateMany({
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
      await db.funnelCard.updateMany({
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
      await db.funnelCard.updateMany({
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

  const card = await db.funnelCard.update({
    where: { id: params.id },
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
  { params }: { params: { id: string } }
) {
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const card = await db.funnelCard.findFirst({
    where: {
      id: params.id,
      companyId: authResult.companyId,
    },
  });

  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  await db.funnelCard.delete({
    where: { id: params.id },
  });

  // Reorganizar posições dos cards restantes no estágio
  await db.funnelCard.updateMany({
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

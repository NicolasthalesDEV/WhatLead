import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@wacrm/db";
import { requireAuth } from "@/lib/auth";

// POST /api/funnel/cards/[id]/move - Mover card para outro estágio/posição
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string> } }
) {
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { stageId, position } = body;

  if (!stageId || position === undefined) {
    return NextResponse.json(
      { error: "StageId and position are required" },
      { status: 400 }
    );
  }

  // Verificar se o card existe e pertence à empresa
  const card = await db.funnelCard.findFirst({
    where: {
      id: params.id,
      companyId: authResult.companyId,
    },
  });

  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  // Verificar se o novo estágio existe e pertence à empresa
  const newStage = await db.funnelStage.findFirst({
    where: {
      id: stageId,
      companyId: authResult.companyId,
    },
  });

  if (!newStage) {
    return NextResponse.json({ error: "Stage not found" }, { status: 404 });
  }

  const oldStageId = card.stageId;
  const oldPosition = card.position;

  // Se mudou de estágio
  if (stageId !== oldStageId) {
    // 1. Remover do estágio antigo (reorganizar posições)
    await db.funnelCard.updateMany({
      where: {
        stageId: oldStageId,
        position: {
          gt: oldPosition,
        },
      },
      data: {
        position: {
          decrement: 1,
        },
      },
    });

    // 2. Abrir espaço no novo estágio
    await db.funnelCard.updateMany({
      where: {
        stageId: stageId,
        position: {
          gte: position,
        },
      },
      data: {
        position: {
          increment: 1,
        },
      },
    });

    // 3. Mover o card
    const movedCard = await db.funnelCard.update({
      where: { id: params.id },
      data: {
        stageId,
        position,
        enteredStageAt: new Date(),
        lastActivityAt: new Date(),
      },
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

    return NextResponse.json({ card: movedCard });
  }

  // Se mudou apenas a posição dentro do mesmo estágio
  if (position !== oldPosition) {
    if (position > oldPosition) {
      // Movendo para baixo: decrementar cards entre oldPosition e position
      await db.funnelCard.updateMany({
        where: {
          stageId: oldStageId,
          position: {
            gt: oldPosition,
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
      // Movendo para cima: incrementar cards entre position e oldPosition
      await db.funnelCard.updateMany({
        where: {
          stageId: oldStageId,
          position: {
            gte: position,
            lt: oldPosition,
          },
        },
        data: {
          position: {
            increment: 1,
          },
        },
      });
    }

    const movedCard = await db.funnelCard.update({
      where: { id: params.id },
      data: {
        position,
        lastActivityAt: new Date(),
      },
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

    return NextResponse.json({ card: movedCard });
  }

  // Nenhuma mudança
  return NextResponse.json({ card });
}

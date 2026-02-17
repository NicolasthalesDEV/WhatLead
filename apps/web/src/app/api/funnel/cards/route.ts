import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@wacrm/db";
import { requireAuth } from "@/lib/auth";

// GET /api/funnel/cards - Listar todos os cards do funil
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const funnelCard = (db as any).funnelCard;

  if (!funnelCard) {
    return NextResponse.json({ cards: [] });
  }

  const { searchParams } = new URL(req.url);
  const stageId = searchParams.get("stageId");

  const where: any = {
    companyId: authResult.companyId,
  };

  if (stageId) {
    where.stageId = stageId;
  }

  const cards = await funnelCard.findMany({
    where,
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
    orderBy: [
      { stageId: "asc" },
      { position: "asc" },
    ],
  });

  return NextResponse.json({ cards });
}

// POST /api/funnel/cards - Criar novo card
export async function POST(req: NextRequest) {
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
    customerId,
    title,
    description,
    value,
    probability,
    email,
    phone,
    tags,
    assignedToId,
  } = body;

  if (!stageId || !title) {
    return NextResponse.json(
      { error: "StageId and title are required" },
      { status: 400 }
    );
  }

  // Verificar se o estágio existe e pertence à empresa
  const stage = await funnelStage.findFirst({
    where: {
      id: stageId,
      companyId: authResult.companyId,
    },
  });

  if (!stage) {
    return NextResponse.json({ error: "Stage not found" }, { status: 404 });
  }

  // Encontrar a próxima posição no estágio
  const lastCard = await funnelCard.findFirst({
    where: { stageId },
    orderBy: { position: "desc" },
  });

  const nextPosition = lastCard ? lastCard.position + 1 : 1;

  const card = await funnelCard.create({
    data: {
      id: crypto.randomUUID(),
      companyId: authResult.companyId,
      stageId,
      customerId: customerId || null,
      title,
      description,
      value: value ? parseFloat(value) : null,
      probability: probability || 50,
      tags: tags || [],
      assignedToId: assignedToId || null,
      position: nextPosition,
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

  return NextResponse.json({ card }, { status: 201 });
}

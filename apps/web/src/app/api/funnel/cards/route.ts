import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@wacrm/db";
import { requireAuth } from "@/lib/auth";
import crypto from "crypto";

// GET /api/funnel/cards - Listar todos os cards do funil
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const stageId = searchParams.get("stageId");

  const where: any = { companyId: authResult.companyId };
  if (stageId) where.stageId = stageId;

  const cards = await db.funnelCard.findMany({
    where,
    include: {
      Stage: true,
      Customer: { select: { id: true, name: true, phoneE164: true, email: true } },
      AssignedTo: { select: { id: true, name: true, email: true } },
    },
    orderBy: [{ stageId: "asc" }, { position: "asc" }],
  });

  return NextResponse.json({ cards });
}

// POST /api/funnel/cards - Criar novo card
export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { stageId, customerId, title, description, value, probability, tags, assignedToId } = body;

  if (!stageId || !title) {
    return NextResponse.json({ error: "StageId and title are required" }, { status: 400 });
  }

  const stage = await db.funnelStage.findFirst({
    where: { id: stageId, companyId: authResult.companyId },
  });

  if (!stage) {
    return NextResponse.json({ error: "Stage not found" }, { status: 404 });
  }

  const lastCard = await db.funnelCard.findFirst({
    where: { stageId },
    orderBy: { position: "desc" },
  });

  const nextPosition = lastCard ? lastCard.position + 1 : 1;

  const card = await db.funnelCard.create({
    data: {
      id: crypto.randomUUID(),
      companyId: authResult.companyId!,
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
      Stage: true,
      Customer: { select: { id: true, name: true, phoneE164: true, email: true } },
      AssignedTo: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ card }, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@wacrm/db";
import { requireAuth } from "@/lib/auth";
import crypto from "crypto";

// GET /api/funnel/stages - Listar estágios do funil
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const funnelStage = (db as any).funnelStage;

  if (!funnelStage) {
    return NextResponse.json({ stages: [] });
  }

  const stages = await funnelStage.findMany({
    where: {
      companyId: authResult.companyId,
    },
    orderBy: {
      order: "asc",
    },
  });

  return NextResponse.json({
    stages: stages.map((stage: any) => ({
      ...stage,
      description: null,
      color: null,
      isActive: true,
      _count: { cards: 0 },
    })),
  });
}

// POST /api/funnel/stages - Criar novo estágio
export async function POST(req: NextRequest) {
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
  const { name } = body;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  // Encontrar a próxima ordem disponível
  const lastStage = await funnelStage.findFirst({
    where: { companyId: authResult.companyId },
    orderBy: { order: "desc" },
  });

  const nextOrder = lastStage ? lastStage.order + 1 : 1;

  const stage = await funnelStage.create({
    data: {
      id: crypto.randomUUID(),
      companyId: authResult.companyId,
      name,
      order: nextOrder,
      default: false,
    },
  });

  return NextResponse.json(
    {
      stage: {
        ...stage,
        description: null,
        color: null,
        isActive: true,
        _count: { cards: 0 },
      },
    },
    { status: 201 }
  );
}

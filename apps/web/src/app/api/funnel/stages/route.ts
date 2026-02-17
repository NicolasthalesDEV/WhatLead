import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@wacrm/db";
import { requireAuth } from "@/lib/auth";

// GET /api/funnel/stages - Listar estágios do funil
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stages = await db.funnelStage.findMany({
    where: {
      companyId: authResult.companyId,
      isActive: true,
    },
    include: {
      _count: {
        select: {
          cards: true,
        },
      },
    },
    orderBy: {
      order: "asc",
    },
  });

  return NextResponse.json({ stages });
}

// POST /api/funnel/stages - Criar novo estágio
export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, description, color } = body;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  // Encontrar a próxima ordem disponível
  const lastStage = await db.funnelStage.findFirst({
    where: { companyId: authResult.companyId },
    orderBy: { order: "desc" },
  });

  const nextOrder = lastStage ? lastStage.order + 1 : 1;

  const stage = await db.funnelStage.create({
    data: {
      companyId: authResult.companyId,
      name,
      description,
      color: color || "#6366f1",
      order: nextOrder,
    },
    include: {
      _count: {
        select: {
          cards: true,
        },
      },
    },
  });

  return NextResponse.json({ stage }, { status: 201 });
}

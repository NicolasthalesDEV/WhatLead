import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@wacrm/db";

// GET /api/chatbot/triggers
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  const triggers = await prisma.chatbotTrigger.findMany({
    where: { companyId: auth.companyId },
    orderBy: { priority: "desc" },
  });

  return NextResponse.json({ triggers });
}

// POST /api/chatbot/triggers
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  const { name, description, type, flowId, conditions, priority } = await req.json();

  const trigger = await prisma.chatbotTrigger.create({
    data: {
      companyId: auth.companyId,
      name,
      description,
      type,
      flowId,
      conditions: conditions || {},
      priority: priority || 0,
      enabled: true,
    },
  });

  return NextResponse.json({ trigger }, { status: 201 });
}

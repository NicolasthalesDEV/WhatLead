import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@wacrm/db";

// GET /api/chatbot/triggers
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;
  const chatbotTrigger = (prisma as any).chatbotTrigger;

  if (!chatbotTrigger) {
    return NextResponse.json({ triggers: [] });
  }

  const triggers = await chatbotTrigger.findMany({
    where: { companyId: auth.companyId },
    orderBy: { priority: "desc" },
  });

  return NextResponse.json({ triggers });
}

// POST /api/chatbot/triggers
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;
  const chatbotTrigger = (prisma as any).chatbotTrigger;

  if (!chatbotTrigger) {
    return NextResponse.json(
      { error: { code: "NOT_AVAILABLE", message: "Chatbot feature is not available in current database schema" } },
      { status: 501 }
    );
  }

  const { name, description, type, flowId, conditions, priority } = await req.json();

  const trigger = await chatbotTrigger.create({
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

// PUT /api/chatbot/triggers - Update trigger
export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;
  const chatbotTrigger = (prisma as any).chatbotTrigger;

  if (!chatbotTrigger) {
    return NextResponse.json(
      { error: { code: "NOT_AVAILABLE" } },
      { status: 501 }
    );
  }

  const { id, name, description, type, flowId, conditions, priority, enabled } = await req.json();

  const trigger = await chatbotTrigger.update({
    where: { id, companyId: auth.companyId },
    data: {
      name,
      description,
      type,
      flowId,
      conditions,
      priority,
      enabled,
    },
  });

  return NextResponse.json({ trigger });
}

// DELETE /api/chatbot/triggers/{id}
export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;
  const chatbotTrigger = (prisma as any).chatbotTrigger;

  if (!chatbotTrigger) {
    return NextResponse.json(
      { error: { code: "NOT_AVAILABLE" } },
      { status: 501 }
    );
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  await chatbotTrigger.delete({
    where: { id, companyId: auth.companyId },
  });

  return NextResponse.json({ success: true });
}

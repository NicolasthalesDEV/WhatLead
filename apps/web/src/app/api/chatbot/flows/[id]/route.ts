import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@wacrm/db";
import crypto from "crypto";

// GET /api/chatbot/flows/:id
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  const flow = await prisma.chatbotFlow.findFirst({
    where: { id, companyId: auth.companyId },
    include: {
      ChatbotNode: { orderBy: { order: "asc" } },
    },
  });

  if (!flow) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Flow not found" } },
      { status: 404 }
    );
  }

  // Map ChatbotNode → nodes for the frontend
  const mapped = {
    ...flow,
    status: flow.status || (flow.active ? "ACTIVE" : "PAUSED"),
    triggers: flow.triggerKeywords || [],
    nodes: (flow.ChatbotNode as any[]).map((n) => ({
      id: n.id,
      type: n.type,
      data: n.data ?? {},
      position: n.position ?? { x: 0, y: 0 },
      connections: n.connections ?? [],
      order: n.order ?? 0,
    })),
  };

  return NextResponse.json({ flow: mapped });
}

// PUT /api/chatbot/flows/:id
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  const data = await req.json();
  const isActive = data.status === "ACTIVE";

  const result = await prisma.chatbotFlow.updateMany({
    where: { id, companyId: auth.companyId },
    data: {
      name: data.name,
      description: data.description,
      triggerKeywords: data.triggers || data.triggerKeywords,
      priority: data.priority ?? 0,
      status: data.status,
      active: data.status === "ACTIVE" ? true : data.status === "PAUSED" ? false : isActive,
      updatedAt: new Date(),
    },
  });

  if (result.count === 0) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Flow not found" } },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/chatbot/flows/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  const deleted = await prisma.chatbotFlow.deleteMany({
    where: { id, companyId: auth.companyId },
  });

  if (deleted.count === 0) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Flow not found" } },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
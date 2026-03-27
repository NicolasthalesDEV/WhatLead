import { NextRequest, NextResponse } from "next/server";
import { requireAuth, createAuditLog } from "@/lib/auth";
import { prisma } from "@wacrm/db";
import crypto from "crypto";

// GET /api/chatbot/flows - List all flows
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  try {
    const flows = await prisma.chatbotFlow.findMany({
      where: { companyId: auth.companyId },
      include: {
        _count: { select: { ChatbotExecution: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const mapped = flows.map((f) => ({
      id: f.id,
      name: f.name,
      description: f.description,
      status: f.status || (f.active ? "ACTIVE" : "PAUSED"),
      triggers: f.triggerKeywords || [],
      priority: f.priority,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
      _count: { executions: (f._count as any).ChatbotExecution ?? 0 },
    }));

    return NextResponse.json({ flows: mapped });
  } catch (error) {
    console.error("Failed to list flows:", error);
    return NextResponse.json({ flows: [] });
  }
}

// POST /api/chatbot/flows - Create new flow
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  const { name, description, triggers, priority } = await req.json();

  const flow = await prisma.chatbotFlow.create({
    data: {
      id: crypto.randomUUID(),
      companyId: auth.companyId,
      name,
      description: description || null,
      triggerType: "KEYWORD",
      triggerKeywords: triggers || [],
      active: false,
      status: "DRAFT",
      priority: priority ?? 0,
    },
  });

  await createAuditLog({
    userId: auth.userId,
    companyId: auth.companyId!,
    action: 'CHATBOT_FLOW_CREATE',
    resource: 'chatbotFlow',
    resourceId: flow.id,
    req,
  }).catch(() => {});

  return NextResponse.json(
    {
      flow: {
        id: flow.id,
        name: flow.name,
        description: flow.description,
        status: flow.status,
        triggers: flow.triggerKeywords,
        priority: flow.priority,
      },
    },
    { status: 201 }
  );
}

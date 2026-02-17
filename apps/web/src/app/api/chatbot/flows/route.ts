import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@wacrm/db";

// GET /api/chatbot/flows - List all flows
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;
  const chatbotFlow = (prisma as any).chatbotFlow;

  if (!chatbotFlow) {
    return NextResponse.json({ flows: [] });
  }

  const flows = await chatbotFlow.findMany({
    where: { companyId: auth.companyId },
    include: {
      nodes: true,
      _count: {
        select: { executions: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ flows });
}

// POST /api/chatbot/flows - Create new flow
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;
  const chatbotFlow = (prisma as any).chatbotFlow;

  if (!chatbotFlow) {
    return NextResponse.json(
      { error: { code: "NOT_AVAILABLE", message: "Chatbot feature is not available in current database schema" } },
      { status: 501 }
    );
  }

  const { name, description, triggers, priority } = await req.json();

  const flow = await chatbotFlow.create({
    data: {
      companyId: auth.companyId,
      name,
      description,
      triggers: triggers || [],
      priority: priority || 0,
      status: "DRAFT",
    },
  });

  return NextResponse.json({ flow }, { status: 201 });
}

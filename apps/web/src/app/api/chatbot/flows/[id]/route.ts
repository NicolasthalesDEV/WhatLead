import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@wacrm/db";

// GET /api/chatbot/flows/:id
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;
  const chatbotFlow = (prisma as any).chatbotFlow;

  if (!chatbotFlow) {
    return NextResponse.json(
      { error: { code: "NOT_AVAILABLE", message: "Chatbot feature is not available in current database schema" } },
      { status: 501 }
    );
  }

  const flow = await chatbotFlow.findFirst({
    where: {
      id: id,
      companyId: auth.companyId,
    },
    include: {
      nodes: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!flow) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Flow not found" } },
      { status: 404 }
    );
  }

  return NextResponse.json({ flow });
}

// PUT /api/chatbot/flows/:id
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;
  const chatbotFlow = (prisma as any).chatbotFlow;

  if (!chatbotFlow) {
    return NextResponse.json(
      { error: { code: "NOT_AVAILABLE", message: "Chatbot feature is not available in current database schema" } },
      { status: 501 }
    );
  }

  const data = await req.json();

  const flow = await chatbotFlow.updateMany({
    where: {
      id: id,
      companyId: auth.companyId,
    },
    data: {
      name: data.name,
      description: data.description,
      triggers: data.triggers,
      priority: data.priority,
      status: data.status,
    },
  });

  if (flow.count === 0) {
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
  const chatbotFlow = (prisma as any).chatbotFlow;

  if (!chatbotFlow) {
    return NextResponse.json(
      { error: { code: "NOT_AVAILABLE", message: "Chatbot feature is not available in current database schema" } },
      { status: 501 }
    );
  }

  const deleted = await chatbotFlow.deleteMany({
    where: {
      id: id,
      companyId: auth.companyId,
    },
  });

  if (deleted.count === 0) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Flow not found" } },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}

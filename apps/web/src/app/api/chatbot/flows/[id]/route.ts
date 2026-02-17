import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@wacrm/db";

// GET /api/chatbot/flows/:id
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  const flow = await prisma.chatbotFlow.findFirst({
    where: {
      id: params.id,
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
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  const data = await req.json();

  const flow = await prisma.chatbotFlow.updateMany({
    where: {
      id: params.id,
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
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  const deleted = await prisma.chatbotFlow.deleteMany({
    where: {
      id: params.id,
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

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@wacrm/db";
import crypto from "crypto";

// POST /api/chatbot/flows/:id/nodes - Create/update nodes
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  const { id } = await params;
  const { nodes } = await req.json();

  // Verify flow belongs to company
  const flow = await prisma.chatbotFlow.findFirst({
    where: { id, companyId: auth.companyId },
  });

  if (!flow) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Flow not found" } },
      { status: 404 }
    );
  }

  // Delete existing nodes and re-create
  await prisma.chatbotNode.deleteMany({ where: { flowId: id } });

  const now = new Date();
  if (nodes && nodes.length > 0) {
    await prisma.chatbotNode.createMany({
      data: nodes.map((node: any, index: number) => ({
        id: node.id || crypto.randomUUID(),
        flowId: id,
        type: node.type,
        name: node.name || node.type,
        data: node.data ?? {},
        position: node.position ?? { x: 0, y: 0 },
        connections: node.connections ?? [],
        order: node.order ?? index,
        updatedAt: now,
      })),
    });
  }

  return NextResponse.json({ success: true });
}

// GET /api/chatbot/flows/:id/nodes
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  const { id } = await params;

  const flow = await prisma.chatbotFlow.findFirst({
    where: { id, companyId: auth.companyId },
    include: { ChatbotNode: { orderBy: { order: "asc" } } },
  });

  if (!flow) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Flow not found" } },
      { status: 404 }
    );
  }

  const nodes = (flow.ChatbotNode as any[]).map((n) => ({
    id: n.id,
    type: n.type,
    data: n.data ?? {},
    position: n.position ?? { x: 0, y: 0 },
    connections: n.connections ?? [],
    order: n.order ?? 0,
  }));

  return NextResponse.json({ nodes });
}
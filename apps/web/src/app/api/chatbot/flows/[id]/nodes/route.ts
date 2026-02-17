import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@wacrm/db";

// POST /api/chatbot/flows/:id/nodes - Create/update nodes
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;
  const chatbotFlow = (prisma as any).chatbotFlow;
  const chatbotNode = (prisma as any).chatbotNode;

  if (!chatbotFlow || !chatbotNode) {
    return NextResponse.json(
      { error: { code: "NOT_AVAILABLE", message: "Chatbot feature is not available in current database schema" } },
      { status: 501 }
    );
  }

  const { id } = await params;
  const { nodes } = await req.json();

  // Verify flow belongs to company
  const flow = await chatbotFlow.findFirst({
    where: {
      id,
      companyId: auth.companyId,
    },
  });

  if (!flow) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Flow not found" } },
      { status: 404 }
    );
  }

  // Delete existing nodes and create new ones
  await chatbotNode.deleteMany({
    where: { flowId: id },
  });

  if (nodes && nodes.length > 0) {
    await chatbotNode.createMany({
      data: nodes.map((node: any, index: number) => ({
        flowId: id,
        type: node.type,
        position: node.position || { x: 0, y: 0 },
        data: node.data || {},
        connections: node.connections || [],
        order: node.order || index,
      })),
    });
  }

  return NextResponse.json({ success: true });
}

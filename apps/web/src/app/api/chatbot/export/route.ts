import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@wacrm/db";

// POST /api/chatbot/export - Export flow as JSON
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  const { flowId } = await req.json();
  const chatbotFlow = (prisma as any).chatbotFlow;

  if (!chatbotFlow) {
    return NextResponse.json({ error: "Not available" }, { status: 501 });
  }

  const flow = await chatbotFlow.findUnique({
    where: { id: flowId, companyId: auth.companyId },
    include: { nodes: true },
  });

  if (!flow) {
    return NextResponse.json({ error: "Flow not found" }, { status: 404 });
  }

  const exportData = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    flow: {
      name: flow.name,
      description: flow.description,
      triggerType: flow.triggerType,
      triggerKeywords: flow.triggerKeywords,
      nodes: flow.nodes,
    },
  };

  return NextResponse.json(exportData);
}

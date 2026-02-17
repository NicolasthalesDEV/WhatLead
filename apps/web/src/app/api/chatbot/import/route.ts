import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@wacrm/db";
import crypto from "crypto";

// POST /api/chatbot/import - Import flow from JSON
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  const { flowData } = await req.json();
  const chatbotFlow = (prisma as any).chatbotFlow;

  if (!chatbotFlow) {
    return NextResponse.json({ error: "Not available" }, { status: 501 });
  }

  if (!flowData || !flowData.flow) {
    return NextResponse.json({ error: "Invalid flow data" }, { status: 400 });
  }

  // Create new flow
  const flow = await chatbotFlow.create({
    data: {
      id: crypto.randomUUID(),
      companyId: auth.companyId,
      name: flowData.flow.name + " (Importado)",
      description: flowData.flow.description,
      triggerType: flowData.flow.triggerType || "KEYWORD",
      triggerKeywords: flowData.flow.triggerKeywords || [],
      active: false,
      status: "DRAFT",
    },
  });

  // Create nodes
  const chatbotNode = (prisma as any).chatbotNode;
  if (chatbotNode && flowData.flow.nodes) {
    for (const node of flowData.flow.nodes) {
      await chatbotNode.create({
        data: {
          id: crypto.randomUUID(),
          flowId: flow.id,
          type: node.type,
          name: node.name,
          config: node.config,
          position: node.position,
        },
      });
    }
  }

  return NextResponse.json({ flow }, { status: 201 });
}

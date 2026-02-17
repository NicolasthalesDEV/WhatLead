import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

// POST /api/chatbot/test - Test a chatbot flow without activating it
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  const { flowId, userMessage } = await req.json();

  if (!flowId) {
    return NextResponse.json({ error: "Flow ID required" }, { status: 400 });
  }

  // Simulate message processing
  const testResponse = {
    flowId,
    userMessage: userMessage || "oi",
    botResponses: [
      {
        nodeId: "node-1",
        type: "MESSAGE",
        content: "Esta é uma resposta de teste do chatbot.",
        timestamp: new Date().toISOString(),
      },
    ],
    status: "success",
    executionTime: 245,
  };

  return NextResponse.json(testResponse);
}

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@wacrm/db";

// GET /api/chatbot/analytics
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  const { searchParams } = new URL(req.url);
  const flowId = searchParams.get("flowId");
  const days = parseInt(searchParams.get("days") || "30");

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const where: any = {
    companyId: auth.companyId,
    date: { gte: startDate },
  };

  if (flowId) {
    where.flowId = flowId;
  }

  const analytics = await prisma.chatbotAnalytics.findMany({
    where,
    orderBy: { date: "desc" },
  });

  // Calculate summary
  const summary = analytics.reduce(
    (acc, curr) => ({
      totalExecutions: acc.totalExecutions + curr.totalExecutions,
      completed: acc.completed + curr.completed,
      failed: acc.failed + curr.failed,
      handoffs: acc.handoffs + curr.handoffs,
    }),
    { totalExecutions: 0, completed: 0, failed: 0, handoffs: 0 }
  );

  return NextResponse.json({ analytics, summary });
}

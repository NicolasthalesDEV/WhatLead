import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@wacrm/db";

// GET /api/chatbot/analytics
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;
  const chatbotAnalytics = (prisma as any).chatbotAnalytics;

  if (!chatbotAnalytics) {
    return NextResponse.json({ analytics: [], summary: { totalExecutions: 0, completed: 0, failed: 0, handoffs: 0 } });
  }

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

  const analytics = (await chatbotAnalytics.findMany({
    where,
    orderBy: { date: "desc" },
  })) as Array<{
    totalExecutions?: number;
    completed?: number;
    failed?: number;
    handoffs?: number;
  }>;

  // Calculate summary
  const summary = analytics.reduce(
    (acc: { totalExecutions: number; completed: number; failed: number; handoffs: number }, curr) => ({
      totalExecutions: acc.totalExecutions + (curr.totalExecutions || 0),
      completed: acc.completed + (curr.completed || 0),
      failed: acc.failed + (curr.failed || 0),
      handoffs: acc.handoffs + (curr.handoffs || 0),
    }),
    { totalExecutions: 0, completed: 0, failed: 0, handoffs: 0 }
  );

  return NextResponse.json({ analytics, summary });
}

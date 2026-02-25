import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wacrm/db";
import { verifyAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// ── GET /api/api-costs ─────────────────────────────────────────
// Returns aggregated API usage/cost data for the authenticated company.
// Query params:
//   period: "7d" | "30d" | "90d" | "custom" (default: "30d")
//   from:   ISO date string (when period=custom)
//   to:     ISO date string (when period=custom)
// ──────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await verifyAuth(req);
  if (!session?.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") ?? "30d";

  let fromDate: Date;
  let toDate = new Date();

  if (period === "custom") {
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    if (!fromParam || !toParam) {
      return NextResponse.json({ error: "Missing from/to params" }, { status: 400 });
    }
    fromDate = new Date(fromParam);
    toDate = new Date(toParam);
  } else {
    const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
    fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
  }

  const companyId = session.companyId;

  // ── 1. Raw logs in range ──
  const logs = await prisma.apiUsageLog.findMany({
    where: {
      companyId,
      createdAt: { gte: fromDate, lte: toDate },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      provider: true,
      operation: true,
      inputUnits: true,
      outputUnits: true,
      costUsd: true,
      model: true,
      customerId: true,
      createdAt: true,
    },
  });

  // ── 2. Totals by provider ──
  const byProvider: Record<string, { calls: number; costUsd: number; inputUnits: number; outputUnits: number }> = {};
  for (const log of logs) {
    if (!byProvider[log.provider]) {
      byProvider[log.provider] = { calls: 0, costUsd: 0, inputUnits: 0, outputUnits: 0 };
    }
    byProvider[log.provider].calls++;
    byProvider[log.provider].costUsd += log.costUsd;
    byProvider[log.provider].inputUnits += log.inputUnits;
    byProvider[log.provider].outputUnits += log.outputUnits;
  }

  // ── 3. Totals by operation ──
  const byOperation: Record<string, { calls: number; costUsd: number }> = {};
  for (const log of logs) {
    const key = `${log.provider}:${log.operation}`;
    if (!byOperation[key]) byOperation[key] = { calls: 0, costUsd: 0 };
    byOperation[key].calls++;
    byOperation[key].costUsd += log.costUsd;
  }

  // ── 4. Daily cost series (for chart) ──
  const dailyMap: Record<string, { date: string; costUsd: number; calls: number }> = {};
  for (const log of logs) {
    const day = log.createdAt.toISOString().slice(0, 10);
    if (!dailyMap[day]) dailyMap[day] = { date: day, costUsd: 0, calls: 0 };
    dailyMap[day].costUsd += log.costUsd;
    dailyMap[day].calls++;
  }
  const dailySeries = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

  // ── 5. Cost by customer (top 10) ──
  const customerMap: Record<string, { customerId: string; costUsd: number; calls: number }> = {};
  for (const log of logs) {
    if (!log.customerId) continue;
    if (!customerMap[log.customerId]) {
      customerMap[log.customerId] = { customerId: log.customerId, costUsd: 0, calls: 0 };
    }
    customerMap[log.customerId].costUsd += log.costUsd;
    customerMap[log.customerId].calls++;
  }
  const topCustomers = Object.values(customerMap)
    .sort((a, b) => b.costUsd - a.costUsd)
    .slice(0, 10);

  // Enrich with customer names
  const customerIds = topCustomers.map((c) => c.customerId);
  const customers = customerIds.length
    ? await prisma.customer.findMany({
        where: { id: { in: customerIds } },
        select: { id: true, name: true, phoneE164: true },
      })
    : [];
  const customerNameMap = Object.fromEntries(customers.map((c) => [c.id, c]));

  const enrichedTopCustomers = topCustomers.map((c) => ({
    ...c,
    name: customerNameMap[c.customerId]?.name ?? "Desconhecido",
    phone: customerNameMap[c.customerId]?.phoneE164 ?? "",
  }));

  // ── 6. Summary ──
  const totalCost = logs.reduce((sum, l) => sum + l.costUsd, 0);
  const totalCalls = logs.length;

  return NextResponse.json({
    period: { from: fromDate.toISOString(), to: toDate.toISOString() },
    summary: {
      totalCostUsd: totalCost,
      totalCalls,
    },
    byProvider: Object.entries(byProvider).map(([provider, data]) => ({ provider, ...data })),
    byOperation: Object.entries(byOperation).map(([key, data]) => {
      const [provider, operation] = key.split(":");
      return { provider, operation, ...data };
    }),
    dailySeries,
    topCustomers: enrichedTopCustomers,
  });
}

// ── POST /api/api-costs ────────────────────────────────────────
// Ingest a new usage log entry (called from server-side integrations).
// Body: { provider, operation, inputUnits, outputUnits, costUsd, model?, customerId? }
// ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await verifyAuth(req);
  if (!session?.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { provider, operation, inputUnits = 0, outputUnits = 0, costUsd = 0, model, customerId } = body;

  if (!provider || !operation) {
    return NextResponse.json({ error: "provider and operation are required" }, { status: 400 });
  }

  const log = await prisma.apiUsageLog.create({
    data: {
      companyId: session.companyId,
      provider,
      operation,
      inputUnits,
      outputUnits,
      costUsd,
      model: model ?? null,
      customerId: customerId ?? null,
    },
  });

  return NextResponse.json({ ok: true, id: log.id }, { status: 201 });
}

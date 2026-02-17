import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@wacrm/db";
import { requireAuth } from "@/lib/auth";
import { subDays, startOfDay, endOfDay, format } from "date-fns";

// GET /api/reports/overview - Visão geral do dashboard
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") || "30");
  const companyId = authResult.companyId;

  try {
    const startDate = startOfDay(subDays(new Date(), days));
    const endDate = endOfDay(new Date());

    // Métricas agregadas do período
    const metrics = await db.dailyMetric.aggregate({
      where: {
        companyId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        totalOrders: true,
        totalRevenue: true,
        newCustomers: true,
        quotesCreated: true,
        quotesAccepted: true,
        messagesReceived: true,
        messagesSent: true,
        paymentsReceived: true,
        pixPayments: true,
      },
      _avg: {
        averageOrderValue: true,
        conversionRate: true,
        responseTime: true,
      },
    });

    // Total de clientes ativos
    const totalCustomers = await db.customer.count({
      where: { companyId },
    });

    // Total de produtos ativos
    const totalProducts = await db.product.count({
      where: { companyId, active: true },
    });

    // Pedidos por status
    const ordersByStatus = await db.order.groupBy({
      by: ["status"],
      where: {
        companyId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: true,
    });

    // Tendência diária (últimos 7 dias)
    const dailyTrend = await db.dailyMetric.findMany({
      where: {
        companyId,
        date: {
          gte: startOfDay(subDays(new Date(), 7)),
        },
      },
      orderBy: { date: "asc" },
      select: {
        date: true,
        totalOrders: true,
        totalRevenue: true,
        newCustomers: true,
        conversionRate: true,
      },
    });

    return NextResponse.json({
      period: { days, startDate, endDate },
      summary: {
        totalOrders: metrics._sum.totalOrders || 0,
        totalRevenue: metrics._sum.totalRevenue || 0,
        averageOrderValue: metrics._avg.averageOrderValue || 0,
        newCustomers: metrics._sum.newCustomers || 0,
        totalCustomers,
        totalProducts,
        quotesCreated: metrics._sum.quotesCreated || 0,
        quotesAccepted: metrics._sum.quotesAccepted || 0,
        conversionRate: metrics._avg.conversionRate || 0,
        messagesReceived: metrics._sum.messagesReceived || 0,
        messagesSent: metrics._sum.messagesSent || 0,
        averageResponseTime: metrics._avg.responseTime || 0,
        paymentsReceived: metrics._sum.paymentsReceived || 0,
        pixPayments: metrics._sum.pixPayments || 0,
      },
      ordersByStatus,
      dailyTrend,
    });
  } catch (error) {
    console.error("Failed to fetch overview:", error);
    return NextResponse.json(
      { error: "Failed to fetch overview" },
      { status: 500 }
    );
  }
}

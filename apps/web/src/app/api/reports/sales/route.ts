import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@wacrm/db";
import { requireAuth } from "@/lib/auth";
import { subDays, startOfDay, endOfDay } from "date-fns";

// GET /api/reports/sales - Relatório de vendas
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

    // Vendas por dia
    const dailySales = await db.dailyMetric.findMany({
      where: {
        companyId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: "asc" },
      select: {
        date: true,
        totalOrders: true,
        totalRevenue: true,
        averageOrderValue: true,
      },
    });

    // Top produtos
    const topProducts = await db.productMetric.groupBy({
      by: ["productId"],
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        orders: true,
        revenue: true,
      },
      orderBy: {
        _sum: {
          revenue: "desc",
        },
      },
      take: 10,
    });

    // Buscar detalhes dos produtos
    const productIds = topProducts.map((p) => p.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, title: true, imageUrl: true },
    });

    const topProductsWithDetails = topProducts.map((metric) => {
      const product = products.find((p) => p.id === metric.productId);
      return {
        productId: metric.productId,
        productName: product?.title || "Produto Desconhecido",
        imageUrl: product?.imageUrl,
        orders: metric._sum.orders || 0,
        revenue: metric._sum.revenue || 0,
      };
    });

    // Métricas totais
    const totals = await db.dailyMetric.aggregate({
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
      },
      _avg: {
        averageOrderValue: true,
      },
    });

    return NextResponse.json({
      period: { days, startDate, endDate },
      totals: {
        totalOrders: totals._sum.totalOrders || 0,
        totalRevenue: totals._sum.totalRevenue || 0,
        averageOrderValue: totals._avg.averageOrderValue || 0,
      },
      dailySales,
      topProducts: topProductsWithDetails,
    });
  } catch (error) {
    console.error("Failed to fetch sales report:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales report" },
      { status: 500 }
    );
  }
}

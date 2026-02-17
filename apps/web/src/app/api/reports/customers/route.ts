import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@wacrm/db";
import { requireAuth } from "@/lib/auth";
import { subDays, startOfDay, endOfDay } from "date-fns";

// GET /api/reports/customers - Relatório de clientes
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

    // Novos clientes por dia
    const dailyNewCustomers = await db.dailyMetric.findMany({
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
        newCustomers: true,
        activeCustomers: true,
      },
    });

    // Top clientes por valor
    const topCustomers = await db.customerMetric.findMany({
      where: {
        customer: {
          companyId,
        },
      },
      orderBy: {
        totalSpent: "desc",
      },
      take: 10,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneE164: true,
          },
        },
      },
    });

    // Segmentação de clientes
    const segmentation = await db.customerMetric.groupBy({
      by: ["segment"],
      where: {
        customer: {
          companyId,
        },
        segment: {
          not: null,
        },
      },
      _count: true,
    });

    // Total de clientes
    const totalCustomers = await db.customer.count({
      where: { companyId },
    });

    // Clientes ativos (com pedido nos últimos 30 dias)
    const activeCustomers = await db.customer.count({
      where: {
        companyId,
        orders: {
          some: {
            createdAt: {
              gte: subDays(new Date(), 30),
            },
          },
        },
      },
    });

    return NextResponse.json({
      period: { days, startDate, endDate },
      summary: {
        totalCustomers,
        activeCustomers,
        inactiveCustomers: totalCustomers - activeCustomers,
      },
      dailyNewCustomers,
      topCustomers: topCustomers.map((metric) => ({
        customerId: metric.customerId,
        name: metric.customer.name,
        email: metric.customer.email,
        phone: metric.customer.phoneE164,
        totalOrders: metric.totalOrders,
        totalSpent: metric.totalSpent,
        averageOrderValue: metric.averageOrderValue,
        segment: metric.segment,
        lastOrderDate: metric.lastOrderDate,
      })),
      segmentation,
    });
  } catch (error) {
    console.error("Failed to fetch customers report:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers report" },
      { status: 500 }
    );
  }
}

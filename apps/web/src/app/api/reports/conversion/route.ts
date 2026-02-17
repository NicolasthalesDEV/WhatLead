import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@wacrm/db";
import { requireAuth } from "@/lib/auth";
import { subDays, startOfDay, endOfDay } from "date-fns";

// GET /api/reports/conversion - Relatório de conversão (cotações → pedidos)
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

    // Taxa de conversão por dia
    const dailyConversion = await db.dailyMetric.findMany({
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
        quotesCreated: true,
        quotesAccepted: true,
        conversionRate: true,
      },
    });

    // Funil de vendas
    const totalQuotes = await db.quote.count({
      where: {
        companyId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const acceptedQuotes = await db.quote.count({
      where: {
        companyId,
        status: "ACCEPTED",
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalOrders = await db.order.count({
      where: {
        companyId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const paidOrders = await db.order.count({
      where: {
        companyId,
        status: "PAID",
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Calcular taxas de conversão
    const quoteToOrderRate =
      totalQuotes > 0 ? (totalOrders / totalQuotes) * 100 : 0;
    const orderToPaidRate =
      totalOrders > 0 ? (paidOrders / totalOrders) * 100 : 0;
    const quoteToAcceptedRate =
      totalQuotes > 0 ? (acceptedQuotes / totalQuotes) * 100 : 0;

    // Tempo médio de conversão
    const quotesWithOrders = await db.quote.findMany({
      where: {
        companyId,
        status: "ACCEPTED",
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        createdAt: true,
        orders: {
          select: {
            createdAt: true,
          },
          take: 1,
        },
      },
    });

    let totalConversionTime = 0;
    let conversionsWithTime = 0;

    quotesWithOrders.forEach((quote) => {
      if (quote.orders.length > 0) {
        const timeDiff =
          quote.orders[0].createdAt.getTime() - quote.createdAt.getTime();
        totalConversionTime += timeDiff;
        conversionsWithTime++;
      }
    });

    const averageConversionTime =
      conversionsWithTime > 0
        ? totalConversionTime / conversionsWithTime / (1000 * 60 * 60)
        : 0; // Em horas

    return NextResponse.json({
      period: { days, startDate, endDate },
      funnel: {
        totalQuotes,
        acceptedQuotes,
        totalOrders,
        paidOrders,
        quoteToAcceptedRate: Math.round(quoteToAcceptedRate * 10) / 10,
        quoteToOrderRate: Math.round(quoteToOrderRate * 10) / 10,
        orderToPaidRate: Math.round(orderToPaidRate * 10) / 10,
        averageConversionTimeHours: Math.round(averageConversionTime * 10) / 10,
      },
      dailyConversion,
    });
  } catch (error) {
    console.error("Failed to fetch conversion report:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversion report" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wacrm/db";
import { requireAuth } from "@/lib/auth";
import { startOfDay, subDays, endOfDay } from "date-fns";

type PeriodFilter = '7d' | '30d' | '90d' | '1y';

const periodToDays = (period: PeriodFilter): number => {
  switch (period) {
    case '7d': return 7;
    case '30d': return 30;
    case '90d': return 90;
    case '1y': return 365;
  }
};

// GET /api/dashboard/metrics - Obter métricas agregadas do dashboard
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const period = (searchParams.get("period") || "30d") as PeriodFilter;
  const days = periodToDays(period);
  const companyId = authResult.companyId;

  try {
    const startDate = startOfDay(subDays(new Date(), days));
    const endDate = endOfDay(new Date());

    // Buscar métricas agregadas
    const [
      totalCustomers,
      totalOrders,
      totalProducts,
      totalMessages,
      previousPeriodCustomers,
      previousPeriodOrders,
      previousPeriodMessages,
      pendingOrders
    ] = await Promise.all([
      // Total de clientes no período
      prisma.customer.count({
        where: {
          companyId,
          createdAt: { gte: startDate, lte: endDate }
        }
      }),

      // Total de pedidos no período
      prisma.order.count({
        where: {
          companyId,
          createdAt: { gte: startDate, lte: endDate }
        }
      }),

      // Total de produtos (quartos) cadastrados e disponíveis
      prisma.product.count({
        where: {
          companyId,
          active: true
        }
      }),

      // Total de mensagens no período
      prisma.whatsMessage.count({
        where: {
          customer: { companyId },
          createdAt: { gte: startDate, lte: endDate }
        }
      }),

      // Clientes do período anterior (para comparação)
      prisma.customer.count({
        where: {
          companyId,
          createdAt: { 
            gte: startOfDay(subDays(startDate, days)),
            lt: startDate
          }
        }
      }),

      // Pedidos do período anterior
      prisma.order.count({
        where: {
          companyId,
          createdAt: {
            gte: startOfDay(subDays(startDate, days)),
            lt: startDate
          }
        }
      }),

      // Mensagens do período anterior
      prisma.whatsMessage.count({
        where: {
          customer: { companyId },
          createdAt: {
            gte: startOfDay(subDays(startDate, days)),
            lt: startDate
          }
        }
      }),

      // Pedidos pendentes
      prisma.order.count({
        where: {
          companyId,
          status: 'PENDING'
        }
      })
    ]);

    // Calcular tendências (growth)
    const customerTrend = previousPeriodCustomers > 0 
      ? ((totalCustomers - previousPeriodCustomers) / previousPeriodCustomers * 100).toFixed(0)
      : totalCustomers > 0 ? '100' : '0';

    const orderTrend = previousPeriodOrders > 0
      ? ((totalOrders - previousPeriodOrders) / previousPeriodOrders * 100).toFixed(0)
      : totalOrders > 0 ? '100' : '0';

    const messageTrend = previousPeriodMessages > 0
      ? ((totalMessages - previousPeriodMessages) / previousPeriodMessages * 100).toFixed(0)
      : totalMessages > 0 ? '100' : '0';

    const metrics = {
      customers: {
        value: totalCustomers.toString(),
        trend: `${customerTrend > '0' ? '+' : ''}${customerTrend}%`,
        description: `${customerTrend > '0' ? '+' : ''}${customerTrend}% em relação ao período anterior`
      },
      orders: {
        value: totalOrders.toString(),
        trend: `${orderTrend > '0' ? '+' : ''}${orderTrend}%`,
        description: pendingOrders > 0 ? `${pendingOrders} aguardando confirmação` : 'Nenhuma pendência'
      },
      products: {
        value: totalProducts.toString(),
        trend: '+0%',
        description: `${totalProducts} quartos cadastrados`
      },
      messages: {
        value: totalMessages.toString(),
        trend: `${messageTrend > '0' ? '+' : ''}${messageTrend}%`,
        description: `Últimos ${days} dias`
      }
    };

    return NextResponse.json({ metrics });
  } catch (error) {
    console.error("Failed to fetch dashboard metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}

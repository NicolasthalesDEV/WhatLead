import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wacrm/db";
import { requireAuth } from "@/lib/auth";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

// GET /api/dashboard/activity - Obter atividades recentes
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "10");
  const companyId = authResult.companyId;

  try {
    // Buscar diferentes tipos de atividades
    const [recentOrders, recentMessages, recentPayments, recentCustomers] = await Promise.all([
      // Pedidos recentes
      prisma.order.findMany({
        where: { companyId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          createdAt: true,
          status: true
        }
      }),

      // Mensagens recentes
      prisma.whatsMessage.findMany({
        where: {
          customer: { companyId },
          direction: 'IN' // Apenas mensagens recebidas
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          createdAt: true,
          customer: {
            select: {
              name: true
            }
          }
        }
      }),

      // Pagamentos recentes
      prisma.payment.findMany({
        where: {
          order: { companyId }
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          createdAt: true,
          order: {
            select: {
              id: true
            }
          }
        }
      }),

      // Clientes recentes
      prisma.customer.findMany({
        where: { companyId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          createdAt: true
        }
      })
    ]);

    // Combinar todas as atividades e ordenar por data
    const activities = [
      ...recentOrders.map(order => ({
        id: `order-${order.id}`,
        type: 'order' as const,
        message: `Nova reserva #${order.id.slice(0, 8)} recebida`,
        time: formatDistanceToNow(new Date(order.createdAt), { 
          addSuffix: true,
          locale: ptBR 
        }),
        timestamp: order.createdAt
      })),
      ...recentMessages.map(msg => ({
        id: `message-${msg.id}`,
        type: 'message' as const,
        message: `Mensagem de ${msg.customer.name}`,
        time: formatDistanceToNow(new Date(msg.createdAt), { 
          addSuffix: true,
          locale: ptBR 
        }),
        timestamp: msg.createdAt
      })),
      ...recentPayments.map(payment => ({
        id: `payment-${payment.id}`,
        type: 'payment' as const,
        message: `Pagamento confirmado #${payment.order.id.slice(0, 8)}`,
        time: formatDistanceToNow(new Date(payment.createdAt), { 
          addSuffix: true,
          locale: ptBR 
        }),
        timestamp: payment.createdAt
      })),
      ...recentCustomers.map(customer => ({
        id: `customer-${customer.id}`,
        type: 'customer' as const,
        message: `Novo hóspede cadastrado: ${customer.name}`,
        time: formatDistanceToNow(new Date(customer.createdAt), { 
          addSuffix: true,
          locale: ptBR 
        }),
        timestamp: customer.createdAt
      }))
    ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit)
    .map(({ timestamp, ...activity }) => activity); // Remove timestamp do resultado final

    return NextResponse.json({ activities });
  } catch (error) {
    console.error("Failed to fetch recent activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    );
  }
}

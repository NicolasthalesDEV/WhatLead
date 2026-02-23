/**
 * Helper para gerenciar pesquisas NPS
 */

import { prisma } from "@wacrm/db";
import { sendWhatsText } from "./wa/client";

/**
 * Envia pesquisa NPS para um cliente via WhatsApp
 * @param customerId - ID do cliente
 * @param surveyId - ID da pesquisa NPS
 * @param orderId - ID do pedido (opcional)
 */
export async function sendNPSSurvey(
  customerId: string,
  surveyId: string,
  orderId?: string
): Promise<boolean> {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        name: true,
        phoneE164: true,
      },
    });

    if (!customer || !customer.phoneE164) {
      console.error(`Customer ${customerId} not found or has no phone`);
      return false;
    }

    const survey = await prisma.nPSSurvey.findUnique({
      where: { id: surveyId },
      select: {
        id: true,
        name: true,
        question: true,
        active: true,
      },
    });

    if (!survey || !survey.active) {
      console.error(`Survey ${surveyId} not found or inactive`);
      return false;
    }

    // Construir URL da pesquisa
    const baseUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
    const surveyUrl = `${baseUrl}/nps/${survey.id}?customerId=${customer.id}${orderId ? `&orderId=${orderId}` : ""}`;

    // Montar mensagem
    const message = `Olá ${customer.name}! 👋

${survey.question}

Por favor, avalie de 0 a 10:
${surveyUrl}

Sua opinião é muito importante para nós! 💙`;

    // Enviar via WhatsApp
    await sendWhatsText(customer.phoneE164, message);

    console.log(`NPS survey sent to customer ${customer.id}`);
    return true;
  } catch (error) {
    console.error("Error sending NPS survey:", error);
    return false;
  }
}

/**
 * Agenda envio de NPS após pedido pago
 * @param orderId - ID do pedido
 */
export async function scheduleNPSAfterOrder(orderId: string): Promise<void> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        company: true,
      },
    });

    if (!order) {
      console.error(`Order ${orderId} not found`);
      return;
    }

    // Buscar pesquisa ativa configurada para envio automático
    const survey = await prisma.nPSSurvey.findFirst({
      where: {
        companyId: order.companyId,
        active: true,
        sendAfterOrderPaid: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!survey) {
      console.log(`No active NPS survey found for company ${order.companyId}`);
      return;
    }

    // Verificar se cliente já respondeu esta pesquisa para este pedido
    const existing = await prisma.nPSResponse.findUnique({
      where: {
        surveyId_customerId_orderId: {
          surveyId: survey.id,
          customerId: order.customerId,
          orderId: order.id,
        },
      },
    });

    if (existing) {
      console.log(`Customer ${order.customerId} already responded to survey for order ${order.id}`);
      return;
    }

    // Calcular delay
    const delayMs = survey.sendDelayMinutes * 60 * 1000;

    // Agendar envio (em produção, usar fila de jobs como BullMQ)
    setTimeout(async () => {
      await sendNPSSurvey(order.customerId, survey.id, order.id);
    }, delayMs);

    console.log(`NPS survey scheduled for customer ${order.customerId} after ${survey.sendDelayMinutes} minutes`);
  } catch (error) {
    console.error("Error scheduling NPS survey:", error);
  }
}

/**
 * Calcula NPS score de uma pesquisa
 * @param surveyId - ID da pesquisa
 * @returns Score NPS (-100 a 100) ou null se não houver respostas
 */
export async function calculateNPSScore(surveyId: string): Promise<number | null> {
  const responses = await prisma.nPSResponse.findMany({
    where: { surveyId },
    select: { score: true },
  });

  if (responses.length === 0) {
    return null;
  }

  const promoters = responses.filter((r) => r.score >= 9).length;
  const detractors = responses.filter((r) => r.score <= 6).length;
  const total = responses.length;

  return Math.round(((promoters - detractors) / total) * 100);
}

/**
 * Obtém análise detalhada de NPS
 * @param surveyId - ID da pesquisa
 * @param startDate - Data inicial (opcional)
 * @param endDate - Data final (opcional)
 */
export async function getNPSAnalytics(
  surveyId: string,
  startDate?: Date,
  endDate?: Date
) {
  const where: any = { surveyId };

  if (startDate || endDate) {
    where.respondedAt = {};
    if (startDate) where.respondedAt.gte = startDate;
    if (endDate) where.respondedAt.lte = endDate;
  }

  const responses = await prisma.nPSResponse.findMany({
    where,
    select: {
      score: true,
      sentiment: true,
      respondedAt: true,
      comment: true,
    },
  });

  const total = responses.length;
  const promoters = responses.filter((r) => r.score >= 9).length;
  const passives = responses.filter((r) => r.score >= 7 && r.score <= 8).length;
  const detractors = responses.filter((r) => r.score <= 6).length;

  const npsScore = total > 0
    ? Math.round(((promoters - detractors) / total) * 100)
    : null;

  const averageScore = total > 0
    ? responses.reduce((sum, r) => sum + r.score, 0) / total
    : null;

  // Distribuição de scores
  const scoreDistribution = Array.from({ length: 11 }, (_, i) => ({
    score: i,
    count: responses.filter((r) => r.score === i).length,
    percentage: total > 0 ? (responses.filter((r) => r.score === i).length / total) * 100 : 0,
  }));

  // Comentários dos detratores (para análise de problemas)
  const detractorComments = responses
    .filter((r) => r.score <= 6 && r.comment)
    .map((r) => ({
      score: r.score,
      comment: r.comment,
      respondedAt: r.respondedAt,
    }));

  // Tendência ao longo do tempo (últimos 30 dias)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentResponses = responses.filter(
    (r) => r.respondedAt >= thirtyDaysAgo
  );

  const weeklyTrend = Array.from({ length: 4 }, (_, weekIndex) => {
    const weekStart = new Date(thirtyDaysAgo);
    weekStart.setDate(weekStart.getDate() + weekIndex * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const weekResponses = recentResponses.filter(
      (r) => r.respondedAt >= weekStart && r.respondedAt < weekEnd
    );

    const weekPromoters = weekResponses.filter((r) => r.score >= 9).length;
    const weekDetractors = weekResponses.filter((r) => r.score <= 6).length;
    const weekTotal = weekResponses.length;

    const weekNPS = weekTotal > 0
      ? Math.round(((weekPromoters - weekDetractors) / weekTotal) * 100)
      : null;

    return {
      week: weekIndex + 1,
      startDate: weekStart,
      endDate: weekEnd,
      responses: weekTotal,
      nps: weekNPS,
    };
  });

  return {
    total,
    promoters,
    passives,
    detractors,
    npsScore,
    averageScore,
    promotersPercentage: total > 0 ? (promoters / total) * 100 : 0,
    passivesPercentage: total > 0 ? (passives / total) * 100 : 0,
    detractorsPercentage: total > 0 ? (detractors / total) * 100 : 0,
    scoreDistribution,
    detractorComments,
    weeklyTrend,
  };
}

import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@wacrm/db";
import { requireAuth } from "@/lib/auth";

// GET /api/funnel/metrics - Obter métricas agregadas do funil
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") || "30");

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Buscar todos os estágios com cards
  const stages = await db.funnelStage.findMany({
    where: {
      companyId: authResult.companyId,
      isActive: true,
    },
    include: {
      cards: {
        select: {
          id: true,
          value: true,
          probability: true,
          enteredStageAt: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      order: "asc",
    },
  });

  // Calcular métricas por estágio
  const stageMetrics = stages.map((stage) => {
    const totalCards = stage.cards.length;
    const totalValue = stage.cards.reduce(
      (sum, card) => sum + (card.value ? Number(card.value) : 0),
      0
    );
    const avgValue = totalCards > 0 ? totalValue / totalCards : 0;
    const weightedValue = stage.cards.reduce(
      (sum, card) =>
        sum + (card.value ? Number(card.value) * (card.probability / 100) : 0),
      0
    );

    // Cards criados no período
    const newCards = stage.cards.filter(
      (card) => new Date(card.createdAt) >= startDate
    ).length;

    // Tempo médio no estágio (em dias)
    const now = new Date();
    const avgTimeInStage =
      totalCards > 0
        ? stage.cards.reduce((sum, card) => {
            const enteredAt = new Date(card.enteredStageAt);
            const daysInStage =
              (now.getTime() - enteredAt.getTime()) / (1000 * 60 * 60 * 24);
            return sum + daysInStage;
          }, 0) / totalCards
        : 0;

    return {
      stageId: stage.id,
      stageName: stage.name,
      stageColor: stage.color,
      stageOrder: stage.order,
      totalCards,
      totalValue,
      avgValue,
      weightedValue, // Valor ponderado pela probabilidade
      newCardsInPeriod: newCards,
      avgTimeInStage: Math.round(avgTimeInStage * 10) / 10, // Arredonda para 1 casa decimal
    };
  });

  // Métricas gerais
  const totalCards = stageMetrics.reduce((sum, s) => sum + s.totalCards, 0);
  const totalValue = stageMetrics.reduce((sum, s) => sum + s.totalValue, 0);
  const totalWeightedValue = stageMetrics.reduce(
    (sum, s) => sum + s.weightedValue,
    0
  );
  const newCardsTotal = stageMetrics.reduce(
    (sum, s) => sum + s.newCardsInPeriod,
    0
  );

  // Taxa de conversão entre estágios (aproximação simples)
  const conversionRates: any[] = [];
  for (let i = 0; i < stageMetrics.length - 1; i++) {
    const currentStage = stageMetrics[i];
    const nextStage = stageMetrics[i + 1];

    const rate =
      currentStage.totalCards > 0
        ? (nextStage.totalCards / currentStage.totalCards) * 100
        : 0;

    conversionRates.push({
      fromStage: currentStage.stageName,
      toStage: nextStage.stageName,
      rate: Math.round(rate * 10) / 10,
    });
  }

  return NextResponse.json({
    summary: {
      totalCards,
      totalValue,
      totalWeightedValue,
      newCardsInPeriod: newCardsTotal,
      avgCardValue: totalCards > 0 ? totalValue / totalCards : 0,
    },
    stageMetrics,
    conversionRates,
  });
}

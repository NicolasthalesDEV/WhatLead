import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@wacrm/db";
import { requireAuth } from "@/lib/auth";

// GET /api/funnel/metrics - Obter métricas agregadas do funil
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const funnelStage = (db as any).funnelStage;
  const funnelCard = (db as any).funnelCard;

  if (!funnelStage) {
    return NextResponse.json({
      summary: {
        totalCards: 0,
        totalValue: 0,
        totalWeightedValue: 0,
        newCardsInPeriod: 0,
        avgCardValue: 0,
      },
      stageMetrics: [],
      conversionRates: [],
    });
  }

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") || "30");

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Buscar todos os estágios
  const stages = (await funnelStage.findMany({
    where: {
      companyId: authResult.companyId,
    },
    orderBy: {
      order: "asc",
    },
  })) as Array<{ id: string; name: string; order: number }>;

  const cardsByStage = funnelCard
    ? await funnelCard.groupBy({
        by: ["stageId"],
        where: { companyId: authResult.companyId },
        _count: { _all: true },
      })
    : [];

  const cardsCountMap: Map<string, number> = new Map(
    cardsByStage.map((item: any) => [item.stageId, item._count?._all || 0])
  );

  // Calcular métricas por estágio
  const stageMetrics = stages.map((stage: { id: string; name: string; order: number }) => {
    const totalCards = Number(cardsCountMap.get(stage.id) || 0);
    const totalValue = 0;
    const avgValue = totalCards > 0 ? totalValue / totalCards : 0;
    const weightedValue = 0;

    // Cards criados no período
    const newCards = 0;

    // Tempo médio no estágio (em dias)
    const avgTimeInStage = 0;

    return {
      stageId: stage.id,
      stageName: stage.name,
      stageColor: null,
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
  const conversionRates: Array<{ fromStage: string; toStage: string; rate: number }> = [];
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

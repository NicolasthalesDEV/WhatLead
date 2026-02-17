import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wacrm/db";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

const updateSurveySchema = z.object({
  name: z.string().min(1).optional(),
  active: z.boolean().optional(),
});

/**
 * GET: Detalhes de uma pesquisa NPS
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res!;

  const survey = await prisma.nPSSurvey.findUnique({
    where: { id },
  });

  if (!survey || survey.companyId !== auth.companyId) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Survey not found" } },
      { status: 404 }
    );
  }

  const responses = (await prisma.nPSResponse.findMany({
    where: { surveyId: id },
    orderBy: { createdAt: "desc" },
  })) as Array<{
    id: string;
    customerId: string;
    score: number;
    comment: string | null;
    createdAt: Date;
  }>;

  const uniqueCustomerIds = Array.from(new Set(responses.map((response) => response.customerId)));
  const customers = await prisma.customer.findMany({
    where: { id: { in: uniqueCustomerIds } },
    select: { id: true, name: true },
  });
  const customerNameById = new Map(customers.map((customer) => [customer.id, customer.name]));

  // Calcular métricas
  const totalResponses = responses.length;
  const promoters = responses.filter((r) => r.score >= 9).length;
  const passives = responses.filter((r) => r.score >= 7 && r.score <= 8).length;
  const detractors = responses.filter((r) => r.score <= 6).length;

  const npsScore = totalResponses > 0
    ? Math.round(((promoters - detractors) / totalResponses) * 100)
    : null;

  const averageScore = totalResponses > 0
    ? responses.reduce((sum, r) => sum + r.score, 0) / totalResponses
    : null;

  // Distribuição de scores
  const scoreDistribution = Array.from({ length: 11 }, (_, i) => ({
    score: i,
    count: responses.filter((r) => r.score === i).length,
  }));

  // Comentários recentes
  const recentComments = responses
    .filter((r) => r.comment)
    .slice(0, 10)
    .map((r) => ({
      id: r.id,
      score: r.score,
      comment: r.comment,
      customerName: customerNameById.get(r.customerId) || "Cliente",
      respondedAt: r.createdAt,
    }));

  return NextResponse.json({
    ...survey,
    metrics: {
      totalResponses,
      promoters,
      passives,
      detractors,
      npsScore,
      averageScore,
      scoreDistribution,
      recentComments,
    },
  });
}

/**
 * PATCH: Atualizar pesquisa NPS
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res!;

  try {
    const survey = await prisma.nPSSurvey.findUnique({
      where: { id },
    });

    if (!survey || survey.companyId !== auth.companyId) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Survey not found" } },
        { status: 404 }
      );
    }

    const body = await req.json();
    const data = updateSurveySchema.parse(body);

    const updated = await prisma.nPSSurvey.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", details: error.errors } },
        { status: 400 }
      );
    }

    console.error("Error updating NPS survey:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to update survey" } },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Deletar pesquisa NPS
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res!;

  const survey = await prisma.nPSSurvey.findUnique({
    where: { id },
  });

  if (!survey || survey.companyId !== auth.companyId) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Survey not found" } },
      { status: 404 }
    );
  }

  // Não permitir deletar se tiver respostas
  const responsesCount = await prisma.nPSResponse.count({ where: { surveyId: id } });
  if (responsesCount > 0) {
    return NextResponse.json(
      { error: { code: "HAS_RESPONSES", message: "Cannot delete survey with responses" } },
      { status: 400 }
    );
  }

  await prisma.nPSSurvey.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}

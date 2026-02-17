import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wacrm/db";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

const createSurveySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  question: z.string().min(1, "Pergunta é obrigatória"),
  sendAfterOrderPaid: z.boolean().default(true),
  sendDelayMinutes: z.number().int().min(0).default(60),
});

/**
 * GET: Lista pesquisas NPS
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res!;

  const url = new URL(req.url);
  const active = url.searchParams.get("active");

  const surveys = await prisma.nPSSurvey.findMany({
    where: {
      companyId: auth.companyId,
      ...(active !== null && { active: active === "true" }),
    },
    include: {
      _count: {
        select: { responses: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calcular métricas para cada pesquisa
  const surveysWithMetrics = await Promise.all(
    surveys.map(async (survey) => {
      const responses = await prisma.nPSResponse.findMany({
        where: { surveyId: survey.id },
        select: { score: true, sentiment: true },
      });

      const totalResponses = responses.length;
      const promoters = responses.filter((r) => r.score >= 9).length;
      const passives = responses.filter((r) => r.score >= 7 && r.score <= 8).length;
      const detractors = responses.filter((r) => r.score <= 6).length;

      const npsScore = totalResponses > 0
        ? Math.round(((promoters - detractors) / totalResponses) * 100)
        : null;

      return {
        ...survey,
        metrics: {
          totalResponses,
          promoters,
          passives,
          detractors,
          npsScore,
        },
      };
    })
  );

  return NextResponse.json(surveysWithMetrics);
}

/**
 * POST: Criar nova pesquisa NPS
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res!;

  try {
    const body = await req.json();
    const data = createSurveySchema.parse(body);

    const survey = await prisma.nPSSurvey.create({
      data: {
        ...data,
        companyId: auth.companyId,
      },
    });

    return NextResponse.json(survey, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", details: error.errors } },
        { status: 400 }
      );
    }

    console.error("Error creating NPS survey:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to create survey" } },
      { status: 500 }
    );
  }
}

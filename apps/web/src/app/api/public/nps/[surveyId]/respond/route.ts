import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wacrm/db";
import { z } from "zod";

const respondSchema = z.object({
  customerId: z.string().min(1, "Customer ID is required"),
  orderId: z.string().optional(),
  score: z.number().int().min(0).max(10),
  comment: z.string().optional(),
});

/**
 * GET: Obter detalhes da pesquisa (público)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ surveyId: string }> }
) {
  const { surveyId } = await params;
  const url = new URL(req.url);
  const customerId = url.searchParams.get("customerId");
  const orderId = url.searchParams.get("orderId");

  try {
    const survey = await prisma.nPSSurvey.findUnique({
      where: { id: surveyId },
      select: {
        id: true,
        name: true,
        description: true,
        question: true,
        active: true,
      },
    });

    if (!survey) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Survey not found" } },
        { status: 404 }
      );
    }

    if (!survey.active) {
      return NextResponse.json(
        { error: { code: "INACTIVE", message: "Survey is not active" } },
        { status: 400 }
      );
    }

    // Verificar se já respondeu
    let alreadyResponded = false;
    if (customerId && orderId) {
      const existing = await prisma.nPSResponse.findUnique({
        where: {
          surveyId_customerId_orderId: {
            surveyId,
            customerId,
            orderId,
          },
        },
      });
      alreadyResponded = !!existing;
    }

    return NextResponse.json({
      ...survey,
      alreadyResponded,
    });
  } catch (error) {
    console.error("Error fetching survey:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch survey" } },
      { status: 500 }
    );
  }
}

/**
 * POST: Responder pesquisa NPS (público)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ surveyId: string }> }
) {
  const { surveyId } = await params;

  try {
    const body = await req.json();
    const data = respondSchema.parse(body);

    // Verificar se pesquisa existe e está ativa
    const survey = await prisma.nPSSurvey.findUnique({
      where: { id: surveyId },
    });

    if (!survey) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Survey not found" } },
        { status: 404 }
      );
    }

    if (!survey.active) {
      return NextResponse.json(
        { error: { code: "INACTIVE", message: "Survey is not active" } },
        { status: 400 }
      );
    }

    // Verificar se cliente existe
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
    });

    if (!customer) {
      return NextResponse.json(
        { error: { code: "INVALID_CUSTOMER", message: "Customer not found" } },
        { status: 400 }
      );
    }

    // Determinar sentimento
    let sentiment: string;
    if (data.score >= 9) {
      sentiment = "PROMOTER";
    } else if (data.score >= 7) {
      sentiment = "PASSIVE";
    } else {
      sentiment = "DETRACTOR";
    }

    // Criar resposta (ou atualizar se já existe)
    const response = await prisma.nPSResponse.upsert({
      where: {
        surveyId_customerId_orderId: {
          surveyId,
          customerId: data.customerId,
          orderId: data.orderId || "",
        },
      },
      update: {
        score: data.score,
        comment: data.comment,
        sentiment,
        respondedAt: new Date(),
      },
      create: {
        surveyId,
        customerId: data.customerId,
        orderId: data.orderId || undefined,
        score: data.score,
        comment: data.comment,
        sentiment,
      },
    });

    return NextResponse.json({
      success: true,
      responseId: response.id,
      sentiment,
      message: "Obrigado pelo seu feedback!",
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", details: error.errors } },
        { status: 400 }
      );
    }

    console.error("Error submitting NPS response:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to submit response" } },
      { status: 500 }
    );
  }
}


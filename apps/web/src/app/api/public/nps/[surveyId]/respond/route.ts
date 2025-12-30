import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wacrm/db";
import { z } from "zod";

const Body = z.object({
  customerId: z.string(),
  score: z.number().int().min(0).max(10),
  comment: z.string().optional()
});

export async function POST(
  req: NextRequest, 
  { params }: { params: Promise<{ surveyId: string }> }
) {
  const { surveyId } = await params;
  const json = await req.json();
  const body = Body.safeParse(json);
  if (!body.success) return NextResponse.json({ error: { code: "BAD_REQUEST" } }, { status: 400 });

  const survey = await prisma.nPSSurvey.findUnique({ where: { id: surveyId } });
  if (!survey) return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });

  const res = await prisma.nPSResponse.create({
    data: { surveyId: survey.id, customerId: body.data.customerId, score: body.data.score, comment: body.data.comment }
  });
  return NextResponse.json({ ok: true, responseId: res.id });
}

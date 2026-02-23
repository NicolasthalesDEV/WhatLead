/**
 * POST /api/ai/chat
 * VIII – Integração com OpenAI – chat completion endpoint for the frontend
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { chatCompletion, isOpenAIConfigured, buildSystemPrompt } from "@/lib/openai";
import { prisma } from "@wacrm/db";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  if (!isOpenAIConfigured()) {
    return NextResponse.json(
      { error: "OpenAI não configurado. Adicione OPENAI_API_KEY nas variáveis de ambiente." },
      { status: 503 }
    );
  }

  try {
    const { message, history = [], systemPrompt: customPrompt } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: "Mensagem é obrigatória" }, { status: 400 });
    }

    // Load chatbot settings for this company to build a consistent system prompt
    const settings = await prisma.chatbotSettings.findUnique({
      where: { companyId: auth.companyId },
    });
    const company = await prisma.company.findUnique({
      where: { id: auth.companyId },
      select: { name: true },
    });

    const systemPrompt =
      customPrompt ||
      buildSystemPrompt({
        botName: settings?.botName,
        botEmoji: settings?.botEmoji,
        tone: settings?.tone,
        companyName: company?.name,
      });

    const messages = [
      ...history,
      { role: "user" as const, content: message },
    ];

    const reply = await chatCompletion(messages, { systemPrompt });

    return NextResponse.json({
      reply,
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    });
  } catch (error: any) {
    console.error("AI chat error:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 500 }
    );
  }
}

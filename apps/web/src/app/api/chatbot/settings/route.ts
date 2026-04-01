import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@wacrm/db";
import crypto from "crypto";

// GET /api/chatbot/settings
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  try {
    let settings = await prisma.chatbotSettings.findUnique({
      where: { companyId: auth.companyId },
    });

    // Auto-create default settings on first access
    if (!settings) {
      settings = await prisma.chatbotSettings.create({
        data: {
          id: crypto.randomUUID(),
          companyId: auth.companyId,
          updatedAt: new Date(),
        },
      });
    }

    const maskKey = (key: string | null | undefined) =>
      key ? `${key.slice(0, 7)}...${key.slice(-4)}` : null;

    return NextResponse.json({
      settings: {
        ...settings,
        openaiApiKey: maskKey(settings.openaiApiKey),
        elevenLabsApiKey: maskKey(settings.elevenLabsApiKey),
      },
    });
  } catch (error) {
    console.error("Failed to fetch chatbot settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/chatbot/settings
export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  try {
    const body = await req.json();

    const {
      botName,
      botEmoji,
      language,
      tone,
      autoReplyEnabled,
      typingDelay,
      sessionTimeoutMinutes,
      maxMessagesPerSession,
      welcomeMessage,
      farewellMessage,
      unknownCommandMessage,
      offHoursEnabled,
      offHoursMessage,
      businessHoursStart,
      businessHoursEnd,
      businessDays,
      handoffEnabled,
      handoffKeyword,
      handoffMessage,
      // Agent personality
      agentPersonality,
      agentContext,
      responseLength,
      // OpenAI
      openAIEnabled,
      openAIModel,
      openAISystemPrompt,
      openAITemperature,
      openAIMaxTokens,
      openAIContextMessages,
      // ElevenLabs
      elevenLabsEnabled,
      elevenLabsVoiceId,
      elevenLabsModel,
      elevenLabsStability,
      elevenLabsSimilarity,
      elevenLabsStyle,
      // Per-company API keys
      openaiApiKey,
      elevenLabsApiKey,
    } = body;

    const settings = await prisma.chatbotSettings.upsert({
      where: { companyId: auth.companyId },
      create: {
        id: crypto.randomUUID(),
        companyId: auth.companyId,
        updatedAt: new Date(),
        botName,
        botEmoji,
        language,
        tone,
        autoReplyEnabled,
        typingDelay,
        sessionTimeoutMinutes,
        maxMessagesPerSession,
        welcomeMessage,
        farewellMessage,
        unknownCommandMessage,
        offHoursEnabled,
        offHoursMessage,
        businessHoursStart,
        businessHoursEnd,
        businessDays,
        handoffEnabled,
        handoffKeyword,
        handoffMessage,
        agentPersonality,
        agentContext,
        responseLength,
        openAIEnabled,
        openAIModel,
        openAISystemPrompt,
        openAITemperature,
        openAIMaxTokens,
        openAIContextMessages,
        elevenLabsEnabled,
        elevenLabsVoiceId,
        elevenLabsModel,
        elevenLabsStability,
        elevenLabsSimilarity,
        elevenLabsStyle,
        openaiApiKey,
        elevenLabsApiKey,
      },
      update: {
        ...(botName !== undefined && { botName }),
        ...(botEmoji !== undefined && { botEmoji }),
        ...(language !== undefined && { language }),
        ...(tone !== undefined && { tone }),
        ...(autoReplyEnabled !== undefined && { autoReplyEnabled }),
        ...(typingDelay !== undefined && { typingDelay }),
        ...(sessionTimeoutMinutes !== undefined && { sessionTimeoutMinutes }),
        ...(maxMessagesPerSession !== undefined && { maxMessagesPerSession }),
        ...(welcomeMessage !== undefined && { welcomeMessage }),
        ...(farewellMessage !== undefined && { farewellMessage }),
        ...(unknownCommandMessage !== undefined && { unknownCommandMessage }),
        ...(offHoursEnabled !== undefined && { offHoursEnabled }),
        ...(offHoursMessage !== undefined && { offHoursMessage }),
        ...(businessHoursStart !== undefined && { businessHoursStart }),
        ...(businessHoursEnd !== undefined && { businessHoursEnd }),
        ...(businessDays !== undefined && { businessDays }),
        ...(handoffEnabled !== undefined && { handoffEnabled }),
        ...(handoffKeyword !== undefined && { handoffKeyword }),
        ...(handoffMessage !== undefined && { handoffMessage }),
        ...(agentPersonality !== undefined && { agentPersonality }),
        ...(agentContext !== undefined && { agentContext }),
        ...(responseLength !== undefined && { responseLength }),
        ...(openAIEnabled !== undefined && { openAIEnabled }),
        ...(openAIModel !== undefined && { openAIModel }),
        ...(openAISystemPrompt !== undefined && { openAISystemPrompt }),
        ...(openAITemperature !== undefined && { openAITemperature }),
        ...(openAIMaxTokens !== undefined && { openAIMaxTokens }),
        ...(openAIContextMessages !== undefined && { openAIContextMessages }),
        ...(elevenLabsEnabled !== undefined && { elevenLabsEnabled }),
        ...(elevenLabsVoiceId !== undefined && { elevenLabsVoiceId }),
        ...(elevenLabsModel !== undefined && { elevenLabsModel }),
        ...(elevenLabsStability !== undefined && { elevenLabsStability }),
        ...(elevenLabsSimilarity !== undefined && { elevenLabsSimilarity }),
        ...(elevenLabsStyle !== undefined && { elevenLabsStyle }),
        // Per-company API keys — only update when explicitly provided (non-empty string or null to clear)
        ...(openaiApiKey !== undefined && { openaiApiKey: openaiApiKey || null }),
        ...(elevenLabsApiKey !== undefined && { elevenLabsApiKey: elevenLabsApiKey || null }),
      },
    });
    const maskKey = (key: string | null | undefined) =>
      key ? `${key.slice(0, 7)}...${key.slice(-4)}` : null;

    return NextResponse.json({
      settings: {
        ...settings,
        openaiApiKey: maskKey(settings.openaiApiKey),
        elevenLabsApiKey: maskKey(settings.elevenLabsApiKey),
      },
    });
  } catch (error) {
    console.error("Failed to update chatbot settings:", error);    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

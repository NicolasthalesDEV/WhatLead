import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { textToSpeech } from "@/lib/elevenlabs";
import { prisma } from "@wacrm/db";

/**
 * POST /api/whatsapp/tts
 * Convert text to speech using ElevenLabs and return a hosted audio URL.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  // Guard is checked after loading chatbotSettings (per-company key may be set)
  // Early env-only guard removed — see isElevenLabsConfigured check below

  try {
    const { text, voiceId } = await req.json();

    if (!text?.trim()) {
      return NextResponse.json({ error: "Texto é obrigatório" }, { status: 400 });
    }

    // Use voice settings from chatbot settings if not provided
    let resolvedVoiceId = voiceId;
    let resolvedModel: string | undefined;
    let resolvedStability: number | undefined;
    let resolvedSimilarity: number | undefined;
    let resolvedStyle: number | undefined;

    const chatbotSettings = await prisma.chatbotSettings.findUnique({
      where: { companyId: auth.companyId },
      select: {
        elevenLabsVoiceId: true,
        elevenLabsModel: true,
        elevenLabsStability: true,
        elevenLabsSimilarity: true,
        elevenLabsStyle: true,
        elevenLabsApiKey: true,
      },
    });

    const effectiveElevenLabsKey = chatbotSettings?.elevenLabsApiKey || process.env.ELEVENLABS_API_KEY;
    if (!effectiveElevenLabsKey) {
      return NextResponse.json(
        { error: "ElevenLabs não configurado. Defina ELEVENLABS_API_KEY ou adicione sua chave nas configurações." },
        { status: 503 }
      );
    }

    if (!resolvedVoiceId) {
      resolvedVoiceId = chatbotSettings?.elevenLabsVoiceId || undefined;
    }
    resolvedModel = chatbotSettings?.elevenLabsModel || undefined;
    resolvedStability = chatbotSettings?.elevenLabsStability ?? undefined;
    resolvedSimilarity = chatbotSettings?.elevenLabsSimilarity ?? undefined;
    resolvedStyle = chatbotSettings?.elevenLabsStyle ?? undefined;

    // Generate audio
    const audioBuffer = await textToSpeech(text.trim(), {
      voiceId: resolvedVoiceId,
      modelId: resolvedModel,
      stability: resolvedStability,
      similarityBoost: resolvedSimilarity,
      style: resolvedStyle,
      apiKey: chatbotSettings?.elevenLabsApiKey || undefined,
    });

    // Return the audio as a base64-encoded MP3 or upload it
    // We'll return as binary so the client can create a Blob and upload via /api/whatsapp/media/upload
    return new NextResponse(new Uint8Array(audioBuffer), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": 'attachment; filename="voice.mp3"',
      },
    });
  } catch (error) {
    console.error("ElevenLabs TTS error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao gerar áudio" },
      { status: 500 }
    );
  }
}

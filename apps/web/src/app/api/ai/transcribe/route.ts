/**
 * POST /api/ai/transcribe
 * III – Transcrição de áudios via OpenAI Whisper
 * Accepts a multipart/form-data request with an "audio" file field.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { transcribeAudio, isOpenAIConfigured } from "@/lib/openai";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  if (!isOpenAIConfigured()) {
    return NextResponse.json(
      { error: "OpenAI não configurado." },
      { status: 503 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("audio") as File | null;
    const language = (formData.get("language") as string) || "pt";

    if (!file) {
      return NextResponse.json({ error: "Campo 'audio' é obrigatório" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const transcription = await transcribeAudio(buffer, file.name, language);

    return NextResponse.json({ transcription });
  } catch (error: any) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao transcrever áudio" },
      { status: 500 }
    );
  }
}

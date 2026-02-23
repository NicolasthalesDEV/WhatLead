/**
 * POST /api/ai/voice
 * IV – Envio de áudios com voz humanizada (ElevenLabs)
 * Converts text to MP3 audio and returns it as a stream.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { textToSpeech, isElevenLabsConfigured } from "@/lib/elevenlabs";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  if (!isElevenLabsConfigured()) {
    return NextResponse.json(
      { error: "ElevenLabs não configurado. Adicione ELEVENLABS_API_KEY nas variáveis de ambiente." },
      { status: 503 }
    );
  }

  try {
    const { text, voiceId, stability, similarityBoost } = await req.json();

    if (!text?.trim()) {
      return NextResponse.json({ error: "Texto é obrigatório" }, { status: 400 });
    }

    const audioBuffer = await textToSpeech(text, {
      voiceId,
      stability,
      similarityBoost,
    });

    return new NextResponse(new Uint8Array(audioBuffer), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.length.toString(),
        "Content-Disposition": `attachment; filename="voice.mp3"`,
      },
    });
  } catch (error: any) {
    console.error("TTS error:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao gerar áudio" },
      { status: 500 }
    );
  }
}

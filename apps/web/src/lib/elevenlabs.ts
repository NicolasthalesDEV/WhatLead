/**
 * ElevenLabs integration — text-to-speech with humanized voice
 * Requirement: IV – Envio de áudios com voz humanizada (ElevenLabs)
 */

// ── Types ──────────────────────────────────────────────────────
export interface TTSOptions {
  voiceId?: string;
  modelId?: string;
  stability?: number;       // 0–1, default 0.5
  similarityBoost?: number; // 0–1, default 0.75
  style?: number;           // 0–1, default 0
  speakerBoost?: boolean;
  apiKey?: string;          // per-company key — overrides ELEVENLABS_API_KEY env var
}

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  labels: Record<string, string>;
}

// ── Helpers ────────────────────────────────────────────────────
function getApiKey(override?: string): string {
  const key = override || process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY not configured");
  return key;
}

function getDefaultVoiceId(): string {
  return process.env.ELEVENLABS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL"; // Sarah
}

// ── Text-to-Speech ─────────────────────────────────────────────
/**
 * Convert text to audio using ElevenLabs.
 * Returns a Buffer containing the MP3 audio data.
 */
export async function textToSpeech(
  text: string,
  options: TTSOptions = {}
): Promise<Buffer> {
  const apiKey = getApiKey(options.apiKey);
  const voiceId = options.voiceId || getDefaultVoiceId();
  const modelId = options.modelId || "eleven_multilingual_v2";

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability: options.stability ?? 0.5,
          similarity_boost: options.similarityBoost ?? 0.75,
          style: options.style ?? 0,
          use_speaker_boost: options.speakerBoost ?? true,
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ElevenLabs API error ${res.status}: ${err}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// ── List available voices ──────────────────────────────────────
export async function listVoices(apiKey?: string): Promise<ElevenLabsVoice[]> {
  const key = getApiKey(apiKey);

  const res = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: { "xi-api-key": key },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ElevenLabs API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.voices || [];
}

// ── Send voice message via WhatsApp ───────────────────────────
/**
 * Converts text to speech and uploads the audio to WhatsApp,
 * returning the WhatsApp media ID that can be used to send an audio message.
 *
 * Flow:
 *   text → ElevenLabs TTS → MP3 buffer → upload to Meta → media_id
 */
export async function generateVoiceMessage(
  text: string,
  options: TTSOptions = {}
): Promise<{ audioBuffer: Buffer; mimeType: string }> {
  const audioBuffer = await textToSpeech(text, options);
  return { audioBuffer, mimeType: "audio/mpeg" };
}

// ── Check if ElevenLabs is configured ─────────────────────────
export function isElevenLabsConfigured(apiKey?: string): boolean {
  return Boolean(apiKey || process.env.ELEVENLABS_API_KEY);
}

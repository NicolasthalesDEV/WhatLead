/**
 * OpenAI integration — chat completions + audio transcription (Whisper)
 * Requirements: VIII – Integração com OpenAI; III – Transcrição de áudios
 */

// ── Types ──────────────────────────────────────────────────────
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  apiKey?: string; // per-company key — overrides OPENAI_API_KEY env var
}

// ── Helpers ────────────────────────────────────────────────────
function getApiKey(override?: string): string {
  const key = override || process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not configured");
  return key;
}

function getModel(): string {
  return process.env.OPENAI_MODEL || "gpt-4o-mini";
}

// ── Chat completion ────────────────────────────────────────────
/**
 * Send messages to GPT and receive a text reply.
 * Used by the AI_RESPONSE chatbot node and the AI assistant in WhatsApp.
 */
export async function chatCompletion(
  messages: ChatMessage[],
  options: AIChatOptions = {}
): Promise<string> {
  const apiKey = getApiKey(options.apiKey);
  const model = options.model || getModel();

  const systemMessages: ChatMessage[] = options.systemPrompt
    ? [{ role: "system", content: options.systemPrompt }]
    : [];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [...systemMessages, ...messages],
      max_tokens: options.maxTokens ?? 1024,
      temperature: options.temperature ?? 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

// ── Single-turn assistant reply (convenience) ──────────────────
export async function getAIReply(
  userMessage: string,
  context: { systemPrompt?: string; history?: ChatMessage[] } = {}
): Promise<string> {
  const messages: ChatMessage[] = [
    ...(context.history || []),
    { role: "user", content: userMessage },
  ];
  return chatCompletion(messages, { systemPrompt: context.systemPrompt });
}

// ── Whisper audio transcription ────────────────────────────────
/**
 * Transcribe an audio buffer (MP3, OGG, WAV, etc.) using OpenAI Whisper.
 * Returns the transcribed text.
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string = "audio.ogg",
  language: string = "pt",
  apiKey?: string
): Promise<string> {
  const key = getApiKey(apiKey);

  const formData = new FormData();
  formData.append(
    "file",
    new Blob([new Uint8Array(audioBuffer)], { type: "audio/ogg" }),
    filename
  );
  formData.append("model", "whisper-1");
  formData.append("language", language);
  formData.append("response_format", "text");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Whisper API error ${res.status}: ${err}`);
  }

  return (await res.text()).trim();
}

// ── Build default chatbot system prompt from settings ──────────
export function buildSystemPrompt(options: {
  botName?: string;
  botEmoji?: string;
  tone?: string;
  companyName?: string;
  extraContext?: string;
  agentPersonality?: string;
  agentContext?: string;
  responseLength?: string;
}): string {
  const toneInstructions: Record<string, string> = {
    formal:
      "Use linguagem formal, respeitosa e profissional. Evite gírias e abreviações. Trate o cliente por 'você' ou 'senhor/senhora'.",
    informal:
      "Use linguagem casual e descontraída, como em uma conversa com um amigo próximo. Pode usar gírias leves.",
    friendly:
      "Seja caloroso, acolhedor e empático. Demonstre genuíno interesse em ajudar. Use emojis com moderação.",
    professional:
      "Seja direto, objetivo e eficiente. Foque em soluções práticas. Evite rodeios e seja conciso.",
    fun:
      "Seja divertido, use emojis e mantenha o tom leve e positivo! Pode fazer trocadilhos suaves e celebrar as conquistas do cliente 🎉",
    empathetic:
      "Mostre empatia profunda. Valide os sentimentos do cliente antes de oferecer soluções. Use frases como 'Entendo como isso pode ser frustrante'.",
    assertive:
      "Seja firme, seguro e confiante nas respostas. Apresente as informações com convicção sem ser arrogante.",
    minimalist:
      "Seja extremamente conciso. Respostas curtas e diretas, sem floreios. Uma frase quando possível.",
  };

  const responseLengthInstructions: Record<string, string> = {
    brief: "Mantenha respostas muito curtas — no máximo 1 a 2 frases.",
    normal: "Seja conciso — máximo 3 frases por resposta, a menos que extremamente necessário.",
    detailed: "Pode dar respostas mais completas e explicativas quando o contexto exigir.",
  };

  const tone = options.tone || "friendly";
  const length = options.responseLength || "normal";
  const name = options.botName || "Assistente";
  const emoji = options.botEmoji || "🤖";
  const company = options.companyName || "nossa empresa";

  const parts = [
    `Você é ${emoji} ${name}, assistente virtual de ${company} no WhatsApp.`,
    toneInstructions[tone] || toneInstructions.friendly,
    responseLengthInstructions[length] || responseLengthInstructions.normal,
    "Responda sempre em português do Brasil.",
    "Nunca invente informações. Se não souber, diga que vai verificar.",
  ];

  if (options.agentPersonality?.trim()) {
    parts.push(`Traços de personalidade adicionais: ${options.agentPersonality.trim()}`);
  }

  if (options.agentContext?.trim()) {
    parts.push(`Contexto do negócio: ${options.agentContext.trim()}`);
  }

  if (options.extraContext?.trim()) {
    parts.push(options.extraContext.trim());
  }

  return parts.filter(Boolean).join(" ");
}

// ── Check if OpenAI is configured ─────────────────────────────
export function isOpenAIConfigured(apiKey?: string): boolean {
  return Boolean(apiKey || process.env.OPENAI_API_KEY);
}

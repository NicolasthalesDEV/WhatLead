import { z } from "zod";

// Skip validation during build time on Vercel
const skipValidation = process.env.SKIP_ENV_VALIDATION === "true";

const EnvSchema = z.object({
  // Required for authentication
  JWT_SECRET: z.string().min(16),
  
  // Required for database access
  DATABASE_URL: z.string(),
  DIRECT_URL: z.string(),
  
  // Optional for serverless environments (Redis/BullMQ features disabled)
  REDIS_URL: z.string().optional(),
  BULLMQ_PREFIX: z.string().default("wacrm"),
  
  // WhatsApp integration
  WA_VERIFY_TOKEN: z.string().min(8),
  
  // Payment provider
  PSP_PROVIDER: z.string().default("mercadopago"),
  
  // App configuration
  NEXT_PUBLIC_APP_URL: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // ── OpenAI ────────────────────────────────────────────────
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),

  // ── ElevenLabs ───────────────────────────────────────────
  ELEVENLABS_API_KEY: z.string().optional(),
  ELEVENLABS_VOICE_ID: z.string().default("EXAVITQu4vr4xnSDxMaL"), // Sarah (default)

  // ── Google Calendar ──────────────────────────────────────
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional(),

  // ── Resend (email API) ───────────────────────────────────
  RESEND_API_KEY: z.string().optional(),
});

// Create a mock environment for build time validation skip
const mockEnv = {
  JWT_SECRET: "build-time-mock-secret-key",
  DATABASE_URL: "postgresql://mock:mock@localhost:5432/mock",
  DIRECT_URL: "postgresql://mock:mock@localhost:5432/mock",
  REDIS_URL: undefined,
  BULLMQ_PREFIX: "wacrm",
  WA_VERIFY_TOKEN: "build-time-skip",
  PSP_PROVIDER: "mercadopago",
  NEXT_PUBLIC_APP_URL: undefined,
  NODE_ENV: "production" as const,
  OPENAI_API_KEY: undefined,
  OPENAI_MODEL: "gpt-4o-mini",
  ELEVENLABS_API_KEY: undefined,
  ELEVENLABS_VOICE_ID: "EXAVITQu4vr4xnSDxMaL",
  GOOGLE_CLIENT_ID: undefined,
  GOOGLE_CLIENT_SECRET: undefined,
  GOOGLE_REDIRECT_URI: undefined,
  RESEND_API_KEY: undefined,
};

export const env = skipValidation
  ? (mockEnv as z.infer<typeof EnvSchema>)
  : EnvSchema.parse({
      JWT_SECRET: process.env.JWT_SECRET,
      DATABASE_URL: process.env.DATABASE_URL,
      DIRECT_URL: process.env.DIRECT_URL,
      REDIS_URL: process.env.REDIS_URL,
      BULLMQ_PREFIX: process.env.BULLMQ_PREFIX,
      WA_VERIFY_TOKEN: process.env.WA_VERIFY_TOKEN,
      PSP_PROVIDER: process.env.PSP_PROVIDER,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NODE_ENV: process.env.NODE_ENV,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      OPENAI_MODEL: process.env.OPENAI_MODEL,
      ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
      ELEVENLABS_VOICE_ID: process.env.ELEVENLABS_VOICE_ID,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
    });

// Helper to check if Redis features are available
export const isRedisAvailable = () => Boolean(env.REDIS_URL);


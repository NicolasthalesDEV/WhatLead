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
  WA_VERIFY_TOKEN: z.string().default("dev"),
  
  // Payment provider
  PSP_PROVIDER: z.string().default("fake"),
  
  // App configuration
  NEXT_PUBLIC_APP_URL: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

// Create a mock environment for build time validation skip
const mockEnv = {
  JWT_SECRET: "build-time-mock-secret-key",
  DATABASE_URL: "postgresql://mock:mock@localhost:5432/mock",
  DIRECT_URL: "postgresql://mock:mock@localhost:5432/mock",
  REDIS_URL: undefined,
  BULLMQ_PREFIX: "wacrm",
  WA_VERIFY_TOKEN: "dev",
  PSP_PROVIDER: "fake",
  NEXT_PUBLIC_APP_URL: undefined,
  NODE_ENV: "production" as const,
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
    });

// Helper to check if Redis features are available
export const isRedisAvailable = () => Boolean(env.REDIS_URL);


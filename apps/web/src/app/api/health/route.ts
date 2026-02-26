import { NextRequest, NextResponse } from 'next/server';

/**
 * Health Check Endpoint
 * 
 * GET /api/health
 * 
 * Public — no auth required. Checks DB connectivity with latency timing,
 * reports missing critical env vars, and can be used by monitoring tools
 * to detect production issues before users notice.
 */

const startTime = Date.now();

export async function GET(_request: NextRequest) {
  const checks: Record<string, any> = {
    api: { status: 'healthy', timestamp: new Date().toISOString() },
    database: { status: 'unknown' },
    uptime: { seconds: Math.floor((Date.now() - startTime) / 1000) },
  };

  let overallStatus = 'healthy';

  // Check database connectivity with latency measurement
  try {
    const { prisma } = await import('@wacrm/db');
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database.status = 'healthy';
    checks.database.latencyMs = Date.now() - dbStart;
  } catch (error) {
    checks.database.status = 'unhealthy';
    checks.database.error = error instanceof Error ? error.message : 'Unknown error';
    checks.database.code = 'DB_UNAVAILABLE';
    overallStatus = 'unhealthy';
  }

  // Check critical environment variables (non-sensitive — just existence)
  const envChecks = {
    JWT_SECRET: !!process.env.JWT_SECRET,
    DATABASE_URL: !!process.env.DATABASE_URL,
    WA_ACCESS_TOKEN: !!process.env.WA_ACCESS_TOKEN,
    WA_PHONE_NUMBER_ID: !!process.env.WA_PHONE_NUMBER_ID,
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    ELEVENLABS_API_KEY: !!process.env.ELEVENLABS_API_KEY,
    REDIS_URL: !!process.env.REDIS_URL,
  };

  const missingCritical = !envChecks.JWT_SECRET || !envChecks.DATABASE_URL;
  if (missingCritical) overallStatus = 'unhealthy';

  const response = {
    status: overallStatus,
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    checks,
    env: envChecks,
    // Integration availability flags
    integrations: {
      openai: envChecks.OPENAI_API_KEY,
      elevenlabs: envChecks.ELEVENLABS_API_KEY,
      whatsapp: envChecks.WA_ACCESS_TOKEN && envChecks.WA_PHONE_NUMBER_ID,
      redis: envChecks.REDIS_URL,
    },
  };

  const statusCode = overallStatus === 'healthy' ? 200 : 503;

  return NextResponse.json(response, { status: statusCode });
}

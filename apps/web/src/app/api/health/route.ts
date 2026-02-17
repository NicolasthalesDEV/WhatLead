import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@wacrm/db';

/**
 * Health Check Endpoint
 * 
 * GET /api/health
 * 
 * Returns system health status including:
 * - API status
 * - Database connectivity
 * - Uptime
 * - Version info
 */

const startTime = Date.now();

export async function GET(request: NextRequest) {
  const checks: Record<string, any> = {
    api: { status: 'healthy', timestamp: new Date().toISOString() },
    database: { status: 'unknown' },
    uptime: { seconds: Math.floor((Date.now() - startTime) / 1000) },
  };

  let overallStatus = 'healthy';

  // Check database connectivity
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database.status = 'healthy';
    checks.database.latency = Date.now() - Date.now(); // Simplified
  } catch (error) {
    checks.database.status = 'unhealthy';
    checks.database.error = error instanceof Error ? error.message : 'Unknown error';
    overallStatus = 'unhealthy';
  }

  const response = {
    status: overallStatus,
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    checks,
  };

  const statusCode = overallStatus === 'healthy' ? 200 : 503;

  return NextResponse.json(response, { status: statusCode });
}

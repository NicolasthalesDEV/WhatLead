import { NextRequest, NextResponse } from 'next/server';

/**
 * Liveness Check Endpoint
 * 
 * GET /api/health/live
 * 
 * Indicates whether the application is alive and running.
 * Used by orchestrators to detect if app needs restart.
 * 
 * Returns 200 if alive, 500 if dead/stuck
 */

export async function GET(request: NextRequest) {
  // Simple check - if this endpoint responds, app is alive
  return NextResponse.json({ 
    status: 'alive',
    timestamp: new Date().toISOString() 
  }, { status: 200 });
}

/**
 * GET    /api/agenda/google/status   – check if Google Calendar is connected
 * DELETE /api/agenda/google/status   – disconnect Google Calendar
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@wacrm/db";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  const token = await prisma.googleCalendarToken.findUnique({
    where: { companyId: auth.companyId },
    select: {
      calendarId: true,
      createdAt: true,
      updatedAt: true,
      expiresAt: true,
      scope: true,
    },
  });

  return NextResponse.json({
    connected: Boolean(token),
    configured: Boolean(process.env.GOOGLE_CLIENT_ID),
    token: token
      ? {
          calendarId: token.calendarId,
          connectedAt: token.createdAt,
          expiresAt: token.expiresAt,
        }
      : null,
  });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  await prisma.googleCalendarToken.deleteMany({
    where: { companyId: auth.companyId },
  });

  return NextResponse.json({ ok: true });
}

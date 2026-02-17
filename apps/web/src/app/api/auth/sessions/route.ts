import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@wacrm/db";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  const sessionModel = (prisma as any).session;
  if (!sessionModel?.findMany) {
    return NextResponse.json({ sessions: [] });
  }

  const sessions = await sessionModel.findMany({
    where: {
      userId: auth.userId,
      revokedAt: null,
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
      expiresAt: true,
    },
  });

  return NextResponse.json({ sessions });
}

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma as db } from "@wacrm/db";

// NOTE: SSE long-running streams are incompatible with Vercel Serverless.
// This endpoint now returns a single JSON snapshot instead of a stream.
// The client uses polling via GET /api/notifications instead.
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return authResult.res;
  }

  const notification = (db as any).notification;

  if (!notification) {
    return NextResponse.json({ type: "notification_update", unreadCount: 0, notifications: [] });
  }

  try {
    const notifications = await notification.findMany({
      where: { userId: authResult.userId, read: false },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      type: "notification_update",
      unreadCount: notifications.length,
      notifications: notifications.slice(0, 5),
    });
  } catch {
    return NextResponse.json({ type: "notification_update", unreadCount: 0, notifications: [] });
  }
}

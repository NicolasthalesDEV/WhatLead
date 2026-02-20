import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wacrm/db";
import { requireAuth } from "@/lib/auth";

// POST /api/notifications/mark-all-read - Marcar todas como lidas
export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return authResult.res;
  }
  const notification = (prisma as any).notification;

  if (!notification) {
    return NextResponse.json({ success: true });
  }

  try {
    await notification.updateMany({
      where: {
        userId: authResult.userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to mark all as read:", error);
    return NextResponse.json(
      { error: "Failed to mark all as read" },
      { status: 500 }
    );
  }
}

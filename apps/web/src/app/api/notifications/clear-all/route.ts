import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wacrm/db";
import { requireAuth } from "@/lib/auth";

// DELETE /api/notifications/clear-all - Apagar todas as notificações do usuário
export async function DELETE(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return authResult.res;
  }
  const notification = (prisma as any).notification;

  if (!notification) {
    return NextResponse.json({ success: true });
  }

  try {
    await notification.deleteMany({
      where: { userId: authResult.userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to clear notifications:", error);
    return NextResponse.json(
      { error: "Failed to clear notifications" },
      { status: 500 }
    );
  }
}

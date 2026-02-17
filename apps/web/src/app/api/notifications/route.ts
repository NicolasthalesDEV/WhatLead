import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wacrm/db";
import { requireAuth } from "@/lib/auth";
import crypto from "crypto";

// GET /api/notifications - Listar notificações do usuário
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return authResult.res;
  }
  const notification = (prisma as any).notification;

  if (!notification) {
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unreadOnly") === "true";
  const limit = parseInt(searchParams.get("limit") || "50");

  try {
    const notifications = await notification.findMany({
      where: {
        userId: authResult.userId,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const unreadCount = await notification.count({
      where: {
        userId: authResult.userId,
        isRead: false,
      },
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Criar notificação (uso interno/sistema)
export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return authResult.res;
  }
  const notification = (prisma as any).notification;

  if (!notification) {
    return NextResponse.json(
      { error: "Notifications feature is not available in current database schema" },
      { status: 501 }
    );
  }

  // Apenas admins podem criar notificações via API
  if (authResult.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { userId, type, title, message, link, data } = body;

  try {
    const createdNotification = await notification.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        companyId: authResult.companyId,
        type,
        title,
        message,
        link,
        data,
      },
    });

    return NextResponse.json({ notification: createdNotification }, { status: 201 });
  } catch (error) {
    console.error("Failed to create notification:", error);
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    );
  }
}

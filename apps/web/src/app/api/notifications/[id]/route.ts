import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wacrm/db";
import { requireAuth } from "@/lib/auth";

// GET /api/notifications/[id] - Buscar notificação específica
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string> } }
) {
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return authResult.res;
  }

  try {
    const notification = await prisma.notification.findUnique({
      where: { id: params.id },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    // Verificar se a notificação pertence ao usuário
    if (notification.userId !== authResult.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ notification });
  } catch (error) {
    console.error("Failed to fetch notification:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification" },
      { status: 500 }
    );
  }
}

// PATCH /api/notifications/[id] - Marcar como lida
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string> } }
) {
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return authResult.res;
  }

  const body = await req.json();
  const { isRead } = body;

  try {
    const notification = await prisma.notification.findUnique({
      where: { id: params.id },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    if (notification.userId !== authResult.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.notification.update({
      where: { id: params.id },
      data: {
        isRead,
        readAt: isRead ? new Date() : null,
      },
    });

    return NextResponse.json({ notification: updated });
  } catch (error) {
    console.error("Failed to update notification:", error);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications/[id] - Deletar notificação
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string> } }
) {
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return authResult.res;
  }

  try {
    const notification = await prisma.notification.findUnique({
      where: { id: params.id },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    if (notification.userId !== authResult.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.notification.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete notification:", error);
    return NextResponse.json(
      { error: "Failed to delete notification" },
      { status: 500 }
    );
  }
}

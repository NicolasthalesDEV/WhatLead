import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wacrm/db";
import { requireAuth } from "@/lib/auth";
import crypto from "crypto";

// GET /api/notifications/preferences - Obter preferências
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return authResult.res;
  }
  const notificationPreference = (prisma as any).notificationPreference;

  if (!notificationPreference) {
    return NextResponse.json({
      preferences: {
        userId: authResult.userId,
        emailEnabled: true,
        pushEnabled: true,
      },
    });
  }

  try {
    let preferences = await notificationPreference.findUnique({
      where: { userId: authResult.userId },
    });

    // Criar preferências padrão se não existirem
    if (!preferences) {
      preferences = await notificationPreference.create({
        data: { 
          id: crypto.randomUUID(),
          userId: authResult.userId,
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("Failed to fetch preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

// PUT /api/notifications/preferences - Atualizar preferências
export async function PUT(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return authResult.res;
  }
  const notificationPreference = (prisma as any).notificationPreference;

  if (!notificationPreference) {
    return NextResponse.json(
      { error: "Notification preferences are not available in current database schema" },
      { status: 501 }
    );
  }

  const body = await req.json();

  try {
    const preferences = await notificationPreference.upsert({
      where: { userId: authResult.userId },
      update: { ...body, updatedAt: new Date() },
      create: {
        userId: authResult.userId,
        ...body,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("Failed to update preferences:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}

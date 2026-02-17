import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wacrm/db";
import { requireAuth } from "@/lib/auth";

// GET /api/notifications/preferences - Obter preferências
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return authResult.res;
  }

  try {
    let preferences = await prisma.notificationPreference.findUnique({
      where: { userId: authResult.userId },
    });

    // Criar preferências padrão se não existirem
    if (!preferences) {
      preferences = await prisma.notificationPreference.create({
        data: { userId: authResult.userId },
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

  const body = await req.json();

  try {
    const preferences = await prisma.notificationPreference.upsert({
      where: { userId: authResult.userId },
      update: body,
      create: {
        userId: authResult.userId,
        ...body,
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

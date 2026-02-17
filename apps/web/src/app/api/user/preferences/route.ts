import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@wacrm/db";
import { UnauthorizedError, errorResponse } from "@/lib/errors";

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    if (!session.ok) {
      return session.res;
    }

    const body = await req.json();
    const { notifications } = body;

    // Buscar usuário atual
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { preferences: true },
    });

    if (!user) {
      throw new UnauthorizedError("Usuário não encontrado");
    }

    // Merge das preferências existentes com as novas
    const currentPreferences = (user.preferences as any) || {};
    const updatedPreferences = {
      ...currentPreferences,
      notifications: {
        ...(currentPreferences.notifications || {}),
        ...notifications,
      },
    };

    // Atualizar preferências
    await prisma.user.update({
      where: { id: session.userId },
      data: {
        preferences: updatedPreferences,
      },
    });

    return NextResponse.json({
      success: true,
      preferences: updatedPreferences,
    });
  } catch (error: any) {
    console.error("Failed to update preferences:", error);
    return errorResponse(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    if (!session.ok) {
      return session.res;
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { preferences: true },
    });

    if (!user) {
      throw new UnauthorizedError("Usuário não encontrado");
    }

    return NextResponse.json({
      success: true,
      preferences: user.preferences || {},
    });
  } catch (error: any) {
    console.error("Failed to get preferences:", error);
    return errorResponse(error);
  }
}

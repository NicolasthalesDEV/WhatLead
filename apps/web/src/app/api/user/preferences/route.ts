import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@wacrm/db";
import { errorResponse } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    if (!session.ok) return session.res;

    const pref = await prisma.notificationPreference.upsert({
      where: { userId: session.userId },
      create: { userId: session.userId },
      update: {},
    });

    return NextResponse.json({
      success: true,
      preferences: {
        notifications: {
          whatsapp: pref.newMessageEnabled,
          chatbot: pref.pushEnabled,
        },
      },
    });
  } catch (error: any) {
    console.error("Failed to get preferences:", error);
    return errorResponse(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    if (!session.ok) return session.res;

    const body = await req.json();
    const n = body?.notifications ?? {};

    const data: Record<string, boolean> = {};
    if (typeof n.whatsapp === "boolean") data.newMessageEnabled = n.whatsapp;
    if (typeof n.chatbot === "boolean") data.pushEnabled = n.chatbot;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const pref = await prisma.notificationPreference.upsert({
      where: { userId: session.userId },
      create: { userId: session.userId, ...data },
      update: data,
    });

    return NextResponse.json({
      success: true,
      preferences: {
        notifications: {
          whatsapp: pref.newMessageEnabled,
          chatbot: pref.pushEnabled,
        },
      },
    });
  } catch (error: any) {
    console.error("Failed to update preferences:", error);
    return errorResponse(error);
  }
}


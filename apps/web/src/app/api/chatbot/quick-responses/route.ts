import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@wacrm/db";

// GET /api/chatbot/quick-responses
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;
  const quickResponse = (prisma as any).quickResponse;

  if (!quickResponse) {
    return NextResponse.json({ responses: [] });
  }

  const responses = await quickResponse.findMany({
    where: { companyId: auth.companyId },
    orderBy: { usageCount: "desc" },
  });

  return NextResponse.json({ responses });
}

// POST /api/chatbot/quick-responses
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;
  const quickResponse = (prisma as any).quickResponse;

  if (!quickResponse) {
    return NextResponse.json(
      { error: { code: "NOT_AVAILABLE", message: "Quick responses feature is not available in current database schema" } },
      { status: 501 }
    );
  }

  const { shortcut, message } = await req.json();

  const response = await quickResponse.create({
    data: {
      id: crypto.randomUUID(),
      companyId: auth.companyId,
      shortcut,
      message,
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({ response }, { status: 201 });
}

// PUT /api/chatbot/quick-responses
export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;
  const quickResponse = (prisma as any).quickResponse;

  if (!quickResponse) {
    return NextResponse.json(
      { error: { code: "NOT_AVAILABLE", message: "Quick responses feature is not available in current database schema" } },
      { status: 501 }
    );
  }

  const { id, shortcut, message, active } = await req.json();

  if (!id) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "id is required" } },
      { status: 400 }
    );
  }

  const response = await quickResponse.updateMany({
    where: {
      id,
      companyId: auth.companyId,
    },
    data: { shortcut, message, active, updatedAt: new Date() },
  });

  if (response.count === 0) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND" } },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}

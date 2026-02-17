import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@wacrm/db";

// GET /api/chatbot/quick-responses
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  const responses = await prisma.quickResponse.findMany({
    where: { companyId: auth.companyId },
    orderBy: { usageCount: "desc" },
  });

  return NextResponse.json({ responses });
}

// POST /api/chatbot/quick-responses
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  const { shortcut, message } = await req.json();

  const response = await prisma.quickResponse.create({
    data: {
      companyId: auth.companyId,
      shortcut,
      message,
      active: true,
    },
  });

  return NextResponse.json({ response }, { status: 201 });
}

// PUT /api/chatbot/quick-responses/:id
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  const { shortcut, message, active } = await req.json();

  const response = await prisma.quickResponse.updateMany({
    where: {
      id: params.id,
      companyId: auth.companyId,
    },
    data: { shortcut, message, active },
  });

  if (response.count === 0) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND" } },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}

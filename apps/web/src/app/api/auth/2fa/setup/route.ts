import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  return NextResponse.json({
    error: {
      code: "NOT_AVAILABLE",
      message: "2FA is not available in the current database schema",
    },
  }, { status: 501 });
}

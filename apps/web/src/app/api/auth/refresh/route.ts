import { NextRequest, NextResponse } from "next/server";
import { refreshSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { refreshToken } = await req.json();

  if (!refreshToken) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Refresh token required" } },
      { status: 400 }
    );
  }

  try {
    const session = await refreshSession(refreshToken);
    return NextResponse.json(session);
  } catch (error) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid or expired refresh token" } },
      { status: 401 }
    );
  }
}

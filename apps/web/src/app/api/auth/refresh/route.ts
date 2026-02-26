import { NextRequest, NextResponse } from "next/server";
import { refreshSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  // Accept refresh token from cookie (preferred) or request body (legacy)
  let refreshToken = req.cookies.get("refreshToken")?.value;

  if (!refreshToken) {
    try {
      const body = await req.json().catch(() => ({}));
      refreshToken = body.refreshToken;
    } catch {
      // ignore parse errors
    }
  }

  if (!refreshToken) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Refresh token required" } },
      { status: 400 }
    );
  }

  try {
    const session = await refreshSession(refreshToken);

    const res = NextResponse.json(session);

    // Set the new access token as an HttpOnly cookie so the browser
    // picks it up automatically for all subsequent API requests
    res.cookies.set("accessToken", session.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 900, // 15 minutes
      path: "/",
    });

    return res;
  } catch {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid or expired refresh token" } },
      { status: 401 }
    );
  }
}

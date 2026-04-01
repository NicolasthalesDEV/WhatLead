/**
 * GET /api/agenda/google/callback
 * Handles the Google OAuth callback, exchanges code for tokens, saves them.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wacrm/db";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // companyId
  const error = searchParams.get("error");

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

  if (error || !code || !state) {
    return NextResponse.redirect(
      `${appUrl}/dashboard/agenda?google=failed&reason=${error || "missing_code"}`
    );
  }

  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    `${appUrl}/api/agenda/google/callback`;

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenRes.json();

    if (!tokenRes.ok || !tokens.access_token) {
      throw new Error(tokens.error_description || "Failed to exchange code for tokens");
    }

    // Upsert token record
    await prisma.googleCalendarToken.upsert({
      where: { companyId: state },
      create: {
        id: crypto.randomUUID(),
        companyId: state,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || null,
        expiresAt: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : null,
        scope: tokens.scope || null,
        tokenType: tokens.token_type || "Bearer",
        updatedAt: new Date(),
      },
      update: {
        accessToken: tokens.access_token,
        ...(tokens.refresh_token && { refreshToken: tokens.refresh_token }),
        expiresAt: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : undefined,
        scope: tokens.scope || undefined,
        updatedAt: new Date(),
      },
    });

    return NextResponse.redirect(`${appUrl}/dashboard/agenda?google=connected`);
  } catch (err: any) {
    console.error("Google Calendar callback error:", err);
    return NextResponse.redirect(
      `${appUrl}/dashboard/agenda?google=failed&reason=${encodeURIComponent(err.message)}`
    );
  }
}

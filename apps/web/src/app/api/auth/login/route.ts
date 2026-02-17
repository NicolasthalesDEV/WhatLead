import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wacrm/db";
import { z } from "zod";
import { createSession, checkRateLimit, createAuditLog } from "@/lib/auth";
import bcrypt from "bcryptjs";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  twoFactorCode: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const json = await req.json();
  const body = Body.safeParse(json);
  
  if (!body.success) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Invalid body" } }, { status: 400 });
  }

  // Rate limiting by email
  const rateLimitKey = `login:${body.data.email}`;
  if (!checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: { code: "RATE_LIMIT", message: "Too many login attempts. Try again later." } },
      { status: 429 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email: body.data.email } });
  
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid credentials" } },
      { status: 401 }
    );
  }

  // Check if account is locked
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    return NextResponse.json(
      { error: { code: "ACCOUNT_LOCKED", message: `Account locked. Try again in ${minutesLeft} minutes.` } },
      { status: 403 }
    );
  }

  const ok = await bcrypt.compare(body.data.password, user.hash);
  
  if (!ok) {
    // Increment login attempts
    const newAttempts = user.loginAttempts + 1;
    const updates: any = { loginAttempts: newAttempts };
    
    // Lock account after 5 failed attempts
    if (newAttempts >= 5) {
      updates.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    }
    
    await prisma.user.update({
      where: { id: user.id },
      data: updates,
    });

    await createAuditLog({
      userId: user.id,
      companyId: user.companyId,
      action: "LOGIN_FAILED",
      resource: "auth",
      metadata: { email: body.data.email, attempts: newAttempts },
      req,
    });

    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid credentials" } },
      { status: 401 }
    );
  }

  // Check 2FA if enabled
  if (user.twoFactorEnabled) {
    if (!body.data.twoFactorCode) {
      return NextResponse.json(
        { error: { code: "2FA_REQUIRED", message: "Two-factor authentication code required" } },
        { status: 403 }
      );
    }

    // Verify 2FA code (simplified - in production use proper TOTP library)
    const validCode = user.twoFactorBackupCodes.includes(body.data.twoFactorCode);
    
    if (!validCode) {
      await createAuditLog({
        userId: user.id,
        companyId: user.companyId,
        action: "2FA_FAILED",
        resource: "auth",
        req,
      });

      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Invalid 2FA code" } },
        { status: 401 }
      );
    }

    // Remove used backup code
    if (validCode) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorBackupCodes: user.twoFactorBackupCodes.filter(c => c !== body.data.twoFactorCode),
        },
      });
    }
  }

  // Reset login attempts on successful login
  await prisma.user.update({
    where: { id: user.id },
    data: {
      loginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      lastLoginIp: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
    },
  });

  // Create session with refresh token
  const session = await createSession(user.id, user.companyId, user.role, req);

  await createAuditLog({
    userId: user.id,
    companyId: user.companyId,
    action: "LOGIN_SUCCESS",
    resource: "auth",
    metadata: { sessionId: session.sessionId },
    req,
  });

  return NextResponse.json({
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    expiresIn: session.expiresIn,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
    },
  });
}

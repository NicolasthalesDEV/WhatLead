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

  const ok = await bcrypt.compare(body.data.password, user.hash);
  
  if (!ok) {
    await createAuditLog({
      userId: user.id,
      companyId: user.companyId,
      action: "LOGIN_FAILED",
      resource: "auth",
      metadata: { email: body.data.email },
      req,
    });

    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid credentials" } },
      { status: 401 }
    );
  }

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
      emailVerified: false,
      twoFactorEnabled: false,
    },
  });
}

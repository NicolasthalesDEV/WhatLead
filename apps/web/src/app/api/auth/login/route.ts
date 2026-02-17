import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wacrm/db";
import { z } from "zod";
import { createSession, checkRateLimit, createAuditLog } from "@/lib/auth";
import bcrypt from "bcryptjs";
import {
  errorResponse,
  ValidationError,
  InvalidCredentialsError,
  RateLimitError
} from "@/lib/errors";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  twoFactorCode: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const body = Body.safeParse(json);
    
    if (!body.success) {
      throw new ValidationError("Dados inválidos. Verifique email e senha", body.error.issues);
    }

    // Rate limiting by email
    const rateLimitKey = `login:${body.data.email}`;
    if (!checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000)) {
      throw new RateLimitError(900); // 15 minutos
    }

    const user = await prisma.user.findUnique({ where: { email: body.data.email } });
    
    if (!user) {
      throw new InvalidCredentialsError();
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

      throw new InvalidCredentialsError();
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

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: false,
        twoFactorEnabled: false,
      },
    });

    // Configurar cookies HttpOnly para segurança
    response.cookies.set('accessToken', session.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 900, // 15 minutos
      path: '/'
    });

    response.cookies.set('refreshToken', session.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 dias
      path: '/'
    });

    return response;
  } catch (error) {
    console.error("[login] error:", error);
    return errorResponse(error as Error, "api/auth/login");
  }
}

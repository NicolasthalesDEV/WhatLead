import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { createSession, createAuditLog, checkRateLimit } from "@/lib/auth";
import {
  errorResponse,
  RateLimitError,
  ValidationError,
  DuplicateEmailError,
  DuplicateSlugError,
  WeakPasswordError,
  InvalidEmailError,
  MissingFieldError
} from "@/lib/errors";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  company: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  name: z.string().min(2),
});

const ALLOW_METHODS = "POST, OPTIONS";

function diagnosticMeta(req: NextRequest, requestId: string, extra: Record<string, unknown> = {}) {
  return {
    requestId,
    handler: "api/auth/register",
    method: req.method,
    path: req.nextUrl.pathname,
    timestamp: new Date().toISOString(),
    host: req.headers.get("host"),
    forwardedHost: req.headers.get("x-forwarded-host"),
    forwardedProto: req.headers.get("x-forwarded-proto"),
    ...extra,
  };
}

function jsonError(
  req: NextRequest,
  status: number,
  code: string,
  message: string,
  extraMeta: Record<string, unknown> = {},
  details?: unknown
) {
  const requestId = crypto.randomUUID();

  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
      },
      meta: diagnosticMeta(req, requestId, extraMeta),
    },
    {
      status,
      headers: {
        Allow: ALLOW_METHODS,
        "X-Request-Id": requestId,
        "X-Route-Handler": "api/auth/register",
      },
    }
  );
}

function methodNotAllowed(req: NextRequest) {
  return jsonError(
    req,
    405,
    "METHOD_NOT_ALLOWED",
    `Method ${req.method} not allowed for this endpoint. Use POST.`,
    { allowedMethods: ALLOW_METHODS }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: ALLOW_METHODS,
      "Access-Control-Allow-Methods": ALLOW_METHODS,
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-CSRF-Token",
      "X-Route-Handler": "api/auth/register",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const { prisma } = await import("@wacrm/db");

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (!await checkRateLimit(`register:${ip}`, 3, 60 * 60 * 1000)) {
      throw new RateLimitError(3600);
    }

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      throw new ValidationError("Dados inválidos. Verifique o formato da requisição");
    }

    const body = Body.safeParse(json);

    if (!body.success) {
      const firstError = body.error.issues[0];
      const fieldName = firstError.path.join(".");
      throw new ValidationError(`Campo inválido: ${fieldName}`, body.error.issues);
    }

    // Validações adicionais
    if (body.data.password.length < 8) {
      throw new WeakPasswordError();
    }

    const existingEmail = await prisma.user.findUnique({ where: { email: body.data.email } });
    if (existingEmail) {
      throw new DuplicateEmailError();
    }

    const exists = await prisma.company.findUnique({ where: { slug: body.data.slug } });
    if (exists) {
      throw new DuplicateSlugError();
    }

    const result = await prisma.$transaction(async (tx: any) => {
      const companyId = crypto.randomUUID();
      const userId = crypto.randomUUID();

      // Calcular data de expiração do trial (14 dias)
      const now = new Date();
      const trialExpiresAt = new Date(now);
      trialExpiresAt.setDate(trialExpiresAt.getDate() + 14);

      const company = await tx.company.create({
        data: { 
          id: companyId, 
          name: body.data.company, 
          slug: body.data.slug,
          plan: "professional",
          planStatus: "trial",
          planStartedAt: now,
          planExpiresAt: trialExpiresAt,
          billingCycle: "monthly",
        },
      });

      const hash = await bcrypt.hash(body.data.password, 10);
      const user = await tx.user.create({
        data: {
          id: userId,
          companyId: company.id,
          email: body.data.email,
          hash,
          role: "OWNER",
          name: body.data.name,
        },
      });

      return { company, user };
    });

    const session = await createSession(result.user.id, result.company.id, result.user.role, req);

    await createAuditLog({
      userId: result.user.id,
      companyId: result.company.id,
      action: "USER_REGISTERED",
      resource: "auth",
      metadata: {
        email: result.user.email,
        companySlug: result.company.slug,
        sessionId: session.sessionId,
      },
      req,
    });

    const requestId = crypto.randomUUID();
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
          emailVerified: false,
        },
        company: {
          id: result.company.id,
          name: result.company.name,
          slug: result.company.slug,
        },
        meta: diagnosticMeta(req, requestId),
      },
      {
        headers: {
          "X-Request-Id": requestId,
          "X-Route-Handler": "api/auth/register",
        },
      }
    );

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
    console.error("[register] error:", error);
    return errorResponse(error as Error, "api/auth/register");
  }
}

export async function GET(req: NextRequest) {
  return methodNotAllowed(req);
}

export async function PUT(req: NextRequest) {
  return methodNotAllowed(req);
}

export async function PATCH(req: NextRequest) {
  return methodNotAllowed(req);
}

export async function DELETE(req: NextRequest) {
  return methodNotAllowed(req);
}

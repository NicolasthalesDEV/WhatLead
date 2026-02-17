import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wacrm/db";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { createSession, createAuditLog, checkRateLimit } from "@/lib/auth";

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
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (!checkRateLimit(`register:${ip}`, 3, 60 * 60 * 1000)) {
      return jsonError(req, 429, "RATE_LIMIT", "Too many registration attempts. Try again later.");
    }

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return jsonError(req, 400, "BAD_JSON", "Invalid JSON body");
    }

    const body = Body.safeParse(json);

    if (!body.success) {
      return jsonError(req, 400, "BAD_REQUEST", "Invalid input", {}, body.error.issues);
    }

    const existingEmail = await prisma.user.findUnique({ where: { email: body.data.email } });
    if (existingEmail) {
      return jsonError(req, 409, "CONFLICT", "Email already in use");
    }

    const exists = await prisma.company.findUnique({ where: { slug: body.data.slug } });
    if (exists) {
      return jsonError(req, 409, "CONFLICT", "Company slug already in use");
    }

    const result = await prisma.$transaction(async (tx: any) => {
      const companyId = crypto.randomUUID();
      const userId = crypto.randomUUID();

      const company = await tx.company.create({
        data: { id: companyId, name: body.data.company, slug: body.data.slug },
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
    return NextResponse.json(
      {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        expiresIn: session.expiresIn,
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
  } catch (error) {
    console.error("[register] unexpected error", error);
    return jsonError(req, 500, "INTERNAL_ERROR", "Unexpected server error while creating account");
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

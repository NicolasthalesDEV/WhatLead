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

export async function POST(req: NextRequest) {
  // Rate limiting by IP
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  if (!checkRateLimit(`register:${ip}`, 3, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: { code: "RATE_LIMIT", message: "Too many registration attempts. Try again later." } },
      { status: 429 }
    );
  }

  const json = await req.json();
  const body = Body.safeParse(json);
  
  if (!body.success) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Invalid input", details: body.error.issues } },
      { status: 400 }
    );
  }

  // Check if email already exists
  const existingEmail = await prisma.user.findUnique({ where: { email: body.data.email } });
  if (existingEmail) {
    return NextResponse.json(
      { error: { code: "CONFLICT", message: "Email already in use" } },
      { status: 409 }
    );
  }

  // Check if slug already exists
  const exists = await prisma.company.findUnique({ where: { slug: body.data.slug } });
  if (exists) {
    return NextResponse.json(
      { error: { code: "CONFLICT", message: "Company slug already in use" } },
      { status: 409 }
    );
  }

  // Create company and user in a transaction
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

  // Create session
  const session = await createSession(result.user.id, result.company.id, result.user.role, req);

  // Create audit log
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

  return NextResponse.json({
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
  });
}

import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import crypto from "crypto";

async function getPrisma() {
  const db = await import("@wacrm/db");
  return db.prisma as any;
}

const alg = "HS256";
const secret = new TextEncoder().encode(process.env.JWT_SECRET || "devsecret");

export type Claims = { uid: string; companyId: string; role: string; sessionId?: string };

// Token expiration times
const ACCESS_TOKEN_EXPIRY = "15m"; // 15 minutes
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
const REFRESH_TOKEN_EXPIRY_JWT = "7d";

export async function signJwt(payload: Claims, expiresIn: string = ACCESS_TOKEN_EXPIRY) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

export async function verifyJwt(token: string) {
  const { payload } = await jwtVerify(token, secret, { algorithms: [alg] });
  return payload as Claims;
}

export async function createSession(userId: string, companyId: string, role: string, req: NextRequest) {
  const prisma = await getPrisma();
  const sessionModel = (prisma as any).session;

  const accessToken = await signJwt({ uid: userId, companyId, role }, ACCESS_TOKEN_EXPIRY);
  const refreshToken = sessionModel?.create
    ? crypto.randomBytes(32).toString("hex")
    : await signJwt({ uid: userId, companyId, role }, REFRESH_TOKEN_EXPIRY_JWT);
  
  const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";
  
  if (!sessionModel?.create) {
    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
      sessionId: undefined,
    };
  }

  const session = await sessionModel.create({
    data: {
      userId,
      refreshToken,
      accessToken,
      ipAddress,
      userAgent,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY),
    },
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: 900, // 15 minutes in seconds
    sessionId: session.id,
  };
}

export async function refreshSession(refreshToken: string) {
  const prisma = await getPrisma();
  const sessionModel = (prisma as any).session;

  if (!sessionModel?.findUnique) {
    const claims = await verifyJwt(refreshToken);
    const accessToken = await signJwt(
      {
        uid: claims.uid,
        companyId: claims.companyId,
        role: claims.role,
      },
      ACCESS_TOKEN_EXPIRY
    );

    return {
      accessToken,
      expiresIn: 900,
    };
  }

  const session = await sessionModel.findUnique({
    where: { refreshToken },
    include: { user: true },
  });

  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    throw new Error("Invalid or expired refresh token");
  }

  const accessToken = await signJwt(
    { 
      uid: session.userId, 
      companyId: session.user.companyId, 
      role: session.user.role,
      sessionId: session.id 
    }, 
    ACCESS_TOKEN_EXPIRY
  );

  await sessionModel.update({
    where: { id: session.id },
    data: { accessToken },
  });

  return {
    accessToken,
    expiresIn: 900,
  };
}

export async function revokeSession(sessionId: string) {
  const prisma = await getPrisma();
  const sessionModel = (prisma as any).session;
  if (!sessionModel?.update) return;

  await sessionModel.update({
    where: { id: sessionId },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllUserSessions(userId: string) {
  const prisma = await getPrisma();
  const sessionModel = (prisma as any).session;
  if (!sessionModel?.updateMany) return;

  await sessionModel.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function requireAuth(req: NextRequest): Promise<
  | { ok: true; userId: string; companyId: string; role: string; sessionId?: string }
  | { ok: false; res: NextResponse }
> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return { ok: false, res: NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 }) };
  }
  const token = auth.slice(7);
  try {
    const claims = await verifyJwt(token);
    
    // Verify session is still valid if sessionId is present
    if (claims.sessionId) {
      const prisma = await getPrisma();
      const sessionModel = (prisma as any).session;
      if (sessionModel?.findUnique) {
        const session = await sessionModel.findUnique({
        where: { id: claims.sessionId },
        });
      
        if (!session || session.revokedAt || session.expiresAt < new Date()) {
          return { ok: false, res: NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Session expired" } }, { status: 401 }) };
        }
      }
    }
    
    return { ok: true, userId: claims.uid, companyId: claims.companyId, role: claims.role, sessionId: claims.sessionId };
  } catch {
    return { ok: false, res: NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 }) };
  }
}

// Simpler auth verification that returns claims or null
export async function verifyAuth(req: NextRequest): Promise<Claims | null> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return null;
  }
  const token = auth.slice(7);
  try {
    const claims = await verifyJwt(token);
    
    // Verify session is still valid if sessionId is present
    if (claims.sessionId) {
      const prisma = await getPrisma();
      const sessionModel = (prisma as any).session;
      if (sessionModel?.findUnique) {
        const session = await sessionModel.findUnique({
        where: { id: claims.sessionId },
        });
      
        if (!session || session.revokedAt || session.expiresAt < new Date()) {
          return null;
        }
      }
    }
    
    return claims;
  } catch {
    return null;
  }
}

// Rate limiting helper
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || record.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= maxAttempts) {
    return false;
  }

  record.count++;
  return true;
}

export function resetRateLimit(key: string) {
  rateLimitMap.delete(key);
}

// Audit log helper
export async function createAuditLog(params: {
  userId?: string;
  companyId: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: any;
  req?: NextRequest;
}) {
  const ipAddress = params.req?.headers.get("x-forwarded-for") || params.req?.headers.get("x-real-ip") || undefined;
  const userAgent = params.req?.headers.get("user-agent") || undefined;

  const prisma = await getPrisma();
  const auditLogModel = (prisma as any).auditLog;
  if (!auditLogModel?.create) {
    return;
  }

  await auditLogModel.create({
    data: {
      userId: params.userId,
      companyId: params.companyId,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      metadata: params.metadata || undefined,
      ipAddress,
      userAgent,
    },
  });
}

// Email verification helpers
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function generatePasswordResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// 2FA helpers
export function generateTwoFactorSecret(): string {
  const base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let secret = "";
  for (let i = 0; i < 32; i++) {
    secret += base32chars[Math.floor(Math.random() * base32chars.length)];
  }
  return secret;
}

export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(crypto.randomBytes(4).toString("hex").toUpperCase());
  }
  return codes;
}

export function verifyTOTP(secret: string, token: string): boolean {
  // Simple TOTP verification (in production, use a library like 'otpauth')
  // This is a simplified version for demonstration
  const window = 1; // Allow 30 seconds before/after
  const time = Math.floor(Date.now() / 30000);
  
  for (let i = -window; i <= window; i++) {
    const testToken = generateTOTP(secret, time + i);
    if (testToken === token) {
      return true;
    }
  }
  
  return false;
}

function generateTOTP(secret: string, time: number): string {
  // Simplified TOTP generation (use 'otpauth' library in production)
  const hmac = crypto.createHmac("sha1", Buffer.from(secret));
  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeBigInt64BE(BigInt(time));
  const hash = hmac.update(timeBuffer).digest();
  
  const offset = hash[hash.length - 1] & 0xf;
  const binary = ((hash[offset] & 0x7f) << 24) |
                 ((hash[offset + 1] & 0xff) << 16) |
                 ((hash[offset + 2] & 0xff) << 8) |
                 (hash[offset + 3] & 0xff);
  
  const otp = binary % 1000000;
  return otp.toString().padStart(6, "0");
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.default.hash(password, 10);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.default.compare(password, hash);
}

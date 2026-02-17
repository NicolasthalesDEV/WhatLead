import { NextRequest, NextResponse } from "next/server";
import { requireAuth, createAuditLog, revokeAllUserSessions } from "@/lib/auth";
import { prisma } from "@wacrm/db";
import { z } from "zod";
import bcrypt from "bcryptjs";

const Body = z.object({
  password: z.string(),
});

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  const json = await req.json();
  const body = Body.safeParse(json);

  if (!body.success) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Password required" } },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { id: auth.userId } });

  if (!user) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "User not found" } },
      { status: 404 }
    );
  }

  // Verify password
  const validPassword = await bcrypt.compare(body.data.password, user.hash);

  if (!validPassword) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid password" } },
      { status: 401 }
    );
  }

  // Disable 2FA
  await prisma.user.update({
    where: { id: auth.userId },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: [],
    },
  });

  // Revoke all sessions for security
  await revokeAllUserSessions(auth.userId);

  await createAuditLog({
    userId: auth.userId,
    companyId: auth.companyId,
    action: "2FA_DISABLED",
    resource: "auth",
    req,
  });

  return NextResponse.json({
    success: true,
    message: "Two-factor authentication disabled. All sessions have been logged out.",
  });
}

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, verifyTOTP, createAuditLog } from "@/lib/auth";
import { prisma } from "@wacrm/db";
import { z } from "zod";

const Body = z.object({
  code: z.string().length(6),
});

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  const json = await req.json();
  const body = Body.safeParse(json);

  if (!body.success) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Invalid code format" } },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { id: auth.userId } });

  if (!user || !user.twoFactorSecret) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "2FA not set up" } },
      { status: 400 }
    );
  }

  const isValid = verifyTOTP(user.twoFactorSecret, body.data.code);

  if (!isValid) {
    await createAuditLog({
      userId: auth.userId,
      companyId: auth.companyId,
      action: "2FA_VERIFICATION_FAILED",
      resource: "auth",
      req,
    });

    return NextResponse.json(
      { error: { code: "INVALID_CODE", message: "Invalid verification code" } },
      { status: 400 }
    );
  }

  // Enable 2FA
  await prisma.user.update({
    where: { id: auth.userId },
    data: { twoFactorEnabled: true },
  });

  await createAuditLog({
    userId: auth.userId,
    companyId: auth.companyId,
    action: "2FA_ENABLED",
    resource: "auth",
    req,
  });

  return NextResponse.json({
    success: true,
    message: "Two-factor authentication enabled successfully",
  });
}

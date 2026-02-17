import { NextRequest, NextResponse } from "next/server";
import { requireAuth, generateTwoFactorSecret, generateBackupCodes, createAuditLog } from "@/lib/auth";
import { prisma } from "@wacrm/db";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  // Generate 2FA secret
  const secret = generateTwoFactorSecret();
  const backupCodes = generateBackupCodes();

  await prisma.user.update({
    where: { id: auth.userId },
    data: {
      twoFactorSecret: secret,
      twoFactorBackupCodes: backupCodes,
      twoFactorEnabled: false, // Will be enabled after verification
    },
  });

  await createAuditLog({
    userId: auth.userId,
    companyId: auth.companyId,
    action: "2FA_SETUP_INITIATED",
    resource: "auth",
    req,
  });

  // Generate QR code URL for authenticator apps
  const user = await prisma.user.findUnique({ where: { id: auth.userId } });
  const issuer = "WhatLead";
  const qrCodeUrl = `otpauth://totp/${issuer}:${user?.email}?secret=${secret}&issuer=${issuer}`;

  return NextResponse.json({
    secret,
    qrCodeUrl,
    backupCodes,
  });
}

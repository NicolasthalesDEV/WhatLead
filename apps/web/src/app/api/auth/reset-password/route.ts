import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wacrm/db";
import { z } from "zod";
import { createAuditLog, revokeAllUserSessions } from "@/lib/auth";
import bcrypt from "bcryptjs";

const Body = z.object({
  token: z.string(),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  const json = await req.json();
  const body = Body.safeParse(json);

  if (!body.success) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Invalid request" } },
      { status: 400 }
    );
  }

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: body.data.token,
      passwordResetExpiry: {
        gte: new Date(),
      },
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: { code: "INVALID_TOKEN", message: "Invalid or expired reset token" } },
      { status: 400 }
    );
  }

  const hash = await bcrypt.hash(body.data.password, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      hash,
      passwordResetToken: null,
      passwordResetExpiry: null,
    },
  });

  // Revoke all existing sessions for security
  await revokeAllUserSessions(user.id);

  await createAuditLog({
    userId: user.id,
    companyId: user.companyId,
    action: "PASSWORD_RESET",
    resource: "auth",
    req,
  });

  return NextResponse.json({
    success: true,
    message: "Password reset successfully. Please login with your new password.",
  });
}

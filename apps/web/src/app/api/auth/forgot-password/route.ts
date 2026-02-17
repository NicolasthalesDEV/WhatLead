import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wacrm/db";
import { z } from "zod";
import { generatePasswordResetToken, createAuditLog } from "@/lib/auth";

const Body = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  const json = await req.json();
  const body = Body.safeParse(json);

  if (!body.success) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Invalid email" } },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: body.data.email },
  });

  // Always return success to prevent email enumeration
  if (!user) {
    return NextResponse.json({
      success: true,
      message: "If the email exists, a password reset link has been sent",
    });
  }

  const resetToken = generatePasswordResetToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: resetToken,
      passwordResetExpiry: expiresAt,
    },
  });

  await createAuditLog({
    userId: user.id,
    companyId: user.companyId,
    action: "PASSWORD_RESET_REQUESTED",
    resource: "auth",
    req,
  });

  // TODO: Send email with reset link
  // In production, send email: ${process.env.APP_URL}/reset-password?token=${resetToken}
  console.log(`Password reset token for ${user.email}: ${resetToken}`);

  return NextResponse.json({
    success: true,
    message: "If the email exists, a password reset link has been sent",
  });
}

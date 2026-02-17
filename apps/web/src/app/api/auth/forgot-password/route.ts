import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wacrm/db";
import { z } from "zod";
import { createAuditLog } from "@/lib/auth";

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

  await createAuditLog({
    userId: user.id,
    companyId: user.companyId,
    action: "PASSWORD_RESET_REQUESTED",
    resource: "auth",
    req,
  });

  return NextResponse.json({
    success: true,
    message: "Password reset is not available in the current database schema",
  });
}

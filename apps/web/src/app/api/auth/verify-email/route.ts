import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wacrm/db";
import { z } from "zod";
import { createAuditLog } from "@/lib/auth";

const Query = z.object({
  token: z.string(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = Query.safeParse({ token: searchParams.get("token") });

  if (!query.success) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Invalid token" } },
      { status: 400 }
    );
  }

  const user = await prisma.user.findFirst({
    where: { emailVerifyToken: query.data.token },
  });

  if (!user) {
    return NextResponse.json(
      { error: { code: "INVALID_TOKEN", message: "Invalid verification token" } },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerifyToken: null,
    },
  });

  await createAuditLog({
    userId: user.id,
    companyId: user.companyId,
    action: "EMAIL_VERIFIED",
    resource: "auth",
    req,
  });

  return NextResponse.json({
    success: true,
    message: "Email verified successfully",
  });
}

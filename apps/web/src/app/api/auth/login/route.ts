import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wacrm/db";
import { z } from "zod";
import { signJwt } from "@/lib/auth";
import bcrypt from "bcryptjs";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  const json = await req.json();
  const body = Body.safeParse(json);
  if (!body.success) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Invalid body" } }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { email: body.data.email } });
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Invalid credentials" } }, { status: 401 });
  const ok = await bcrypt.compare(body.data.password, user.hash);
  if (!ok) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Invalid credentials" } }, { status: 401 });

  const token = await signJwt({ uid: user.id, companyId: user.companyId, role: user.role });
  return NextResponse.json({ token });
}

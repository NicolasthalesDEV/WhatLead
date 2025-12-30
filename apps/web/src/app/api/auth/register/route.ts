import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wacrm/db";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { signJwt } from "@/lib/auth";

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  company: z.string().min(2),
  slug: z.string().min(2),
});

export async function POST(req: NextRequest) {
  const json = await req.json();
  const body = Body.safeParse(json);
  if (!body.success) return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Invalid body" } }, { status: 400 });

  const exists = await prisma.company.findUnique({ where: { slug: body.data.slug } });
  if (exists) return NextResponse.json({ error: { code: "CONFLICT", message: "Slug already in use" } }, { status: 409 });

  const company = await prisma.company.create({
    data: { name: body.data.company, slug: body.data.slug },
  });

  const hash = await bcrypt.hash(body.data.password, 10);
  const user = await prisma.user.create({
    data: {
      companyId: company.id,
      email: body.data.email,
      hash,
      role: "OWNER",
      name: "Owner"
    }
  });
  const token = await signJwt({ uid: user.id, companyId: company.id, role: user.role });
  return NextResponse.json({ token });
}

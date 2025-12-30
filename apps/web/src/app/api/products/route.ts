import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wacrm/db";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";

const CreateBody = z.object({
  title: z.string(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional()
});

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res!;

  const products = await prisma.product.findMany({
    where: { companyId: auth.companyId },
    include: { prices: true },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res!;
  const json = await req.json();
  const body = CreateBody.safeParse(json);
  if (!body.success) return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Invalid body" } }, { status: 400 });

  const slug = body.data.title.toLowerCase().replace(/\s+/g, "-");
  const product = await prisma.product.create({
    data: {
      companyId: auth.companyId!,
      title: body.data.title,
      description: body.data.description,
      imageUrl: body.data.imageUrl,
      slug,
      prices: { create: { amount: 1000 } }
    }
  });
  return NextResponse.json({ product });
}

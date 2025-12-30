import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wacrm/db";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";

const Body = z.object({
  customerId: z.string(),
  items: z.array(z.object({
    productId: z.string(),
    qty: z.number().int().positive(),
    priceCents: z.number().int().nonnegative()
  })).min(1)
});

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res!;
  const json = await req.json();
  const body = Body.safeParse(json);
  if (!body.success) return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Invalid body" } }, { status: 400 });

  const total = body.data.items.reduce((sum, i) => sum + i.priceCents * i.qty, 0);
  const q = await prisma.quote.create({
    data: {
      companyId: auth.companyId!,
      customerId: body.data.customerId,
      status: "DRAFT",
      total,
      items: { create: body.data.items.map(i => ({ productId: i.productId, qty: i.qty, priceCents: i.priceCents })) }
    }
  });
  return NextResponse.json({ quote: q });
}

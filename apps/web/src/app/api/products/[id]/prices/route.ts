import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wacrm/db";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";

const Body = z.object({
  amount: z.number().int().positive(),
  promoAmount: z.number().int().positive().optional()
});

export async function POST(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res!;
  const json = await req.json();
  const body = Body.safeParse(json);
  if (!body.success) return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Invalid body" } }, { status: 400 });

  const price = await prisma.price.create({
    data: {
      productId: id,
      amount: body.data.amount,
      promoAmount: body.data.promoAmount
    }
  });
  return NextResponse.json({ price });
}

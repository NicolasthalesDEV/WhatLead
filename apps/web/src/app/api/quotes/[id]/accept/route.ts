import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wacrm/db";
import { requireAuth } from "@/lib/auth";

export async function POST(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res!;

  const quote = await prisma.quote.findUnique({ where: { id }, include: { items: true } });
  if (!quote || quote.companyId !== auth.companyId) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Quote not found" } }, { status: 404 });

  const order = await prisma.order.create({
    data: {
      companyId: quote.companyId,
      customerId: quote.customerId,
      quoteId: quote.id,
      status: "AWAITING_PAYMENT",
      total: quote.total,
      items: { create: quote.items.map(i => ({ productId: i.productId, qty: i.qty, priceCents: i.priceCents })) }
    }
  });
  await prisma.quote.update({ where: { id: quote.id }, data: { status: "ACCEPTED" } });
  return NextResponse.json({ order });
}

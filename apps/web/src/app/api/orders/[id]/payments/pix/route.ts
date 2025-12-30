import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wacrm/db";
import { requireAuth } from "@/lib/auth";
import { getPixProvider } from "@/lib/pix/provider";

export async function POST(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res!;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || order.companyId !== auth.companyId) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Order not found" } }, { status: 404 });

  const payment = await prisma.payment.create({
    data: { 
      orderId: order.id, 
      companyId: order.companyId,
      provider: "PIX", 
      status: "PENDING", 
      amount: order.total 
    }
  });

  const provider = getPixProvider();
  const charge = await provider.createCharge(order.id, order.total);
  await prisma.payment.update({
    where: { id: payment.id },
    data: { chargeId: charge.chargeId, payload: charge }
  });

  return NextResponse.json({
    paymentId: payment.id,
    chargeId: charge.chargeId,
    qrCodeImage: charge.qrCodeImage,
    copiaECola: charge.emv
  });
}

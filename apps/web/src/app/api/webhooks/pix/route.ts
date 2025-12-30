import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wacrm/db";

export async function POST(req: NextRequest) {
  // Webhook fake para marcar pagamento como PAID quando emulado
  const body = await req.json();
  const { chargeId } = body || {};
  if (!chargeId) return NextResponse.json({ ok: false }, { status: 400 });

  const payment = await prisma.payment.findFirst({ where: { chargeId } });
  if (!payment) return NextResponse.json({ ok: false }, { status: 404 });

  await prisma.payment.update({ where: { id: payment.id }, data: { status: "PAID" } });
  await prisma.order.update({ where: { id: payment.orderId }, data: { status: "PAID" } });

  return NextResponse.json({ ok: true });
}

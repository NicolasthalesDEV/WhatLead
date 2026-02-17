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

  const order = await prisma.order.findUnique({ 
    where: { id },
    include: {
      customer: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order || order.companyId !== auth.companyId) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Order not found" } }, 
      { status: 404 }
    );
  }

  // Validar se pedido pode receber pagamento
  if (order.status === "PAID" || order.status === "CANCELED") {
    return NextResponse.json(
      { error: { code: "INVALID_STATUS", message: "Order cannot receive payment in current status" } }, 
      { status: 400 }
    );
  }

  try {
    // Criar registro de pagamento
    const payment = await prisma.payment.create({
      data: { 
        orderId: order.id, 
        companyId: order.companyId,
        provider: "PIX", 
        status: "PENDING", 
        amount: order.total 
      }
    });

    // Gerar cobrança PIX via gateway
    const provider = getPixProvider();
    
    // Montar descrição do pedido
    const description = `Pedido #${order.id.slice(0, 8)} - ${order.items.length} ${order.items.length === 1 ? 'item' : 'itens'}`;
    
    // Dados do cliente (se disponível)
    const customer = order.customer ? {
      name: order.customer.name || undefined,
      email: order.customer.email || undefined,
      phone: order.customer.phoneE164 || undefined,
    } : undefined;

    const charge = await provider.createCharge(
      order.id, 
      order.total,
      description,
      customer
    );

    // Atualizar pagamento com dados da cobrança
    await prisma.payment.update({
      where: { id: payment.id },
      data: { 
        chargeId: charge.chargeId, 
        payload: charge as any,
      }
    });

    // Atualizar status do pedido para AWAITING_PAYMENT
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "AWAITING_PAYMENT" },
    });

    return NextResponse.json({
      paymentId: payment.id,
      chargeId: charge.chargeId,
      qrCodeImage: charge.qrCodeImage,
      copiaECola: charge.emv,
      expiresAt: charge.expiresAt,
      amount: charge.amount,
      status: charge.status,
    });
  } catch (error: any) {
    console.error("Error creating PIX charge:", error);
    return NextResponse.json(
      { error: { code: "PAYMENT_ERROR", message: error.message || "Failed to create PIX charge" } }, 
      { status: 500 }
    );
  }
}

/**
 * GET: Consulta status de um pagamento PIX existente
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res!;

  const order = await prisma.order.findUnique({ 
    where: { id },
    include: {
      payments: {
        where: { provider: "PIX" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!order || order.companyId !== auth.companyId) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Order not found" } }, 
      { status: 404 }
    );
  }

  const payment = order.payments[0];

  if (!payment || !payment.chargeId) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "No PIX payment found for this order" } }, 
      { status: 404 }
    );
  }

  try {
    const provider = getPixProvider();
    const status = await provider.getChargeStatus(payment.chargeId);
    const normalizedStatus = status.status.toUpperCase() as any;

    // Atualizar status local se mudou
    if (normalizedStatus !== payment.status) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: normalizedStatus,
          ...(status.paidAt && { paidAt: new Date(status.paidAt) }),
          ...(status.paidAmount && { amount: status.paidAmount }),
        },
      });

      // Se foi pago, atualizar pedido
      if (status.status === 'paid' && order.status !== 'PAID') {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "PAID" },
        });
      }
    }

    return NextResponse.json({
      paymentId: payment.id,
      chargeId: payment.chargeId,
      status: status.status,
      amount: payment.amount,
      paidAt: status.paidAt,
      paidAmount: status.paidAmount,
    });
  } catch (error: any) {
    console.error("Error checking PIX status:", error);
    return NextResponse.json(
      { error: { code: "PAYMENT_ERROR", message: error.message || "Failed to check PIX status" } }, 
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wacrm/db";
import { getPixProvider } from "@/lib/pix/provider";
import { createNotification } from "@/lib/notifications";

/**
 * POST: Webhook para receber notificações de pagamento PIX
 * 
 * Cada provedor tem seu próprio formato de webhook:
 * - Mercado Pago: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 * - Asaas: https://docs.asaas.com/reference/webhooks
 * - Efí: https://dev.efipay.com.br/docs/api-pix/webhooks
 * 
 * Configure a URL do webhook no painel do provedor:
 * https://seu-dominio.com/api/webhooks/pix
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("PIX Webhook received:", JSON.stringify(body, null, 2));

    // Processar webhook usando o provider configurado
    const provider = getPixProvider();
    
    if (!provider.processWebhook) {
      console.warn("Provider does not support webhook processing");
      return NextResponse.json({ received: true });
    }

    const webhookData = await provider.processWebhook(body);

    if (!webhookData) {
      console.log("Webhook ignored (not a payment event)");
      return NextResponse.json({ received: true });
    }

    console.log("Processed webhook data:", webhookData);

    // Buscar pagamento no banco
    const payment = await prisma.payment.findFirst({ 
      where: { chargeId: webhookData.chargeId },
      include: {
        order: {
          include: {
            customer: true,
            items: true,
          },
        },
      },
    });

    if (!payment) {
      console.error(`Payment not found for chargeId: ${webhookData.chargeId}`);
      return NextResponse.json({ received: true, error: "Payment not found" });
    }

    // Atualizar status do pagamento
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: webhookData.status.toUpperCase() as any,
        ...(webhookData.paidAmount && { amount: webhookData.paidAmount }),
        ...(webhookData.metadata && { 
          payload: {
            ...(payment.payload as any || {}),
            webhook: webhookData.metadata,
          },
        }),
      },
    });

    console.log(`Payment ${payment.id} updated to status: ${webhookData.status}`);

    // Se foi pago, atualizar pedido e enviar notificações
    if (webhookData.status === 'paid' && payment.order.status !== 'PAID') {
      await prisma.order.update({
        where: { id: payment.order.id },
        data: { status: "PAID" },
      });

      console.log(`Order ${payment.order.id} marked as PAID`);

      // Criar notificação para o vendedor
      const notifyUser = await prisma.user.findFirst({
        where: {
          companyId: payment.companyId,
          role: { in: ["OWNER", "ADMIN"] },
        },
        select: { id: true },
      });

      if (notifyUser) {
        await createNotification(prisma, {
          userId: notifyUser.id,
          type: "SYSTEM",
          title: "Pagamento Recebido",
          message: `Pagamento do pedido #${payment.order.id.slice(0, 8)} foi confirmado via PIX`,
          data: {
            orderId: payment.order.id,
            paymentId: payment.id,
            amount: webhookData.paidAmount || payment.amount,
            customerName: payment.order.customer?.name,
          },
          link: `/dashboard/orders/${payment.order.id}`,
        });
      }

      // TODO: Enviar mensagem de confirmação para o cliente via WhatsApp
      // if (payment.order.customer?.phone) {
      //   await sendWhatsText(
      //     payment.order.customer.phone,
      //     `✅ Seu pagamento foi confirmado!\n\nPedido: #${payment.order.id.slice(0, 8)}\nValor: R$ ${((webhookData.paidAmount || payment.amount) / 100).toFixed(2)}\n\nObrigado pela preferência!`
      //   );
      // }
    }

    // Se expirou ou foi cancelado
    if (['expired', 'cancelled'].includes(webhookData.status) && payment.order.status === 'AWAITING_PAYMENT') {
      await prisma.order.update({
        where: { id: payment.order.id },
        data: { status: "PENDING" }, // Volta para pendente
      });

      console.log(`Order ${payment.order.id} status reset to PENDING (payment ${webhookData.status})`);
    }

    return NextResponse.json({ 
      received: true,
      processed: true,
      paymentId: payment.id,
      status: webhookData.status,
    });

  } catch (error: any) {
    console.error("Error processing PIX webhook:", error);
    
    // Sempre retornar 200 para evitar reenvios do provedor
    return NextResponse.json({ 
      received: true,
      error: error.message,
    });
  }
}

/**
 * GET: Endpoint de verificação (usado por alguns provedores)
 */
export async function GET(req: NextRequest) {
  // Alguns provedores fazem uma requisição GET para verificar se o webhook está ativo
  return NextResponse.json({ 
    status: "active",
    provider: process.env.PSP_PROVIDER || 'mercadopago',
  });
}


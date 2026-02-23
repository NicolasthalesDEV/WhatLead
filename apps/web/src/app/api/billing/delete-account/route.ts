import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@wacrm/db';
import { MercadoPagoSubscriptionClient } from '@/lib/mercadopago/subscription';

/**
 * POST /api/billing/delete-account
 *
 * Cancela a assinatura e apaga TODOS os dados da empresa e usuários.
 * Irreversível.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  try {
    const company = await prisma.company.findUnique({
      where: { id: auth.companyId },
      select: { id: true, mercadopagoSubscriptionId: true },
    });

    if (!company) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
    }

    // 1. Cancelar assinatura no Mercado Pago (se existir) — silencioso em caso de erro
    if (company.mercadopagoSubscriptionId) {
      try {
        const mpClient = new MercadoPagoSubscriptionClient();
        await mpClient.cancelSubscription(company.mercadopagoSubscriptionId);
      } catch {
        // Continua a exclusão mesmo se o MP falhar
      }
    }

    // 2. Apagar todos os dados da empresa em ordem (respeitar FK)
    await prisma.$transaction(async (tx) => {
      // Mensagens WhatsApp
      await tx.whatsMessage.deleteMany({
        where: { contact: { companyId: company.id } },
      });

      // Contatos WhatsApp
      await tx.whatsContact.deleteMany({ where: { companyId: company.id } });

      // Canais WhatsApp
      await tx.whatsChannel.deleteMany({ where: { companyId: company.id } });

      // Configurações do chatbot
      await tx.chatbotSettings.deleteMany({ where: { companyId: company.id } });

      // Modelos opcionais — silenciosos se não existirem
      const optionalDeletes = [
        'chatbotFlow', 'chatbotAnalytics', 'quickResponse',
        'notification', 'auditLog', 'payment', 'product',
        'quote', 'ticket', 'contact',
      ];

      for (const model of optionalDeletes) {
        try {
          await (tx as any)[model].deleteMany({ where: { companyId: company.id } });
        } catch { /* modelo pode não existir */ }
      }

      // Sessions dos usuários da empresa
      const users = await tx.user.findMany({
        where: { companyId: company.id },
        select: { id: true },
      });
      const userIds = users.map((u) => u.id);

      if (userIds.length > 0) {
        try {
          await (tx as any).session.deleteMany({ where: { userId: { in: userIds } } });
        } catch { /* tabela session pode não existir */ }

        try {
          await (tx as any).notificationPreference.deleteMany({ where: { userId: { in: userIds } } });
        } catch { /* */ }
      }

      // Usuários
      await tx.user.deleteMany({ where: { companyId: company.id } });

      // Empresa
      await tx.company.delete({ where: { id: company.id } });
    });

    // 3. Limpar cookies de autenticação
    const response = NextResponse.json({ success: true });
    response.cookies.set('accessToken', '', { maxAge: 0, path: '/' });
    response.cookies.set('refreshToken', '', { maxAge: 0, path: '/' });

    return response;
  } catch (error: any) {
    console.error('[delete-account] error:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir conta. Tente novamente.' },
      { status: 500 }
    );
  }
}

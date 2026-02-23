import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@wacrm/db";

/**
 * GET /api/webhooks/whatsapp/debug
 *
 * Endpoint de diagnóstico — verifica se o webhook está configurado
 * corretamente sem expor credenciais.
 *
 * Retorna:
 * - status do canal (ACTIVE?)
 * - phoneNumberId salvo no BD
 * - últimas 5 mensagens recebidas
 * - variável WA_VERIFY_TOKEN configurada (booleano)
 * - hora atual do servidor
 */
export async function GET(req: NextRequest) {
  try {
    const channels = await db.whatsChannel.findMany({
      select: {
        id: true,
        phoneNumberId: true,
        displayName: true,
        status: true,
        waBusinessId: true,
        createdAt: true,
      },
    });

    const lastMessages = await db.whatsMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        direction: true,
        type: true,
        body: true,
        status: true,
        createdAt: true,
        channelId: true,
        raw: true,
        Customer: {
          select: { phoneE164: true, name: true },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      serverTime: new Date().toISOString(),
      verifyTokenSet: !!process.env.WA_VERIFY_TOKEN,
      channels,
      lastMessages,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/webhooks/whatsapp/debug
 *
 * Simula o recebimento de um payload do Meta para testar
 * o processamento sem precisar do webhook real.
 * Útil para testar localmente.
 */
export async function POST(req: NextRequest) {
  try {
    // Chave de segurança simples para não expor em produção sem proteção
    const secret = req.headers.get("x-debug-secret");
    if (secret !== (process.env.WA_VERIFY_TOKEN || "debug")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Redirecionar para o handler real do webhook
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/whatsapp`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    const result = await response.json();
    return NextResponse.json({ forwarded: true, result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }
}

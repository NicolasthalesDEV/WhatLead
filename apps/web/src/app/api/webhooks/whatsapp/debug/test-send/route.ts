import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wacrm/db";

/**
 * GET /api/webhooks/whatsapp/debug/test-send?to=+5511999999999
 *
 * Envia uma mensagem de texto de teste usando as credenciais do canal ativo
 * e retorna a resposta RAW da API da Meta (incluindo erros detalhados).
 *
 * ATENÇÃO: Endpoint temporário para diagnóstico — NÃO use em produção permanente.
 * Protegido pelo mesmo WA_VERIFY_TOKEN (header x-debug-secret).
 */
export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-debug-secret");
  const expectedToken = process.env.WA_VERIFY_TOKEN;
  if (!expectedToken || secret !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const to = new URL(req.url).searchParams.get("to");
  if (!to) {
    return NextResponse.json(
      { error: "Parâmetro 'to' obrigatório. Ex: ?to=+5511999999999" },
      { status: 400 }
    );
  }

  // Buscar primeiro canal ativo
  const channel = await prisma.whatsChannel.findFirst({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      phoneNumberId: true,
      waAccessToken: true,
      displayName: true,
      companyId: true,
    },
  });

  if (!channel) {
    return NextResponse.json({ error: "Nenhum canal WhatsApp ativo encontrado" }, { status: 404 });
  }

  const version = process.env.WA_API_VERSION || "v25.0";
  const url = `https://graph.facebook.com/${version}/${channel.phoneNumberId}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: to.startsWith("+") ? to : `+${to}`,
    type: "text",
    text: { preview_url: false, body: "🔧 Teste de envio WhatLead" },
  };

  let metaStatus = 0;
  let metaResponse: any = null;
  let fetchError: string | null = null;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${channel.waAccessToken}`,
      },
      body: JSON.stringify(payload),
    });

    metaStatus = res.status;
    metaResponse = await res.json();
  } catch (err) {
    fetchError = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json({
    channel: {
      id: channel.id,
      phoneNumberId: channel.phoneNumberId,
      displayName: channel.displayName,
      tokenPrefix: channel.waAccessToken?.substring(0, 12) + "…",
    },
    request: { url, to: payload.to, version },
    metaHttpStatus: metaStatus,
    metaResponse,
    fetchError,
    timestamp: new Date().toISOString(),
  });
}

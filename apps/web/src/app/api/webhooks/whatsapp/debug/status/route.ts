import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wacrm/db";

/**
 * GET /api/webhooks/whatsapp/debug/status
 *
 * Retorna diagnóstico completo:
 * - Últimas 10 mensagens OUT com status e erros
 * - Info do canal
 * - Verificação do token via Meta API
 */
export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-debug-secret");
  const expectedToken = process.env.WA_VERIFY_TOKEN;
  if (!expectedToken || secret !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Buscar canal
  const channel = await prisma.whatsChannel.findFirst({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      phoneNumberId: true,
      waAccessToken: true,
      displayName: true,
    },
  });

  if (!channel) {
    return NextResponse.json({ error: "Nenhum canal ativo" }, { status: 404 });
  }

  // Últimas 15 mensagens OUT com info de entrega
  const messages = await prisma.whatsMessage.findMany({
    where: { direction: "OUT" },
    orderBy: { createdAt: "desc" },
    take: 15,
    select: {
      id: true,
      type: true,
      body: true,
      status: true,
      createdAt: true,
      raw: true,
      customer: {
        select: { name: true, phoneE164: true },
      },
    },
  });

  // Verificar token via Meta
  const version = process.env.WA_API_VERSION || "v25.0";
  let tokenCheck: any = null;
  let phoneInfo: any = null;
  try {
    const tokenRes = await fetch(
      `https://graph.facebook.com/${version}/${channel.phoneNumberId}?fields=display_phone_number,verified_name,quality_rating,platform_type,throughput`,
      { headers: { Authorization: `Bearer ${channel.waAccessToken}` } }
    );
    phoneInfo = await tokenRes.json();
    tokenCheck = { httpStatus: tokenRes.status, ok: tokenRes.ok };
  } catch (e) {
    tokenCheck = { error: String(e) };
  }

  // Formatar mensagens com erro de entrega
  const formatted = messages.map((m) => {
    const raw = m.raw as any;
    return {
      id: m.id,
      to: m.customer?.phoneE164,
      customer: m.customer?.name,
      type: m.type,
      body: m.body?.substring(0, 60),
      status: m.status,
      whatsappMsgId: raw?.whatsappMessageId,
      deliveryError: raw?.deliveryError ?? null,
      sentAt: m.createdAt,
    };
  });

  return NextResponse.json({
    channel: {
      phoneNumberId: channel.phoneNumberId,
      displayName: channel.displayName,
    },
    tokenCheck,
    phoneInfo,
    recentMessages: formatted,
  });
}

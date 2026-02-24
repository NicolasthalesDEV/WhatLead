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

  const version = process.env.WA_API_VERSION || "v25.0";

  // Verificar token e info do número via Meta
  let phoneInfo: any = null;
  let tokenCheck: any = null;
  try {
    const tokenRes = await fetch(
      `https://graph.facebook.com/${version}/${channel.phoneNumberId}?fields=display_phone_number,verified_name,quality_rating,platform_type`,
      { headers: { Authorization: `Bearer ${channel.waAccessToken}` } }
    );
    phoneInfo = await tokenRes.json();
    tokenCheck = { httpStatus: tokenRes.status, ok: tokenRes.ok };
  } catch (e) {
    tokenCheck = { error: String(e) };
  }

  // Últimas 5 mensagens OUT (simples, sem join)
  const messages = await prisma.whatsMessage.findMany({
    where: { direction: "OUT" },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, type: true, status: true, createdAt: true, raw: true },
  });

  const formatted = messages.map((m) => {
    const raw = m.raw as any;
    return {
      id: m.id.substring(0, 8),
      type: m.type,
      status: m.status,
      deliveryError: raw?.deliveryError ?? null,
      sentAt: m.createdAt,
    };
  });

  return NextResponse.json({
    channel: { phoneNumberId: channel.phoneNumberId, displayName: channel.displayName },
    tokenCheck,
    phoneInfo,
    recentMessages: formatted,
  });
}

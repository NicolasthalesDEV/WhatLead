import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@wacrm/db';

/**
 * GET /api/whatsapp/media/[mediaId]
 *
 * Baixa mídia do WhatsApp e retorna como stream
 * Requer autenticação para segurança
 */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { mediaId } = await params;

    // Buscar canal WhatsApp da empresa
    const channel = await prisma.whatsChannel.findFirst({
      where: {
        companyId: user.companyId,
        status: 'ACTIVE',
      },
      select: {
        waAccessToken: true,
      },
    });

    if (!channel) {
      return NextResponse.json(
        { error: 'Canal WhatsApp não configurado' },
        { status: 400 }
      );
    }

    const version = process.env.WA_API_VERSION || 'v25.0';
    const authHeader = { Authorization: `Bearer ${channel.waAccessToken}` };

    // Buscar informações da mídia (URL e mime type)
    const mediaInfoResponse = await fetch(
      `https://graph.facebook.com/${version}/${mediaId}`,
      { headers: authHeader }
    );

    if (!mediaInfoResponse.ok) {
      const err = await mediaInfoResponse.json().catch(() => ({}));
      console.error('Media info error:', err);
      return NextResponse.json({ error: 'Erro ao obter informações da mídia' }, { status: 500 });
    }

    const mediaInfo = await mediaInfoResponse.json();

    // Baixar a mídia com o token autorizado
    const mediaResponse = await fetch(mediaInfo.url, { headers: authHeader });

    if (!mediaResponse.ok) {
      return NextResponse.json({ error: 'Erro ao baixar mídia' }, { status: 500 });
    }

    const mediaBuffer = await mediaResponse.arrayBuffer();

    return new NextResponse(Buffer.from(mediaBuffer), {
      headers: {
        'Content-Type': mediaInfo.mime_type || 'application/octet-stream',
        'Content-Length': mediaBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

  } catch (error) {
    console.error('Error downloading media:', error);
    return NextResponse.json({ error: 'Erro ao baixar mídia' }, { status: 500 });
  }
}

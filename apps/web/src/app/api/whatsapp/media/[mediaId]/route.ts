import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { downloadMedia } from '@/lib/wa/client';
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
        status: 'active',
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

    // Temporariamente definir env vars para o canal
    const originalToken = process.env.WA_ACCESS_TOKEN;
    process.env.WA_ACCESS_TOKEN = channel.waAccessToken;

    try {
      // Primeiro, buscar informações da mídia (URL e mime type)
      const mediaInfoResponse = await fetch(
        `https://graph.facebook.com/v22.0/${mediaId}`,
        {
          headers: {
            Authorization: `Bearer ${channel.waAccessToken}`,
          },
        }
      );

      if (!mediaInfoResponse.ok) {
        throw new Error('Failed to get media info');
      }

      const mediaInfo = await mediaInfoResponse.json();
      
      // Baixar a mídia
      const mediaBuffer = await downloadMedia(mediaInfo.url);

      // Retornar stream de mídia
      return new NextResponse(Buffer.from(mediaBuffer), {
        headers: {
          'Content-Type': mediaInfo.mime_type || 'application/octet-stream',
          'Content-Length': mediaBuffer.byteLength.toString(),
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    } finally {
      // Restaurar token original
      if (originalToken) process.env.WA_ACCESS_TOKEN = originalToken;
    }

  } catch (error) {
    console.error('Error downloading media:', error);

    if (error instanceof Error && 'statusCode' in error) {
      const waError = error as any;
      return NextResponse.json(
        { 
          error: 'Erro ao baixar mídia do WhatsApp',
          details: waError.message,
        },
        { status: waError.statusCode || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao baixar mídia' },
      { status: 500 }
    );
  }
}

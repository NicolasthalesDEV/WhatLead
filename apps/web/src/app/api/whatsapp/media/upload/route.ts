import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@wacrm/db';
import { verifyAuth } from '@/lib/auth';
import { buildWhatsAppClient } from '@/lib/wa/client';

/**
 * POST /api/whatsapp/media/upload
 *
 * Faz upload de arquivo de mídia DIRETAMENTE para a API da Meta (WhatsApp Cloud API).
 * Retorna o `mediaId` que pode ser usado nos envios de mensagem sem precisar de URL pública.
 * Funciona corretamente no Vercel (sem sistema de arquivos persistente).
 *
 * Body: FormData com campo 'file'
 *
 * Response:
 * {
 *   mediaId: string,  // ID da mídia na Meta — use no lugar de mediaUrl
 *   mimeType: string,
 *   size: number,
 *   fileName: string
 * }
 */

export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Arquivo não fornecido' }, { status: 400 });
    }

    // Validar tamanho (limite do WhatsApp)
    const MAX_FILE_SIZE = 16 * 1024 * 1024; // 16MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo 16MB' },
        { status: 400 }
      );
    }

    // Tipos aceitos pelo WhatsApp Cloud API
    const allowedMimeTypes = [
      'image/jpeg', 'image/png', 'image/webp',
      'video/mp4', 'video/3gpp',
      'audio/aac', 'audio/mp4', 'audio/mpeg', 'audio/amr', 'audio/ogg', 'audio/webm',
      'application/pdf',
      'application/vnd.ms-powerpoint',
      'application/msword',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
    ];

    // Aceitar mime types com parâmetros (ex: 'audio/ogg; codecs=opus')
    const baseMime = file.type.split(';')[0].trim();
    if (!allowedMimeTypes.includes(baseMime)) {
      return NextResponse.json(
        {
          error: 'Tipo de arquivo não suportado',
          supportedTypes: allowedMimeTypes,
        },
        { status: 400 }
      );
    }

    // Buscar canal WhatsApp ativo da empresa
    const channel = await prisma.whatsChannel.findFirst({
      where: { companyId: user.companyId, status: 'ACTIVE' },
      select: { phoneNumberId: true, waAccessToken: true },
    });

    if (!channel) {
      return NextResponse.json(
        { error: 'Canal WhatsApp não configurado. Adicione um canal ativo em Configurações > WhatsApp.' },
        { status: 400 }
      );
    }

    // Converter File para Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Usar mime type sem parâmetros adicionais (ex: 'audio/ogg' em vez de 'audio/ogg; codecs=opus')
    const mimeType = file.type.split(';')[0].trim();

    // Upload direto para a API da Meta (sem gravar em disco — Vercel-safe)
    const wa = buildWhatsAppClient(channel.phoneNumberId, channel.waAccessToken);
    const mediaId = await wa.uploadMedia(buffer, mimeType, file.name);

    return NextResponse.json(
      {
        mediaId,
        mimeType: file.type,
        size: file.size,
        fileName: file.name,
        originalName: file.name,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error uploading media:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao fazer upload do arquivo' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@wacrm/db';
import { verifyAuth } from '@/lib/auth';
import { sendWhatsText, sendWhatsImage, sendWhatsDocument, sendWhatsVideo } from '@/lib/wa/client';

/**
 * POST /api/whatsapp/conversations/[customerId]/messages
 * 
 * Envia uma mensagem para um cliente via WhatsApp
 * 
 * Body:
 * - type: 'text' | 'image' | 'document' | 'video' | 'audio'
 * - text: conteúdo da mensagem (obrigatório para type=text)
 * - mediaUrl: URL da mídia (obrigatório para outros types)
 * - caption: legenda para mídia (opcional)
 * - fileName: nome do arquivo (opcional, usado para documents)
 */

const sendMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('text'),
    text: z.string().min(1).max(4096),
  }),
  z.object({
    type: z.literal('image'),
    mediaUrl: z.string().url(),
    caption: z.string().max(1024).optional(),
  }),
  z.object({
    type: z.literal('document'),
    mediaUrl: z.string().url(),
    fileName: z.string().optional(),
    caption: z.string().max(1024).optional(),
  }),
  z.object({
    type: z.literal('video'),
    mediaUrl: z.string().url(),
    caption: z.string().max(1024).optional(),
  }),
  z.object({
    type: z.literal('audio'),
    mediaUrl: z.string().url(),
  }),
]);

export async function POST(
  req: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { customerId } = params;

    // Buscar cliente e validar
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        companyId: user.companyId,
      },
      select: {
        id: true,
        phoneE164: true,
        name: true,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    // Buscar canal WhatsApp da empresa
    const channel = await prisma.whatsChannel.findFirst({
      where: {
        companyId: user.companyId,
        status: 'active',
      },
      select: {
        id: true,
        phoneNumberId: true,
        waAccessToken: true,
      },
    });

    if (!channel) {
      return NextResponse.json(
        { error: 'Canal WhatsApp não configurado' },
        { status: 400 }
      );
    }

    // Parse e validar body
    const body = await req.json();
    const data = sendMessageSchema.parse(body);

    // Temporariamente definir env vars para o canal (para suportar multi-tenant)
    const originalPhoneId = process.env.WA_PHONE_NUMBER_ID;
    const originalToken = process.env.WA_ACCESS_TOKEN;
    
    process.env.WA_PHONE_NUMBER_ID = channel.phoneNumberId;
    process.env.WA_ACCESS_TOKEN = channel.waAccessToken;

    // Enviar mensagem via WhatsApp API
    let whatsappResponse: any;
    
    try {
      switch (data.type) {
        case 'text':
          whatsappResponse = await sendWhatsText(
            customer.phoneE164,
            data.text
          );
          break;

        case 'image':
          whatsappResponse = await sendWhatsImage(
            customer.phoneE164,
            data.mediaUrl,
            data.caption
          );
          break;

        case 'document':
          whatsappResponse = await sendWhatsDocument(
            customer.phoneE164,
            data.mediaUrl,
            data.fileName,
            data.caption
          );
          break;

        case 'video':
          whatsappResponse = await sendWhatsVideo(
            customer.phoneE164,
            data.mediaUrl,
            data.caption
          );
          break;

        default:
          return NextResponse.json(
            { error: 'Tipo de mensagem não suportado' },
            { status: 400 }
          );
      }
    } finally {
      // Restaurar env vars originais
      if (originalPhoneId) process.env.WA_PHONE_NUMBER_ID = originalPhoneId;
      if (originalToken) process.env.WA_ACCESS_TOKEN = originalToken;
    }

    // Extrair messageId da resposta
    const messageId = whatsappResponse.messages?.[0]?.id;

    // Salvar mensagem no banco
    const message = await prisma.whatsMessage.create({
      data: {
        companyId: user.companyId,
        customerId: customer.id,
        channelId: channel.id,
        direction: 'OUT',
        type: data.type,
        body: data.type === 'text' ? data.text : ('caption' in data ? data.caption || null : null),
        status: 'sent',
        raw: {
          whatsappMessageId: messageId,
          ...(data.type !== 'text' && {
            mediaUrl: data.mediaUrl,
            ...('fileName' in data && data.fileName && { fileName: data.fileName }),
          }),
        },
      },
      select: {
        id: true,
        direction: true,
        type: true,
        body: true,
        status: true,
        createdAt: true,
        raw: true,
      },
    });

    // Formatar resposta
    let mediaUrl: string | null = null;
    let mimeType: string | null = null;
    let fileName: string | null = null;

    if (message.raw && typeof message.raw === 'object') {
      const raw = message.raw as any;
      mediaUrl = raw.mediaUrl || null;
      mimeType = raw.mimeType || null;
      fileName = raw.fileName || null;
    }

    return NextResponse.json({
      message: {
        id: message.id,
        direction: message.direction,
        type: message.type,
        body: message.body,
        status: message.status,
        media: mediaUrl ? {
          url: mediaUrl,
          mimeType,
          fileName,
        } : null,
        timestamp: message.createdAt,
      },
      whatsappMessageId: messageId,
    }, { status: 201 });

  } catch (error) {
    console.error('Error sending message:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    // Erros da API do WhatsApp
    if (error instanceof Error && 'statusCode' in error) {
      const waError = error as any;
      return NextResponse.json(
        { 
          error: 'Erro ao enviar mensagem no WhatsApp',
          details: waError.message,
        },
        { status: waError.statusCode || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao enviar mensagem' },
      { status: 500 }
    );
  }
}

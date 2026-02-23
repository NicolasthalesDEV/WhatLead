import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@wacrm/db';
import { verifyAuth } from '@/lib/auth';
import { buildWhatsAppClient } from '@/lib/wa/client';
import crypto from 'crypto';

/**
 * POST /api/whatsapp/conversations/[customerId]/messages
 * 
 * Envia uma mensagem para um cliente via WhatsApp
 * 
 * Body:
 * - type: 'text' | 'image' | 'document' | 'video' | 'audio' | 'sticker' | 'location' | 'contact'
 * - text: conteúdo da mensagem (obrigatório para type=text)
 * - mediaUrl: URL da mídia (obrigatório para image, document, video, audio, sticker)
 * - caption: legenda para mídia (opcional)
 * - fileName: nome do arquivo (opcional, usado para documents)
 * - latitude/longitude: coordenadas (obrigatório para location)
 * - contacts: array de contatos (obrigatório para contact)
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
  z.object({
    type: z.literal('sticker'),
    mediaUrl: z.string().url(),
  }),
  z.object({
    type: z.literal('location'),
    latitude: z.number(),
    longitude: z.number(),
    name: z.string().optional(),
    address: z.string().optional(),
  }),
  z.object({
    type: z.literal('contact'),
    contacts: z.array(z.object({
      name: z.object({
        formatted_name: z.string(),
        first_name: z.string().optional(),
        last_name: z.string().optional(),
      }),
      phones: z.array(z.object({
        phone: z.string(),
        type: z.string().optional(),
        wa_id: z.string().optional(),
      })).optional(),
      emails: z.array(z.object({
        email: z.string().email(),
        type: z.string().optional(),
      })).optional(),
    })),
  }),
]);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { customerId } = await params;

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
        status: 'ACTIVE',
      },
      select: {
        id: true,
        phoneNumberId: true,
        waAccessToken: true,
      },
    });

    if (!channel) {
      return NextResponse.json(
        { error: 'Canal WhatsApp não configurado. Adicione um canal em Configurações > WhatsApp.' },
        { status: 400 }
      );
    }

    // Parse e validar body
    const body = await req.json();
    const data = sendMessageSchema.parse(body);

    // Criar cliente com credenciais do canal (multi-tenant, sem mutar process.env)
    const wa = buildWhatsAppClient(channel.phoneNumberId, channel.waAccessToken);

    // Enviar mensagem via WhatsApp API
    let whatsappResponse: any;

    switch (data.type) {
      case 'text':
        whatsappResponse = await wa.sendText(customer.phoneE164, data.text);
        break;
      case 'image':
        whatsappResponse = await wa.sendImage(customer.phoneE164, data.mediaUrl, data.caption);
        break;
      case 'document':
        whatsappResponse = await wa.sendDocument(customer.phoneE164, data.mediaUrl, data.fileName, data.caption);
        break;
      case 'video':
        whatsappResponse = await wa.sendVideo(customer.phoneE164, data.mediaUrl, data.caption);
        break;
      case 'audio':
        whatsappResponse = await wa.sendAudio(customer.phoneE164, data.mediaUrl);
        break;
      case 'sticker':
        whatsappResponse = await wa.sendSticker(customer.phoneE164, data.mediaUrl);
        break;
      case 'location':
        whatsappResponse = await wa.sendLocation(customer.phoneE164, data.latitude, data.longitude, data.name, data.address);
        break;
      case 'contact':
        whatsappResponse = await wa.sendContacts(customer.phoneE164, data.contacts);
        break;
      default:
        return NextResponse.json({ error: 'Tipo de mensagem não suportado' }, { status: 400 });
    }

    // Extrair messageId da resposta
    const messageId = whatsappResponse.messages?.[0]?.id;

    // Preparar dados específicos do tipo de mensagem
    let messageBody: string | null = null;
    let rawData: any = { whatsappMessageId: messageId };

    if (data.type === 'text') {
      messageBody = data.text;
    } else if (data.type === 'image' || data.type === 'video' || data.type === 'document') {
      messageBody = data.caption || null;
      rawData.mediaUrl = data.mediaUrl;
      if (data.type === 'document' && data.fileName) {
        rawData.fileName = data.fileName;
      }
    } else if (data.type === 'audio' || data.type === 'sticker') {
      rawData.mediaUrl = data.mediaUrl;
    } else if (data.type === 'location') {
      messageBody = data.name || null;
      rawData.latitude = data.latitude;
      rawData.longitude = data.longitude;
      if (data.address) rawData.address = data.address;
    } else if (data.type === 'contact') {
      messageBody = data.contacts[0]?.name?.formatted_name || null;
      rawData.contacts = data.contacts;
    }

    // Salvar mensagem no banco
    const message = await prisma.whatsMessage.create({
      data: {
        id: crypto.randomUUID(),
        companyId: user.companyId,
        customerId: customer.id,
        channelId: channel.id,
        direction: 'OUT',
        type: data.type,
        body: messageBody,
        status: 'sent',
        raw: rawData,
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

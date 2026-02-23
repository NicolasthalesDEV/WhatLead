import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import crypto from 'crypto';

/**
 * POST /api/whatsapp/media/upload
 * 
 * Faz upload de arquivo de mídia para enviar via WhatsApp
 * Salva o arquivo localmente ou em storage (S3, etc.) e retorna URL pública
 * 
 * Body: FormData com campo 'file'
 * 
 * Response:
 * {
 *   url: string, // URL pública do arquivo
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
      return NextResponse.json(
        { error: 'Arquivo não fornecido' },
        { status: 400 }
      );
    }

    // Validações
    const MAX_FILE_SIZE = 16 * 1024 * 1024; // 16MB (limite do WhatsApp)
    
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo 16MB' },
        { status: 400 }
      );
    }

    // Validar tipo de arquivo
    const allowedMimeTypes = [
      // Imagens
      'image/jpeg',
      'image/png',
      'image/webp',
      // Vídeos
      'video/mp4',
      'video/3gpp',
      // Áudios
      'audio/aac',
      'audio/mp4',
      'audio/mpeg',
      'audio/amr',
      'audio/ogg',
      // Documentos
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

    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { 
          error: 'Tipo de arquivo não suportado',
          supportedTypes: allowedMimeTypes,
        },
        { status: 400 }
      );
    }

    // Gerar nome único para o arquivo
    const fileExt = file.name.split('.').pop() || 'bin';
    const uniqueId = crypto.randomBytes(16).toString('hex');
    const fileName = `${uniqueId}.${fileExt}`;

    // Diretório de uploads (public/uploads)
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'whatsapp');
    
    // Criar diretório se não existir
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Salvar arquivo
    const filePath = join(uploadsDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Gerar URL pública
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
                    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);
    if (!baseUrl) throw new Error('NEXT_PUBLIC_APP_URL not configured');
    const publicUrl = `${baseUrl}/uploads/whatsapp/${fileName}`;

    return NextResponse.json({
      url: publicUrl,
      mimeType: file.type,
      size: file.size,
      fileName: file.name,
      originalName: file.name,
    }, { status: 201 });

  } catch (error) {
    console.error('Error uploading media:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer upload do arquivo' },
      { status: 500 }
    );
  }
}

/**
 * Configuração do Next.js para permitir upload de arquivos grandes
 */
export const config = {
  api: {
    bodyParser: false,
  },
};

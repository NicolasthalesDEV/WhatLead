/**
 * WhatsApp Cloud API Client
 * 
 * Documentação: https://developers.facebook.com/docs/whatsapp/cloud-api
 * 
 * Variáveis de ambiente necessárias:
 * - WA_PHONE_NUMBER_ID: ID do número de telefone do WhatsApp Business
 * - WA_ACCESS_TOKEN: Token de acesso permanente da API
 * - process.env.WA_BUSINESS_ACCOUNT_ID: ID da conta do WhatsApp Business (opcional)
 * - WA_VERIFY_TOKEN: Token para validação de webhook
 * - WA_API_VERSION: Versão da API (padrão: v22.0)
 */

const WA_API_VERSION = process.env.WA_API_VERSION || 'v22.0';




// URL base da API do WhatsApp
const WA_API_BASE_URL = `https://graph.facebook.com/${WA_API_VERSION}`;

// Tipos
export interface WhatsAppMessageResponse {
  messaging_product: 'whatsapp';
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}

export interface WhatsAppError {
  error: {
    message: string;
    type: string;
    code: number;
    error_data?: {
      details: string;
    };
    fbtrace_id: string;
  };
}

export interface WhatsAppTemplate {
  name: string;
  language: {
    code: string;
  };
  components?: Array<{
    type: 'header' | 'body' | 'button';
    parameters: Array<{
      type: 'text' | 'image' | 'document' | 'video';
      text?: string;
      image?: { link: string };
      document?: { link: string; filename?: string };
      video?: { link: string };
    }>;
  }>;
}

export interface WhatsAppMediaMessage {
  type: 'image' | 'document' | 'audio' | 'video' | 'sticker';
  url?: string;
  id?: string;
  caption?: string;
  filename?: string;
}

/**
 * Valida se as credenciais do WhatsApp estão configuradas
 */
function validateCredentials() {
  if (!process.env.WA_PHONE_NUMBER_ID || !process.env.WA_ACCESS_TOKEN) {
    throw new Error(
      'WhatsApp credentials not configured. Set WA_PHONE_NUMBER_ID and WA_ACCESS_TOKEN environment variables.'
    );
  }
}

/**
 * Normaliza número de telefone para formato E.164
 * @param phone - Número de telefone (ex: +5511999999999, 5511999999999, 11999999999)
 * @returns Número no formato E.164 sem o +
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove tudo exceto dígitos e o + inicial
  let cleaned = phone.replace(/[^\d+]/g, '');

  // Garante o + no início (Meta recomenda incluir + e código do país)
  if (!cleaned.startsWith('+')) {
    // Se começar com 55 (Brasil) e tiver 12-13 dígitos, adiciona +
    if (cleaned.startsWith('55') && cleaned.length >= 12) {
      cleaned = '+' + cleaned;
    } else if (cleaned.length === 11 || cleaned.length === 10) {
      // Sem código do país — assume Brasil
      cleaned = '+55' + cleaned;
    } else {
      cleaned = '+' + cleaned;
    }
  }

  return cleaned;
}

/**
 * Envia uma mensagem de texto simples
 * @param to - Número de telefone no formato E.164 (sem o +)
 * @param body - Texto da mensagem (máximo 4096 caracteres)
 * @param previewUrl - Se true, gera preview de links na mensagem
 */
export async function sendWhatsText(
  to: string,
  body: string,
  previewUrl: boolean = true
): Promise<WhatsAppMessageResponse> {
  validateCredentials();

  const phone = normalizePhoneNumber(to);

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: phone,
    type: 'text',
    text: {
      preview_url: previewUrl,
      body: body.substring(0, 4096), // Limite da API
    },
  };

  const response = await fetch(
    `${WA_API_BASE_URL}/${process.env.WA_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.WA_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const error = data as WhatsAppError;
    console.error('WhatsApp API Error:', error);
    throw new Error(
      `WhatsApp API Error: ${error.error.message} (${error.error.code})`
    );
  }

  return data as WhatsAppMessageResponse;
}

/**
 * Envia uma mensagem com template aprovado
 * @param to - Número de telefone no formato E.164 (sem o +)
 * @param template - Objeto com dados do template
 */
export async function sendWhatsTemplate(
  to: string,
  template: WhatsAppTemplate
): Promise<WhatsAppMessageResponse> {
  validateCredentials();

  const phone = normalizePhoneNumber(to);

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: phone,
    type: 'template',
    template,
  };

  const response = await fetch(
    `${WA_API_BASE_URL}/${process.env.WA_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.WA_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const error = data as WhatsAppError;
    console.error('WhatsApp Template Error:', error);
    throw new Error(
      `WhatsApp Template Error: ${error.error.message} (${error.error.code})`
    );
  }

  return data as WhatsAppMessageResponse;
}

/**
 * Envia uma mensagem com mídia (imagem, documento, áudio, vídeo)
 * @param to - Número de telefone no formato E.164 (sem o +)
 * @param media - Objeto com dados da mídia
 */
export async function sendWhatsMedia(
  to: string,
  media: WhatsAppMediaMessage
): Promise<WhatsAppMessageResponse> {
  validateCredentials();

  const phone = normalizePhoneNumber(to);

  const mediaPayload: any = {
    ...(media.url && { link: media.url }),
    ...(media.id && { id: media.id }),
    ...(media.caption && { caption: media.caption }),
    ...(media.filename && { filename: media.filename }),
  };

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: phone,
    type: media.type,
    [media.type]: mediaPayload,
  };

  const response = await fetch(
    `${WA_API_BASE_URL}/${process.env.WA_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.WA_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const error = data as WhatsAppError;
    console.error('WhatsApp Media Error:', error);
    throw new Error(
      `WhatsApp Media Error: ${error.error.message} (${error.error.code})`
    );
  }

  return data as WhatsAppMessageResponse;
}

/**
 * Envia uma imagem
 */
export async function sendWhatsImage(
  to: string,
  imageUrl: string,
  caption?: string
): Promise<WhatsAppMessageResponse> {
  return sendWhatsMedia(to, {
    type: 'image',
    url: imageUrl,
    caption,
  });
}

/**
 * Envia um documento (PDF, etc)
 */
export async function sendWhatsDocument(
  to: string,
  documentUrl: string,
  filename?: string,
  caption?: string
): Promise<WhatsAppMessageResponse> {
  return sendWhatsMedia(to, {
    type: 'document',
    url: documentUrl,
    filename,
    caption,
  });
}

/**
 * Envia um vídeo
 */
export async function sendWhatsVideo(
  to: string,
  videoUrl: string,
  caption?: string
): Promise<WhatsAppMessageResponse> {
  return sendWhatsMedia(to, {
    type: 'video',
    url: videoUrl,
    caption,
  });
}

/**
 * Envia um áudio
 */
export async function sendWhatsAudio(
  to: string,
  audioUrl: string
): Promise<WhatsAppMessageResponse> {
  return sendWhatsMedia(to, {
    type: 'audio',
    url: audioUrl,
  });
}

/**
 * Envia um sticker
 */
export async function sendWhatsSticker(
  to: string,
  stickerUrl: string
): Promise<WhatsAppMessageResponse> {
  return sendWhatsMedia(to, {
    type: 'sticker',
    url: stickerUrl,
  });
}

/**
 * Envia localização
 */
export async function sendWhatsLocation(
  to: string,
  latitude: number,
  longitude: number,
  name?: string,
  address?: string
): Promise<WhatsAppMessageResponse> {
  validateCredentials();

  const phone = normalizePhoneNumber(to);

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: phone,
    type: 'location',
    location: {
      latitude,
      longitude,
      ...(name && { name }),
      ...(address && { address }),
    },
  };

  const response = await fetch(
    `${WA_API_BASE_URL}/${process.env.WA_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.WA_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const error = data as WhatsAppError;
    console.error('WhatsApp Location Error:', error);
    throw new Error(
      `WhatsApp Location Error: ${error.error.message} (${error.error.code})`
    );
  }

  return data as WhatsAppMessageResponse;
}

/**
 * Envia contato
 */
export async function sendWhatsContact(
  to: string,
  contacts: Array<{
    name: { formatted_name: string; first_name?: string; last_name?: string };
    phones?: Array<{ phone: string; type?: string; wa_id?: string }>;
    emails?: Array<{ email: string; type?: string }>;
  }>
): Promise<WhatsAppMessageResponse> {
  validateCredentials();

  const phone = normalizePhoneNumber(to);

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: phone,
    type: 'contacts',
    contacts,
  };

  const response = await fetch(
    `${WA_API_BASE_URL}/${process.env.WA_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.WA_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const error = data as WhatsAppError;
    console.error('WhatsApp Contact Error:', error);
    throw new Error(
      `WhatsApp Contact Error: ${error.error.message} (${error.error.code})`
    );
  }

  return data as WhatsAppMessageResponse;
}

/**
 * Marca uma mensagem como lida
 * @param messageId - ID da mensagem recebida
 */
export async function markMessageAsRead(
  messageId: string
): Promise<{ success: boolean }> {
  validateCredentials();

  const payload = {
    messaging_product: 'whatsapp',
    status: 'read',
    message_id: messageId,
  };

  const response = await fetch(
    `${WA_API_BASE_URL}/${process.env.WA_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.WA_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const error = data as WhatsAppError;
    console.error('WhatsApp Mark Read Error:', error);
    throw new Error(
      `WhatsApp Mark Read Error: ${error.error.message} (${error.error.code})`
    );
  }

  return { success: data.success === true };
}

/**
 * Faz upload de mídia para o WhatsApp (para uso posterior com ID)
 * @param file - Buffer ou URL do arquivo
 * @param mimeType - Tipo MIME do arquivo (ex: image/jpeg, application/pdf)
 */
export async function uploadWhatsMedia(
  file: Buffer | string,
  mimeType: string
): Promise<{ id: string }> {
  validateCredentials();

  const formData = new FormData();
  formData.append('messaging_product', 'whatsapp');
  formData.append('type', mimeType);

  if (typeof file === 'string') {
    // Se for URL, faz download primeiro
    const fileResponse = await fetch(file);
    const blob = await fileResponse.blob();
    formData.append('file', blob);
  } else {
    // Se for Buffer, converte para Blob
    const blob = new Blob([new Uint8Array(file)], { type: mimeType });
    formData.append('file', blob);
  }

  const response = await fetch(
    `${WA_API_BASE_URL}/${process.env.WA_PHONE_NUMBER_ID}/media`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WA_ACCESS_TOKEN}`,
      },
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const error = data as WhatsAppError;
    console.error('WhatsApp Upload Error:', error);
    throw new Error(
      `WhatsApp Upload Error: ${error.error.message} (${error.error.code})`
    );
  }

  return { id: data.id };
}

/**
 * Obtém URL de download de uma mídia recebida
 * @param mediaId - ID da mídia recebida no webhook
 */
export async function getMediaUrl(mediaId: string): Promise<{ url: string; mime_type: string }> {
  validateCredentials();

  const response = await fetch(
    `${WA_API_BASE_URL}/${mediaId}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.WA_ACCESS_TOKEN}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const error = data as WhatsAppError;
    console.error('WhatsApp Get Media Error:', error);
    throw new Error(
      `WhatsApp Get Media Error: ${error.error.message} (${error.error.code})`
    );
  }

  return {
    url: data.url,
    mime_type: data.mime_type,
  };
}

/**
 * Faz upload de um buffer de mídia para o WhatsApp e retorna o media_id.
 * Usado para enviar áudios gerados pelo ElevenLabs TTS.
 * @param buffer  - Buffer com o conteúdo do arquivo
 * @param mimeType - MIME type (ex: "audio/mpeg", "image/jpeg")
 * @param filename - Nome do arquivo
 */
export async function uploadMedia(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<string> {
  validateCredentials();

  const formData = new FormData();
  formData.append('messaging_product', 'whatsapp');
  formData.append('type', mimeType);
  formData.append(
    'file',
    new Blob([new Uint8Array(buffer)], { type: mimeType }),
    filename
  );

  const response = await fetch(
    `${WA_API_BASE_URL}/${process.env.WA_PHONE_NUMBER_ID}/media`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WA_ACCESS_TOKEN}`,
      },
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const error = data as WhatsAppError;
    console.error('WhatsApp Upload Media Error:', error);
    throw new Error(
      `WhatsApp Upload Media Error: ${error.error.message} (${error.error.code})`
    );
  }

  return data.id as string;
}

/**
 * Gera áudio via ElevenLabs, faz upload para o WhatsApp e envia como mensagem de voz.
 * @param to       - Número do destinatário
 * @param text     - Texto a ser convertido em voz
 * @param voiceOptions - Opções do ElevenLabs (voiceId, etc.)
 */
export async function sendWhatsVoiceFromText(
  to: string,
  text: string,
  voiceOptions: { voiceId?: string } = {}
): Promise<WhatsAppMessageResponse> {
  const { generateVoiceMessage } = await import('@/lib/elevenlabs');
  const { audioBuffer, mimeType } = await generateVoiceMessage(text, voiceOptions);
  const mediaId = await uploadMedia(audioBuffer, mimeType, 'voice.mp3');
  return sendWhatsMedia(to, { type: 'audio', id: mediaId });
}

/**
 * Faz download de uma mídia recebida
 * @param mediaUrl - URL retornada por getMediaUrl()
 */
export async function downloadMedia(mediaUrl: string): Promise<ArrayBuffer> {
  validateCredentials();

  const response = await fetch(mediaUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${process.env.WA_ACCESS_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download media: ${response.statusText}`);
  }

  return response.arrayBuffer();
}

/**
 * Valida o webhook do WhatsApp (verificação inicial)
 */
export function validateWebhook(
  mode: string,
  token: string,
  challenge: string
): string | null {
  const verifyToken = process.env.WA_VERIFY_TOKEN;

  if (!verifyToken) {
    console.error('WA_VERIFY_TOKEN not configured');
    return null;
  }

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('Webhook verified successfully');
    return challenge;
  }

  console.error('Webhook verification failed');
  return null;
}

/**
 * Obtém informações do perfil do número de telefone do WhatsApp Business
 */
export async function getPhoneNumberProfile(): Promise<any> {
  validateCredentials();

  const response = await fetch(
    `${WA_API_BASE_URL}/${process.env.WA_PHONE_NUMBER_ID}?fields=verified_name,display_phone_number,quality_rating`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.WA_ACCESS_TOKEN}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const error = data as WhatsAppError;
    console.error('WhatsApp Profile Error:', error);
    throw new Error(
      `WhatsApp Profile Error: ${error.error.message} (${error.error.code})`
    );
  }

  return data;
}

// Exporta constantes para uso em outros módulos
export { WA_API_VERSION };

/**
 * Cria um cliente WhatsApp com credenciais dinâmicas (multi-tenant).
 * Não muta process.env — seguro para uso em serverless (Vercel).
 */
export function buildWhatsAppClient(phoneNumberId: string, accessToken: string) {
  const version = process.env.WA_API_VERSION || 'v22.0';
  const base = `https://graph.facebook.com/${version}`;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };

  async function callApi(payload: object): Promise<WhatsAppMessageResponse> {
    const res = await fetch(`${base}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      const err = data as WhatsAppError;
      throw new Error(`WhatsApp API Error ${err.error?.code}: ${err.error?.message}`);
    }
    return data as WhatsAppMessageResponse;
  }

  return {
    sendText(to: string, body: string) {
      const phone = normalizePhoneNumber(to);
      return callApi({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phone,
        type: 'text',
        text: { preview_url: true, body: body.substring(0, 4096) },
      });
    },

    sendImage(to: string, url: string, caption?: string) {
      const phone = normalizePhoneNumber(to);
      return callApi({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phone,
        type: 'image',
        image: { link: url, ...(caption && { caption }) },
      });
    },

    sendDocument(to: string, url: string, filename?: string, caption?: string) {
      const phone = normalizePhoneNumber(to);
      return callApi({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phone,
        type: 'document',
        document: { link: url, ...(filename && { filename }), ...(caption && { caption }) },
      });
    },

    sendVideo(to: string, url: string, caption?: string) {
      const phone = normalizePhoneNumber(to);
      return callApi({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phone,
        type: 'video',
        video: { link: url, ...(caption && { caption }) },
      });
    },

    sendAudio(to: string, url: string) {
      const phone = normalizePhoneNumber(to);
      return callApi({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phone,
        type: 'audio',
        audio: { link: url },
      });
    },

    sendSticker(to: string, url: string) {
      const phone = normalizePhoneNumber(to);
      return callApi({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phone,
        type: 'sticker',
        sticker: { link: url },
      });
    },

    sendLocation(to: string, lat: number, lon: number, name?: string, address?: string) {
      const phone = normalizePhoneNumber(to);
      return callApi({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phone,
        type: 'location',
        location: { latitude: lat, longitude: lon, ...(name && { name }), ...(address && { address }) },
      });
    },

    sendContacts(to: string, contacts: object[]) {
      const phone = normalizePhoneNumber(to);
      return callApi({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phone,
        type: 'contacts',
        contacts,
      });
    },

    markRead(waMessageId: string) {
      return fetch(`${base}/${phoneNumberId}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: waMessageId,
        }),
      }).then(r => r.json());
    },
  };
}

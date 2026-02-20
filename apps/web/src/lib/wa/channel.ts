/**
 * WhatsApp Channel Helper
 * Busca as credenciais do canal WhatsApp da empresa no banco de dados
 */

import { prisma } from "@wacrm/db";

export interface WhatsAppChannel {
  id: string;
  phoneNumberId: string;
  waAccessToken: string;
  waBusinessId: string;
  displayName: string;
  status: string;
}

/**
 * Busca o canal ativo de uma empresa
 * Retorna null se não houver canal configurado
 */
export async function getActiveChannel(companyId: string): Promise<WhatsAppChannel | null> {
  try {
    const channel = await prisma.whatsChannel.findFirst({
      where: {
        companyId,
        status: "ACTIVE",
      },
      orderBy: {
        createdAt: "desc", // Pega o mais recente
      },
    });

    return channel;
  } catch (error) {
    console.error("Error fetching active WhatsApp channel:", error);
    return null;
  }
}

/**
 * Busca credenciais do canal para uso nas APIs
 * Retorna as credenciais do banco ou fallback para .env (desenvolvimento)
 */
export async function getChannelCredentials(companyId: string): Promise<{
  phoneNumberId: string;
  accessToken: string;
  businessId: string;
} | null> {
  // Tentar buscar do banco primeiro
  const channel = await getActiveChannel(companyId);

  if (channel) {
    return {
      phoneNumberId: channel.phoneNumberId,
      accessToken: channel.waAccessToken,
      businessId: channel.waBusinessId,
    };
  }

  // Fallback para variáveis de ambiente (apenas desenvolvimento)
  if (process.env.NODE_ENV === "development" && process.env.WA_PHONE_NUMBER_ID) {
    console.warn(
      "⚠️  WhatsApp channel not configured in database. Using .env credentials (development only)"
    );
    
    return {
      phoneNumberId: process.env.WA_PHONE_NUMBER_ID!,
      accessToken: process.env.WA_ACCESS_TOKEN!,
      businessId: process.env.WA_BUSINESS_ACCOUNT_ID || "",
    };
  }

  return null;
}

/**
 * Verifica se uma empresa tem canal WhatsApp configurado
 */
export async function hasActiveChannel(companyId: string): Promise<boolean> {
  const channel = await getActiveChannel(companyId);
  return channel !== null;
}

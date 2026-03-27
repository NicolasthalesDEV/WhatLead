import { prisma } from "@wacrm/db";
import crypto from "crypto";

type NotificationType =
  | "MESSAGE_RECEIVED"
  | "CUSTOMER_CREATED"
  | "SYSTEM";

async function getUserCompanyId(db: typeof prisma, userId: string): Promise<string | null> {
  const user = await (db as any).user.findUnique({
    where: { id: userId },
    select: { companyId: true },
  });
  return user?.companyId || null;
}

type CreateNotificationParams = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  data?: any;
};

export async function createNotification(
  db: typeof prisma,
  params: CreateNotificationParams
) {
  const notificationPreference = (db as any).notificationPreference;
  const notificationModel = (db as any).notification;

  if (!notificationModel) {
    return null;
  }

  const { userId, type, title, message, link, data } = params;

  // Verificar preferências do usuário
  const preferences = notificationPreference
    ? await notificationPreference.findUnique({
        where: { userId },
      })
    : null;

  // Mapear tipo para preferência
  const preferenceKey = getPreferenceKey(type);
  
  // Se o usuário desabilitou este tipo de notificação, não criar
  if (preferences && preferenceKey && !preferences[preferenceKey as keyof typeof preferences]) {
    return null;
  }

  // Criar notificação
  const notification = await notificationModel.create({
    data: {
      id: crypto.randomUUID(),
      userId,
      companyId: (await getUserCompanyId(db, userId))!,
      type,
      title,
      message,
      link,
      data,
    },
  });

  // TODO: Enviar via outros canais (email, push) se habilitado
  if (preferences?.emailEnabled) {
    // await sendEmailNotification(notification);
  }

  if (preferences?.pushEnabled) {
    // await sendPushNotification(notification);
  }

  return notification;
}

function getPreferenceKey(type: NotificationType): string | null {
  const mapping: Record<NotificationType, string> = {
    MESSAGE_RECEIVED: "messageReceived",
    CUSTOMER_CREATED: "customerCreated",
    SYSTEM: "emailEnabled",
  };

  return mapping[type] || null;
}

// Helper para criar notificação de mensagem recebida
export async function notifyMessageReceived(
  db: typeof prisma,
  userId: string,
  customerId: string,
  customerName: string
) {
  return createNotification(db, {
    userId,
    type: "MESSAGE_RECEIVED",
    title: "Nova Mensagem",
    message: `${customerName} enviou uma mensagem`,
    link: `/dashboard/customers/${customerId}`,
    data: { customerId, customerName },
  });
}

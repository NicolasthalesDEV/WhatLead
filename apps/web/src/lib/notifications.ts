import { prisma } from "@wacrm/db";
import crypto from "crypto";

type NotificationType =
  | "ORDER_CREATED"
  | "ORDER_PAID"
  | "ORDER_CANCELLED"
  | "MESSAGE_RECEIVED"
  | "PAYMENT_RECEIVED"
  | "QUOTE_CREATED"
  | "QUOTE_ACCEPTED"
  | "CUSTOMER_CREATED"
  | "LOW_STOCK"
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
    ORDER_CREATED: "orderCreated",
    ORDER_PAID: "orderPaid",
    ORDER_CANCELLED: "orderCancelled",
    MESSAGE_RECEIVED: "messageReceived",
    PAYMENT_RECEIVED: "paymentReceived",
    QUOTE_CREATED: "quoteCreated",
    QUOTE_ACCEPTED: "quoteAccepted",
    CUSTOMER_CREATED: "customerCreated",
    LOW_STOCK: "lowStock",
    SYSTEM: "emailEnabled", // Sistema sempre usa email
  };

  return mapping[type] || null;
}

// Helper para criar notificação de pedido criado
export async function notifyOrderCreated(
  db: typeof prisma,
  userId: string,
  orderId: string,
  orderNumber: string
) {
  return createNotification(db, {
    userId,
    type: "ORDER_CREATED",
    title: "Novo Pedido Criado",
    message: `Pedido #${orderNumber} foi criado com sucesso`,
    link: `/dashboard/orders/${orderId}`,
    data: { orderId, orderNumber },
  });
}

// Helper para criar notificação de pagamento recebido
export async function notifyPaymentReceived(
  db: typeof prisma,
  userId: string,
  orderId: string,
  amount: number
) {
  return createNotification(db, {
    userId,
    type: "PAYMENT_RECEIVED",
    title: "Pagamento Recebido",
    message: `Pagamento de R$ ${amount.toFixed(2)} foi confirmado`,
    link: `/dashboard/orders/${orderId}`,
    data: { orderId, amount },
  });
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

// Helper para criar notificação de cotação criada
export async function notifyQuoteCreated(
  db: typeof prisma,
  userId: string,
  quoteId: string,
  customerName: string
) {
  return createNotification(db, {
    userId,
    type: "QUOTE_CREATED",
    title: "Nova Cotação",
    message: `Cotação para ${customerName} foi criada`,
    link: `/dashboard/quotes/${quoteId}`,
    data: { quoteId, customerName },
  });
}

// Helper para criar notificação de estoque baixo
export async function notifyLowStock(
  db: typeof prisma,
  userId: string,
  productId: string,
  productName: string,
  stock: number
) {
  return createNotification(db, {
    userId,
    type: "LOW_STOCK",
    title: "Estoque Baixo",
    message: `${productName} está com apenas ${stock} unidades`,
    link: `/dashboard/products/${productId}`,
    data: { productId, productName, stock },
  });
}

import { PrismaClient } from "@wacrm/db";
import type { NotificationType } from "@wacrm/db";

type CreateNotificationParams = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  data?: any;
};

export async function createNotification(
  db: PrismaClient,
  params: CreateNotificationParams
) {
  const { userId, type, title, message, link, data } = params;

  // Verificar preferências do usuário
  const preferences = await db.notificationPreference.findUnique({
    where: { userId },
  });

  // Mapear tipo para preferência
  const preferenceKey = getPreferenceKey(type);
  
  // Se o usuário desabilitou este tipo de notificação, não criar
  if (preferences && preferenceKey && !preferences[preferenceKey as keyof typeof preferences]) {
    return null;
  }

  // Criar notificação
  const notification = await db.notification.create({
    data: {
      userId,
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
  db: PrismaClient,
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
  db: PrismaClient,
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
  db: PrismaClient,
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
  db: PrismaClient,
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
  db: PrismaClient,
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

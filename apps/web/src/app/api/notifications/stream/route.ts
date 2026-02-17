import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma as db } from "@/../../packages/db/src/client";

// SSE endpoint para notificações em tempo real
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  const userId = authResult.userId;

  const stream = new ReadableStream({
    async start(controller) {
      // Enviar heartbeat a cada 30 segundos para manter conexão viva
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch (error) {
          clearInterval(heartbeat);
        }
      }, 30000);

      // Listener para novas notificações
      // Em produção, você usaria Redis Pub/Sub ou similar
      const checkNotifications = async () => {
        try {
          const notifications = await db.notification.findMany({
            where: {
              userId,
              isRead: false,
            },
            orderBy: { createdAt: "desc" },
            take: 10,
          });

          const unreadCount = notifications.length;

          const data = JSON.stringify({
            type: "notification_update",
            unreadCount,
            notifications: notifications.slice(0, 5), // Últimas 5
          });

          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch (error) {
          console.error("Error checking notifications:", error);
        }
      };

      // Enviar estado inicial imediatamente
      await checkNotifications();

      // Verificar a cada 5 segundos (em produção use pub/sub)
      const interval = setInterval(checkNotifications, 5000);

      // Cleanup quando a conexão for fechada
      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        clearInterval(heartbeat);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

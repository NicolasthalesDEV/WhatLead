import { useEffect, useState, useCallback } from "react";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
};

type NotificationUpdate = {
  type: "notification_update";
  unreadCount: number;
  notifications: Notification[];
};

export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestNotifications, setLatestNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let eventSource: EventSource | null = null;

    const connect = () => {
      eventSource = new EventSource("/api/notifications/stream");

      eventSource.onopen = () => {
        setIsConnected(true);
        console.log("SSE connected");
      };

      eventSource.onmessage = (event) => {
        try {
          const data: NotificationUpdate = JSON.parse(event.data);
          
          if (data.type === "notification_update") {
            setUnreadCount(data.unreadCount);
            setLatestNotifications(data.notifications);
          }
        } catch (error) {
          console.error("Error parsing SSE data:", error);
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        eventSource?.close();
        
        // Reconectar após 5 segundos
        setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      eventSource?.close();
    };
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });

      // Atualizar estado local imediatamente
      setLatestNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await fetch("/api/notifications/mark-all-read", { method: "POST" });

      setLatestNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  }, []);

  return {
    unreadCount,
    latestNotifications,
    isConnected,
    markAsRead,
    markAllAsRead,
  };
}

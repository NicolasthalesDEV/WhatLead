import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";

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

// Max consecutive errors before giving up reconnecting
const MAX_RETRIES = 5;
// Backoff delays in ms: 5s, 10s, 20s, 40s, 60s
const BACKOFF = [5_000, 10_000, 20_000, 40_000, 60_000];

export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestNotifications, setLatestNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  const retryCountRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Only connect when authenticated
    if (!user) {
      esRef.current?.close();
      esRef.current = null;
      setIsConnected(false);
      return;
    }

    // Reset retry counter when user changes (login)
    retryCountRef.current = 0;

    const connect = () => {
      // Already hit the retry limit — stop trying
      if (retryCountRef.current >= MAX_RETRIES) {
        console.warn("[SSE] Max retries reached, stopping notifications stream.");
        return;
      }

      const es = new EventSource("/api/notifications/stream");
      esRef.current = es;

      es.onopen = () => {
        retryCountRef.current = 0; // reset on successful open
        setIsConnected(true);
      };

      es.onmessage = (event) => {
        try {
          const data: NotificationUpdate = JSON.parse(event.data);
          if (data.type === "notification_update") {
            setUnreadCount(data.unreadCount);
            setLatestNotifications(data.notifications);
          }
        } catch {
          // ignore parse errors
        }
      };

      es.onerror = () => {
        setIsConnected(false);
        es.close();
        esRef.current = null;

        retryCountRef.current += 1;

        if (retryCountRef.current >= MAX_RETRIES) {
          console.warn("[SSE] Too many errors, notifications stream disabled.");
          return;
        }

        const delay = BACKOFF[Math.min(retryCountRef.current - 1, BACKOFF.length - 1)];
        timerRef.current = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      esRef.current?.close();
      esRef.current = null;
    };
  }, [user]);

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

  const clearAll = useCallback(async () => {
    try {
      await fetch("/api/notifications/clear-all", { method: "DELETE" });
      setLatestNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to clear notifications:", error);
    }
  }, []);

  return {
    unreadCount,
    latestNotifications,
    isConnected,
    markAsRead,
    markAllAsRead,
    clearAll,
  };
}

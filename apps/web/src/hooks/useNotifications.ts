import { fetchApi } from '@/lib/api';
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

const POLL_INTERVAL_MS = 30_000; // 30 seconds

export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestNotifications, setLatestNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetchApi("/api/notifications?unreadOnly=false&limit=10", {
        credentials: "include",
      });
      if (!res.ok) return; // silently ignore auth/server errors
      const data = await res.json();
      setUnreadCount(data.unreadCount ?? 0);
      setLatestNotifications((data.notifications ?? []).slice(0, 5));
      setIsConnected(true);
    } catch {
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    // Only poll when authenticated
    if (!user) {
      setIsConnected(false);
      return;
    }

    // Initial fetch
    fetchNotifications();

    // Poll every 30 seconds
    const schedule = () => {
      timerRef.current = setTimeout(async () => {
        await fetchNotifications();
        schedule();
      }, POLL_INTERVAL_MS);
    };
    schedule();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [user, fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await fetchApi(`/api/notifications/${id}`, {
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
      await fetchApi("/api/notifications/mark-all-read", { method: "POST" });

      setLatestNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  }, []);

  const clearAll = useCallback(async () => {
    try {
      await fetchApi("/api/notifications/clear-all", { method: "DELETE" });
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

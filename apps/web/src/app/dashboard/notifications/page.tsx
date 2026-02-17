"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import {
  Bell,
  CheckCircle2,
  ShoppingCart,
  CreditCard,
  MessageSquare,
  FileText,
  UserPlus,
  AlertTriangle,
  Check,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  data?: any;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
};

const getNotificationIcon = (type: string) => {
  const icons: Record<string, any> = {
    ORDER_CREATED: ShoppingCart,
    ORDER_PAID: CheckCircle2,
    ORDER_CANCELLED: AlertTriangle,
    MESSAGE_RECEIVED: MessageSquare,
    PAYMENT_RECEIVED: CreditCard,
    QUOTE_CREATED: FileText,
    QUOTE_ACCEPTED: Check,
    CUSTOMER_CREATED: UserPlus,
    LOW_STOCK: AlertTriangle,
    SYSTEM: Bell,
  };
  return icons[type] || Bell;
};

const getNotificationColor = (type: string) => {
  const colors: Record<string, string> = {
    ORDER_CREATED: "text-blue-600",
    ORDER_PAID: "text-green-600",
    ORDER_CANCELLED: "text-red-600",
    MESSAGE_RECEIVED: "text-purple-600",
    PAYMENT_RECEIVED: "text-green-600",
    QUOTE_CREATED: "text-orange-600",
    QUOTE_ACCEPTED: "text-green-600",
    CUSTOMER_CREATED: "text-blue-600",
    LOW_STOCK: "text-yellow-600",
    SYSTEM: "text-gray-600",
  };
  return colors[type] || "text-gray-600";
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter === "unread") {
        params.append("unreadOnly", "true");
      }

      const res = await fetch(`/api/notifications?${params}`);
      const data = await res.json();

      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });

      setNotifications(
        notifications.map((n) =>
          n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        )
      );
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications/mark-all-read", { method: "POST" });

      setNotifications(
        notifications.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: "DELETE" });

      const notification = notifications.find((n) => n.id === id);
      setNotifications(notifications.filter((n) => n.id !== id));

      if (notification && !notification.isRead) {
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const filteredNotifications = notifications;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Notificações
          </h1>
          <p className="text-gray-600">
            {unreadCount > 0 ? `${unreadCount} não lida(s)` : "Todas as notificações lidas"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/notifications/preferences">
            <Button variant="outline">Preferências</Button>
          </Link>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead}>Marcar todas como lidas</Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          Todas ({notifications.length})
        </Button>
        <Button
          variant={filter === "unread" ? "default" : "outline"}
          onClick={() => setFilter("unread")}
        >
          Não lidas ({unreadCount})
        </Button>
      </div>

      {/* Notifications List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Carregando...</div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredNotifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                const color = getNotificationColor(notification.type);

                return (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition ${!notification.isRead ? "bg-blue-50" : ""
                      }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-full bg-gray-100 ${color}`}>
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-sm">
                                {notification.title}
                              </h3>
                              {!notification.isRead && (
                                <Badge variant="default" className="text-xs">
                                  Nova
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDistanceToNow(new Date(notification.createdAt), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </p>
                          </div>

                          <div className="flex gap-2">
                            {notification.link && (
                              <Link href={notification.link}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsRead(notification.id)}
                                >
                                  Ver
                                </Button>
                              </Link>
                            )}
                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                                title="Marcar como lida"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNotification(notification.id)}
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

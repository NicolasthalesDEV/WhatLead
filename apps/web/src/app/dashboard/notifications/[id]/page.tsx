"use client";

import { fetchApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ShoppingCart,
  CreditCard,
  MessageSquare,
  FileText,
  UserPlus,
  AlertTriangle,
  Bell,
  Trash2,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
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
    QUOTE_ACCEPTED: CheckCircle2,
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

export default function NotificationDetailPage() {
  const router = useRouter();
  const routeParams = useParams<{ id: string }>();
  const id = routeParams?.id;
  const [notification, setNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadNotification();
  }, [id]);

  const loadNotification = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetchApi(`/api/notifications/${id}`);

      if (res.status === 404) {
        setNotFound(true);
        return;
      }

      const data = await res.json();
      setNotification(data.notification);

      // Marcar como lida automaticamente ao abrir
      if (!data.notification.isRead) {
        markAsRead();
      }
    } catch (error) {
      console.error("Failed to load notification:", error);
      setNotFound(true);
    }
    setLoading(false);
  };

  const markAsRead = async () => {
    try {
      await fetchApi(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const deleteNotification = async () => {
    if (!confirm("Tem certeza que deseja excluir esta notificação?")) return;

    try {
      await fetchApi(`/api/notifications/${id}`, { method: "DELETE" });
      router.push("/dashboard/notifications");
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">
        Carregando notificação...
      </div>
    );
  }

  if (notFound || !notification) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-semibold mb-2">Notificação não encontrada</h2>
          <p className="text-gray-600 mb-4">
            Esta notificação não existe ou foi removida.
          </p>
          <Link href="/dashboard/notifications">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para notificações
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const Icon = getNotificationIcon(notification.type);
  const color = getNotificationColor(notification.type);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/notifications">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <Button variant="destructive" onClick={deleteNotification}>
          <Trash2 className="h-4 w-4 mr-2" />
          Excluir
        </Button>
      </div>

      {/* Notification Detail */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full bg-gray-100 ${color}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle>{notification.title}</CardTitle>
                {!notification.isRead && (
                  <Badge variant="default">Nova</Badge>
                )}
              </div>
              <CardDescription className="mt-2">
                {format(new Date(notification.createdAt), "PPpp", { locale: ptBR })}
                {" · "}
                {formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Mensagem</h3>
            <p className="text-gray-700">{notification.message}</p>
          </div>

          {notification.data && Object.keys(notification.data).length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Detalhes Adicionais</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(notification.data, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {notification.link && (
            <div>
              <Link href={notification.link}>
                <Button className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ir para o destino
                </Button>
              </Link>
            </div>
          )}

          <div className="border-t pt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Tipo:</span>
                <p className="font-medium">{notification.type.replace(/_/g, " ")}</p>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                <p className="font-medium">
                  {notification.isRead ? "Lida" : "Não lida"}
                </p>
              </div>
              {notification.readAt && (
                <div className="col-span-2">
                  <span className="text-gray-500">Lida em:</span>
                  <p className="font-medium">
                    {format(new Date(notification.readAt), "PPpp", { locale: ptBR })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

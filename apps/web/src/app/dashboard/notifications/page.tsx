"use client";

import { fetchApi } from '@/lib/api';
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff, CheckCheck, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ limit: "50" });
    if (unreadOnly) params.set("unreadOnly", "true");
    const res = await fetchApi(`/api/notifications?${params}`);
    if (res.ok) {
      const data = await res.json();
      setNotifications(data.notifications ?? data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [unreadOnly]);

  async function markAllRead() {
    await fetchApi("/api/notifications/mark-all-read", { method: "POST" });
    load();
  }

  async function clearAll() {
    if (!confirm("Limpar todas as notificações?")) return;
    await fetchApi("/api/notifications/clear-all", { method: "DELETE" });
    load();
  }

  async function markRead(id: string) {
    await fetchApi(`/api/notifications/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ read: true }) });
    load();
  }

  const unread = notifications.filter(n => !n.read).length;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Notificações
            {unread > 0 && <Badge className="ml-1">{unread}</Badge>}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setUnreadOnly(v => !v)}>
            {unreadOnly ? <Bell className="w-4 h-4 mr-1" /> : <BellOff className="w-4 h-4 mr-1" />}
            {unreadOnly ? "Ver todas" : "Não lidas"}
          </Button>
          {unread > 0 && <Button variant="outline" size="sm" onClick={markAllRead}><CheckCheck className="w-4 h-4 mr-1" />Marcar todas lidas</Button>}
          {notifications.length > 0 && <Button variant="outline" size="sm" onClick={clearAll} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4 mr-1" />Limpar</Button>}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground"><Bell className="w-12 h-12 mx-auto mb-2 opacity-30" /><p>{unreadOnly ? "Nenhuma notificação não lida" : "Nenhuma notificação"}</p></div>
          ) : (
            <div className="divide-y">
              {notifications.map(n => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors cursor-pointer ${!n.read ? "bg-blue-50/50" : ""}`}
                  onClick={() => !n.read && markRead(n.id)}
                >
                  <div className={`w-2 h-2 mt-2 rounded-full shrink-0 ${n.read ? "bg-muted" : "bg-blue-500"}`} />
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm ${!n.read ? "font-semibold" : "font-medium"}`}>{n.title}</p>
                      <span className="text-xs text-muted-foreground shrink-0">{format(new Date(n.createdAt), "dd/MM HH:mm", { locale: ptBR })}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                    {n.link && <a href={n.link} className="text-xs text-primary hover:underline mt-1 block" onClick={e => e.stopPropagation()}>Ver detalhes →</a>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

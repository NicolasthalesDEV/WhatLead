"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  Loader2,
  Wifi,
  WifiOff,
  MessageSquare,
  Globe,
} from "lucide-react";

interface QueueCounts {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

interface QueuesData {
  available: boolean;
  reason?: string;
  queues?: {
    messages: QueueCounts;
    webhooks: QueueCounts;
  };
}

function StatCard({ label, value, icon: Icon, variant }: {
  label: string;
  value: number;
  icon: React.ElementType;
  variant: "default" | "success" | "warning" | "destructive";
}) {
  const colors = {
    default: "text-muted-foreground",
    success: "text-green-600",
    warning: "text-yellow-600",
    destructive: "text-destructive",
  };
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg border p-3">
      <Icon className={`h-4 w-4 ${colors[variant]}`} />
      <span className="text-2xl font-bold">{value.toLocaleString()}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function QueueSection({ name, icon: Icon, counts }: {
  name: string;
  icon: React.ElementType;
  counts: QueueCounts;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Icon className="h-4 w-4" />
          Fila: {name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-2">
          <StatCard label="Aguardando" value={counts.waiting} icon={Clock} variant="default" />
          <StatCard label="Ativo" value={counts.active} icon={Activity} variant="success" />
          <StatCard label="Atrasado" value={counts.delayed} icon={Clock} variant="warning" />
          <StatCard label="Concluído" value={counts.completed} icon={CheckCircle2} variant="success" />
          <StatCard label="Falhou" value={counts.failed} icon={AlertTriangle} variant="destructive" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminQueuesPage() {
  const [data, setData] = useState<QueuesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/queues");
      if (res.status === 403) { setForbidden(true); return; }
      const json = await res.json();
      setData(json);
      setLastRefresh(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(fetchStats, 5000);
    return () => clearInterval(id);
  }, [autoRefresh, fetchStats]);

  if (forbidden) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground">
        <ShieldCheck className="h-12 w-12" />
        <p className="text-lg font-medium">Acesso restrito</p>
        <p className="text-sm">Esta página é exclusiva para super-admins.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6" />
            Monitoramento de Filas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Status das filas BullMQ (mensagens WhatsApp e webhooks)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastRefresh && (
            <span className="text-xs text-muted-foreground">
              Atualizado às {lastRefresh.toLocaleTimeString("pt-BR")}
            </span>
          )}
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh((v) => !v)}
          >
            <Activity className="h-3.5 w-3.5 mr-1.5" />
            {autoRefresh ? "Auto ON" : "Auto OFF"}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : data?.available === false ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
            <WifiOff className="h-10 w-10" />
            <p className="font-medium">Redis não disponível</p>
            <p className="text-sm">{data.reason || "Verifique a variável REDIS_URL"}</p>
            <Badge variant="outline">Worker desativado</Badge>
          </CardContent>
        </Card>
      ) : data?.queues ? (
        <>
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-600 font-medium">Redis conectado</span>
          </div>
          <QueueSection name="messages" icon={MessageSquare} counts={data.queues.messages} />
          <QueueSection name="webhooks" icon={Globe} counts={data.queues.webhooks} />
        </>
      ) : null}
    </div>
  );
}

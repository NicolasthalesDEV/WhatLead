"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, Users, ShoppingCart, DollarSign, MessageSquare, RefreshCw } from "lucide-react";

interface OverviewMetrics {
  period: { days: number; startDate: string; endDate: string };
  aggregated: {
    totalOrders: number;
    totalRevenue: number;
    newCustomers: number;
    quotesCreated: number;
    quotesAccepted: number;
    messagesReceived: number;
    messagesSent: number;
    conversionRate: number;
  };
  totals: { customers: number; products: number };
  ordersByStatus: Array<{ status: string; _count: { id: number } }>;
}

function fmt(cents: number) {
  return ((cents ?? 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string; sub?: string; color: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReportsPage() {
  const [data, setData] = useState<OverviewMetrics | null>(null);
  const [days, setDays] = useState("30");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/reports/overview?days=${days}`);
    if (res.ok) {
      const json = await res.json();
      setData(json);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [days]);

  const agg = data?.aggregated;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground text-sm">Visão geral do desempenho do negócio</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground"><RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin opacity-50" />Carregando métricas...</div>
      ) : !agg ? (
        <div className="p-8 text-center text-muted-foreground"><BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-30" /><p>Sem dados disponíveis</p></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard icon={DollarSign} label="Receita Total" value={fmt(agg.totalRevenue)} sub={`${agg.totalOrders} pedido${agg.totalOrders !== 1 ? "s" : ""}`} color="bg-green-100 text-green-700" />
            <StatCard icon={Users} label="Novos Clientes" value={String(agg.newCustomers)} sub={`${data?.totals.customers ?? 0} total`} color="bg-blue-100 text-blue-700" />
            <StatCard icon={ShoppingCart} label="Orçamentos Criados" value={String(agg.quotesCreated)} sub={`${agg.quotesAccepted} aceitos`} color="bg-purple-100 text-purple-700" />
            <StatCard icon={MessageSquare} label="Mensagens" value={String((agg.messagesReceived ?? 0) + (agg.messagesSent ?? 0))} sub={`${agg.messagesReceived ?? 0} recebidas / ${agg.messagesSent ?? 0} enviadas`} color="bg-orange-100 text-orange-700" />
          </div>

          {data?.ordersByStatus && data.ordersByStatus.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShoppingCart className="w-4 h-4" />Pedidos por Status</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {data.ordersByStatus.map(s => (
                    <div key={s.status} className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold">{s._count.id}</p>
                      <p className="text-xs text-muted-foreground mt-1">{s.status}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4" />Taxa de Conversão</CardTitle></CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">{((agg.conversionRate ?? 0) * 100).toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground mt-1">Orçamentos convertidos em pedidos</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="w-4 h-4" />Catálogo</CardTitle></CardHeader>
              <CardContent>
                <div className="flex gap-8">
                  <div><p className="text-3xl font-bold">{data?.totals.customers ?? 0}</p><p className="text-sm text-muted-foreground">Clientes</p></div>
                  <div><p className="text-3xl font-bold">{data?.totals.products ?? 0}</p><p className="text-sm text-muted-foreground">Produtos</p></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

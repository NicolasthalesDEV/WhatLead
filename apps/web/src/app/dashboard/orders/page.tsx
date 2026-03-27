"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, ChevronLeft, ChevronRight, Package } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Order {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  customer: { id: string; name: string; phoneE164: string } | null;
  items: Array<{ id: string; qty: number; priceCents: number; product: { title: string } | null }>;
  payments: Array<{ id: string; status: string; amount: number; provider: string }>;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Aguardando", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  CONFIRMED: { label: "Confirmado", className: "bg-blue-100 text-blue-800 border-blue-200" },
  PROCESSING: { label: "Processando", className: "bg-purple-100 text-purple-800 border-purple-200" },
  SHIPPED: { label: "Enviado", className: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  DELIVERED: { label: "Entregue", className: "bg-green-100 text-green-800 border-green-200" },
  CANCELLED: { label: "Cancelado", className: "bg-red-100 text-red-800 border-red-200" },
};

function fmt(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
    const res = await fetch(`/api/orders?${params}`);
    if (res.ok) {
      const data = await res.json();
      setOrders(data.orders ?? data.data ?? []);
      setTotal(data.pagination?.total ?? data.total ?? 0);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [page, statusFilter]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pedidos</h1>
          <p className="text-muted-foreground text-sm">{total} pedido{total !== 1 ? "s" : ""}</p>
        </div>
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Todos os status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground"><ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-30" /><p>Nenhum pedido encontrado</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Pedido</th>
                    <th className="text-left p-3 font-medium">Cliente</th>
                    <th className="text-left p-3 font-medium">Itens</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-right p-3 font-medium">Total</th>
                    <th className="text-right p-3 font-medium">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => {
                    const s = STATUS_LABELS[o.status] ?? { label: o.status, className: "bg-gray-100 text-gray-800" };
                    return (
                      <tr key={o.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-mono text-xs text-muted-foreground">#{o.id.slice(-8).toUpperCase()}</td>
                        <td className="p-3 font-medium">{o.customer?.name ?? "—"}</td>
                        <td className="p-3 text-muted-foreground">
                          <div className="flex items-center gap-1"><Package className="w-3 h-3" />{o.items.length} iten{o.items.length !== 1 ? "s" : ""}</div>
                        </td>
                        <td className="p-3"><Badge className={`${s.className} text-xs font-medium border`}>{s.label}</Badge></td>
                        <td className="p-3 text-right font-semibold">{fmt(o.total)}</td>
                        <td className="p-3 text-right text-muted-foreground">{format(new Date(o.createdAt), "dd/MM/yyyy", { locale: ptBR })}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Página {page} de {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}

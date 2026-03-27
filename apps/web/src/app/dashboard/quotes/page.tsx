"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Quote {
  id: string;
  status: string;
  total: number;
  pdfUrl: string | null;
  createdAt: string;
  Customer: { id: string; name: string; phoneE164: string } | null;
  QuoteItem: Array<{ id: string; qty: number; priceCents: number; Product: { title: string } | null }>;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Rascunho", className: "bg-gray-100 text-gray-700 border-gray-200" },
  SENT: { label: "Enviado", className: "bg-blue-100 text-blue-800 border-blue-200" },
  ACCEPTED: { label: "Aceito", className: "bg-green-100 text-green-800 border-green-200" },
  REJECTED: { label: "Rejeitado", className: "bg-red-100 text-red-800 border-red-200" },
  EXPIRED: { label: "Expirado", className: "bg-orange-100 text-orange-800 border-orange-200" },
};

function fmt(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
    const res = await fetch(`/api/quotes?${params}`);
    if (res.ok) {
      const data = await res.json();
      setQuotes(data.quotes ?? []);
      setTotal(data.pagination?.total ?? 0);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [page, statusFilter]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orçamentos</h1>
          <p className="text-muted-foreground text-sm">{total} orçamento{total !== 1 ? "s" : ""}</p>
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
          ) : quotes.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground"><FileText className="w-12 h-12 mx-auto mb-2 opacity-30" /><p>Nenhum orçamento encontrado</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">ID</th>
                    <th className="text-left p-3 font-medium">Cliente</th>
                    <th className="text-left p-3 font-medium">Itens</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-right p-3 font-medium">Total</th>
                    <th className="text-right p-3 font-medium">Data</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map(q => {
                    const s = STATUS_LABELS[q.status] ?? { label: q.status, className: "bg-gray-100 text-gray-700" };
                    return (
                      <tr key={q.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-mono text-xs text-muted-foreground">#{q.id.slice(-8).toUpperCase()}</td>
                        <td className="p-3 font-medium">{q.Customer?.name ?? "—"}</td>
                        <td className="p-3 text-muted-foreground">{q.QuoteItem.length} iten{q.QuoteItem.length !== 1 ? "s" : ""}</td>
                        <td className="p-3"><Badge className={`${s.className} text-xs font-medium border`}>{s.label}</Badge></td>
                        <td className="p-3 text-right font-semibold">{fmt(q.total)}</td>
                        <td className="p-3 text-right text-muted-foreground">{format(new Date(q.createdAt), "dd/MM/yyyy", { locale: ptBR })}</td>
                        <td className="p-3 text-right">
                          {q.pdfUrl && <a href={q.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-primary text-xs hover:underline">PDF</a>}
                        </td>
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

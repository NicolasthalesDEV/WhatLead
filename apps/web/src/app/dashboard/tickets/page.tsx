"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { TicketCheck, Plus, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Ticket {
  id: string;
  subject: string;
  description: string | null;
  status: string;
  priority: string;
  category: string | null;
  createdAt: string;
  customer: { id: string; name: string } | null;
  assignedTo: { id: string; name: string } | null;
  _count: { comments: number };
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  open: { label: "Aberto", className: "bg-blue-100 text-blue-800 border-blue-200" },
  in_progress: { label: "Em andamento", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  waiting: { label: "Aguardando", className: "bg-orange-100 text-orange-800 border-orange-200" },
  resolved: { label: "Resolvido", className: "bg-green-100 text-green-800 border-green-200" },
  closed: { label: "Fechado", className: "bg-gray-100 text-gray-700 border-gray-200" },
};

const PRIORITY_MAP: Record<string, { label: string; className: string }> = {
  LOW: { label: "Baixa", className: "bg-gray-100 text-gray-600" },
  MEDIUM: { label: "Média", className: "bg-blue-100 text-blue-700" },
  HIGH: { label: "Alta", className: "bg-orange-100 text-orange-700" },
  URGENT: { label: "Urgente", className: "bg-red-100 text-red-700" },
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ subject: "", description: "", priority: "MEDIUM", category: "" });
  const [saving, setSaving] = useState(false);
  const limit = 20;

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (priorityFilter !== "all") params.set("priority", priorityFilter);
    const res = await fetch(`/api/tickets?${params}`);
    if (res.ok) {
      const data = await res.json();
      setTickets(data.tickets ?? []);
      setTotal(data.pagination?.total ?? 0);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [page, statusFilter, priorityFilter]);

  async function createTicket(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: form.subject, description: form.description, priority: form.priority, category: form.category || undefined }),
    });
    if (res.ok) {
      setShowCreate(false);
      setForm({ subject: "", description: "", priority: "MEDIUM", category: "" });
      load();
    }
    setSaving(false);
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tickets de Suporte</h1>
          <p className="text-muted-foreground text-sm">{total} ticket{total !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4 mr-2" />Novo Ticket</Button>
      </div>

      <div className="flex gap-2">
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Todos os status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={v => { setPriorityFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Prioridade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {Object.entries(PRIORITY_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : tickets.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground"><TicketCheck className="w-12 h-12 mx-auto mb-2 opacity-30" /><p>Nenhum ticket encontrado</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Assunto</th>
                    <th className="text-left p-3 font-medium">Cliente</th>
                    <th className="text-left p-3 font-medium">Responsável</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Prioridade</th>
                    <th className="text-right p-3 font-medium">Comentários</th>
                    <th className="text-right p-3 font-medium">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map(t => {
                    const s = STATUS_MAP[t.status] ?? { label: t.status, className: "bg-gray-100 text-gray-700" };
                    const p = PRIORITY_MAP[t.priority] ?? { label: t.priority, className: "bg-gray-100 text-gray-600" };
                    return (
                      <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <div>
                            <p className="font-medium">{t.subject}</p>
                            {t.category && <p className="text-xs text-muted-foreground">{t.category}</p>}
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground">{t.customer?.name ?? "—"}</td>
                        <td className="p-3 text-muted-foreground">{t.assignedTo?.name ?? "Não atribuído"}</td>
                        <td className="p-3"><Badge className={`${s.className} text-xs border`}>{s.label}</Badge></td>
                        <td className="p-3"><Badge className={`${p.className} text-xs`}>{p.label}</Badge></td>
                        <td className="p-3 text-right"><span className="flex items-center justify-end gap-1"><MessageSquare className="w-3 h-3" />{t._count.comments}</span></td>
                        <td className="p-3 text-right text-muted-foreground">{format(new Date(t.createdAt), "dd/MM/yy", { locale: ptBR })}</td>
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

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Ticket</DialogTitle></DialogHeader>
          <form onSubmit={createTicket} className="space-y-4">
            <div className="space-y-1"><Label>Assunto *</Label><Input required value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Descrição *</Label><Textarea required rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Prioridade</Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(PRIORITY_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Categoria</Label><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="suporte, vendas..." /></div>
            </div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Criar Ticket"}</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

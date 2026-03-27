"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Plus, User, Phone, Mail, Tag, ShoppingCart, FileText, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  phoneE164: string;
  email: string | null;
  tags: string[];
  createdAt: string;
  _count: { orders: number; quotes: number; messages: number };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", phoneE164: "", email: "", tags: "" });
  const [saving, setSaving] = useState(false);
  const limit = 20;

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set("search", search);
    if (tagFilter) params.set("tag", tagFilter);
    const res = await fetch(`/api/customers?${params}`);
    if (res.ok) {
      const data = await res.json();
      setCustomers(data.customers ?? data.data ?? []);
      setTotal(data.pagination?.total ?? data.total ?? 0);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [page, search, tagFilter]);

  async function createCustomer(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        phoneE164: form.phoneE164,
        email: form.email || undefined,
        tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      }),
    });
    if (res.ok) {
      setShowCreate(false);
      setForm({ name: "", phoneE164: "", email: "", tags: "" });
      load();
    }
    setSaving(false);
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-muted-foreground text-sm">{total} cliente{total !== 1 ? "s" : ""} cadastrado{total !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4 mr-2" />Novo Cliente</Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, telefone ou email..." className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Input placeholder="Filtrar por tag..." className="w-48" value={tagFilter} onChange={e => { setTagFilter(e.target.value); setPage(1); }} />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : customers.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground"><User className="w-12 h-12 mx-auto mb-2 opacity-30" /><p>Nenhum cliente encontrado</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Cliente</th>
                    <th className="text-left p-3 font-medium">Contato</th>
                    <th className="text-left p-3 font-medium">Tags</th>
                    <th className="text-right p-3 font-medium">Pedidos</th>
                    <th className="text-right p-3 font-medium">Orçamentos</th>
                    <th className="text-right p-3 font-medium">Mensagens</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map(c => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">{c.name.charAt(0).toUpperCase()}</div>
                          <span className="font-medium">{c.name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        <div className="flex flex-col gap-0.5">
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phoneE164}</span>
                          {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {c.tags.map(t => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                        </div>
                      </td>
                      <td className="p-3 text-right"><span className="flex items-center justify-end gap-1"><ShoppingCart className="w-3 h-3" />{c._count.orders}</span></td>
                      <td className="p-3 text-right"><span className="flex items-center justify-end gap-1"><FileText className="w-3 h-3" />{c._count.quotes}</span></td>
                      <td className="p-3 text-right"><span className="flex items-center justify-end gap-1"><MessageSquare className="w-3 h-3" />{c._count.messages}</span></td>
                    </tr>
                  ))}
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
          <DialogHeader><DialogTitle>Novo Cliente</DialogTitle></DialogHeader>
          <form onSubmit={createCustomer} className="space-y-4">
            <div className="space-y-1"><Label>Nome *</Label><Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Telefone (E.164) *</Label><Input required placeholder="+5511999999999" value={form.phoneE164} onChange={e => setForm(f => ({ ...f, phoneE164: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Tags (separadas por vírgula)</Label><Input placeholder="vip, ativo, lead" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} /></div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Criar Cliente"}</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Package, Plus, Search } from "lucide-react";

interface Product {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  active: boolean;
  createdAt: string;
  prices: Array<{ id: string; amount: number; currency: string }>;
  _count: { quoteItems: number; orderItems: number };
}

function fmt(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", priceAmount: "" });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/products");
    if (res.ok) {
      const data = await res.json();
      setProducts(data.products ?? data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function createProduct(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description || undefined,
        priceAmount: form.priceAmount ? parseInt(form.priceAmount) : undefined,
      }),
    });
    if (res.ok) {
      setShowCreate(false);
      setForm({ title: "", description: "", priceAmount: "" });
      load();
    }
    setSaving(false);
  }

  const filtered = products.filter(p =>
    !search || p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Produtos</h1>
          <p className="text-muted-foreground text-sm">{products.length} produto{products.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4 mr-2" />Novo Produto</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar produto..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground"><Package className="w-12 h-12 mx-auto mb-2 opacity-30" /><p>Nenhum produto encontrado</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(p => {
            const price = p.prices[0];
            return (
              <Card key={p.id} className="overflow-hidden">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.title} className="w-full h-32 object-cover" />
                ) : (
                  <div className="w-full h-32 bg-muted flex items-center justify-center"><Package className="w-8 h-8 opacity-30" /></div>
                )}
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm leading-tight">{p.title}</h3>
                    <Badge variant={p.active ? "default" : "secondary"} className="text-xs shrink-0">{p.active ? "Ativo" : "Inativo"}</Badge>
                  </div>
                  {p.description && <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{price ? fmt(price.amount) : "Sem preço"}</span>
                    <span>{p._count.orderItems} pedido{p._count.orderItems !== 1 ? "s" : ""}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Produto</DialogTitle></DialogHeader>
          <form onSubmit={createProduct} className="space-y-4">
            <div className="space-y-1"><Label>Nome *</Label><Input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Descrição</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Preço (em centavos, ex: 9990 = R$99,90)</Label><Input type="number" min="0" value={form.priceAmount} onChange={e => setForm(f => ({ ...f, priceAmount: e.target.value }))} /></div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Criar Produto"}</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

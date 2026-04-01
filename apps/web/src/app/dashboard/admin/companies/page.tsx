"use client";

import { fetchApi } from '@/lib/api';
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import {
  Building2,
  Plus,
  Search,
  Users,
  MessageSquare,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  ShieldCheck,
} from "lucide-react";

interface Company {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  plan: string;
  planStatus: string;
  planExpiresAt: string | null;
  createdAt: string;
  _count: { User: number; Customer: number; WhatsMessage: number };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  professional: "Professional",
  enterprise: "Enterprise",
};

const PLAN_STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  trial: "secondary",
  canceled: "destructive",
  expired: "outline",
};

export default function AdminCompaniesPage() {
  const { showToast } = useToast();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    companyName: "",
    slug: "",
    ownerName: "",
    ownerEmail: "",
    ownerPassword: "",
    plan: "free",
  });

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      const res = await fetchApi(`/api/admin/companies?${params}`);
      if (res.status === 403) { setForbidden(true); return; }
      const data = await res.json();
      setCompanies(data.companies ?? []);
      setPagination(data.pagination ?? null);
    } catch {
      showToast("Erro ao carregar empresas", "error");
    } finally {
      setLoading(false);
    }
  }, [page, search, showToast]);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetchApi("/api/admin/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Erro ao criar empresa", "error");
        return;
      }
      showToast("Empresa criada com sucesso!", "success");
      setShowCreate(false);
      setForm({ companyName: "", slug: "", ownerName: "", ownerEmail: "", ownerPassword: "", plan: "free" });
      fetchCompanies();
    } catch {
      showToast("Erro ao criar empresa", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleSuspend = async (id: string, name: string) => {
    if (!confirm(`Suspender a empresa "${name}"?`)) return;
    try {
      const res = await fetchApi(`/api/admin/companies/${id}`, { method: "DELETE" });
      if (!res.ok) { showToast("Erro ao suspender empresa", "error"); return; }
      showToast("Empresa suspensa", "success");
      fetchCompanies();
    } catch {
      showToast("Erro ao suspender empresa", "error");
    }
  };

  if (forbidden) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground">
        <ShieldCheck className="h-12 w-12" />
        <p className="text-lg font-medium">Acesso restrito</p>
        <p className="text-sm">Esta página é exclusiva para super-admins.</p>
        <p className="text-xs">Configure a variável de ambiente <code>SUPER_ADMIN_EMAILS</code>.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Gerenciar Empresas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {pagination ? `${pagination.total} empresa(s) cadastrada(s)` : ""}
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Empresa
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, slug ou email..."
          className="pl-9"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {/* Companies grid */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : companies.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          Nenhuma empresa encontrada.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {companies.map((c) => (
            <Card key={c.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{c.name}</CardTitle>
                  <Badge variant={PLAN_STATUS_VARIANT[c.planStatus] ?? "outline"}>
                    {c.planStatus}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">/{c.slug}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {c._count.User} usuário(s)
                  </span>
                  <span className="flex items-center gap-1">
                    <UserCheck className="h-3.5 w-3.5" />
                    {c._count.Customer} clientes
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" />
                    {c._count.WhatsMessage} msgs
                  </span>
                </div>
                {c.email && <p className="text-xs text-muted-foreground">{c.email}</p>}
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {PLAN_LABELS[c.plan] ?? c.plan}
                  </Badge>
                  <div className="flex gap-2">
                    {c.planStatus !== "canceled" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleSuspend(c.id, c.name)}
                      >
                        Suspender
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Criada em {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page} de {pagination.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === pagination.pages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Nova Empresa</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowCreate(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <Label>Nome da Empresa</Label>
                <Input
                  required
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  placeholder="Minha Empresa Ltda"
                />
              </div>
              <div className="space-y-1">
                <Label>Slug (URL)</Label>
                <Input
                  required
                  value={form.slug}
                  onChange={(e) =>
                    setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })
                  }
                  placeholder="minha-empresa"
                />
              </div>
              <div className="space-y-1">
                <Label>Nome do Responsável</Label>
                <Input
                  required
                  value={form.ownerName}
                  onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Email do Responsável</Label>
                <Input
                  required
                  type="email"
                  value={form.ownerEmail}
                  onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Senha (mínimo 8 caracteres)</Label>
                <Input
                  required
                  type="password"
                  minLength={8}
                  value={form.ownerPassword}
                  onChange={(e) => setForm({ ...form, ownerPassword: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Plano</Label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  value={form.plan}
                  onChange={(e) => setForm({ ...form, plan: e.target.value })}
                >
                  <option value="free">Free</option>
                  <option value="starter">Starter</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={creating}>
                  {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Criar Empresa
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

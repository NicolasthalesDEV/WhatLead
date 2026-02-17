"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  User,
  Clock,
  Check,
  X,
  Edit,
  Save,
  Download,
} from "lucide-react";

interface QuoteDetails {
  id: string;
  status: string;
  total: number;
  notes?: string;
  createdAt: string;
  expiresAt?: string;
  customer: {
    id: string;
    name: string;
    phoneE164: string;
    email?: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    priceCents: number;
    product: {
      id: string;
      title: string;
      description?: string;
      imageUrl?: string;
    };
  }>;
}

export default function QuoteDetailsPage() {
  const router = useRouter();
  const routeParams = useParams<{ id: string }>();
  const id = routeParams?.id;
  const [quote, setQuote] = useState<QuoteDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!id) return;
    loadQuote();
  }, [id]);

  const loadQuote = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/quotes/${id}`);
      if (res.ok) {
        const data = await res.json();
        setQuote(data.quote);
        setNotes(data.quote.notes || "");
      } else {
        router.push("/dashboard/quotes");
      }
    } catch (error) {
      console.error("Erro ao carregar orçamento:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!quote) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/quotes/${quote.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        await loadQuote();
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    } finally {
      setUpdating(false);
    }
  };

  const saveNotes = async () => {
    if (!quote) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/quotes/${quote.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });

      if (res.ok) {
        await loadQuote();
        setEditingNotes(false);
      }
    } catch (error) {
      console.error("Erro ao salvar notas:", error);
    } finally {
      setUpdating(false);
    }
  };

  const downloadPdf = async () => {
    if (!quote) return;

    try {
      const res = await fetch(`/api/quotes/${quote.id}/pdf`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `orcamento-${quote.id.slice(0, 8)}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Erro ao baixar PDF:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      PENDING: { variant: "secondary", icon: Clock, label: "Pendente" },
      SENT: { variant: "default", icon: Clock, label: "Enviado" },
      ACCEPTED: { variant: "default", icon: Check, label: "Aceito" },
      REJECTED: { variant: "destructive", icon: X, label: "Rejeitado" },
      EXPIRED: { variant: "outline", icon: X, label: "Expirado" },
    };

    const config = variants[status] || variants.PENDING;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Carregando orçamento...</p>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Orçamento não encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Orçamento #{quote.id.slice(0, 8)}</h1>
            <p className="text-muted-foreground">Criado em {formatDate(quote.createdAt)}</p>
            {quote.expiresAt && (
              <p className="text-sm text-orange-600">
                Expira em {formatDate(quote.expiresAt)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {getStatusBadge(quote.status)}
          <Button variant="outline" onClick={downloadPdf}>
            <Download className="h-4 w-4 mr-2" />
            Baixar PDF
          </Button>
          {quote.status === "PENDING" && (
            <>
              <Button
                variant="default"
                onClick={() => updateStatus("ACCEPTED")}
                disabled={updating}
              >
                <Check className="h-4 w-4 mr-2" />
                Aprovar
              </Button>
              <Button
                variant="destructive"
                onClick={() => updateStatus("REJECTED")}
                disabled={updating}
              >
                <X className="h-4 w-4 mr-2" />
                Rejeitar
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Itens do Orçamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {quote.items.map((item) => (
                <div key={item.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                  {item.product.imageUrl && (
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold">{item.product.title}</h4>
                    {item.product.description && (
                      <p className="text-sm text-muted-foreground">{item.product.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span>Qtd: {item.quantity}</span>
                      <span>Preço: {formatCurrency(item.priceCents)}</span>
                      <span className="font-semibold">
                        Subtotal: {formatCurrency(item.quantity * item.priceCents)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total</span>
                  <span className="text-2xl text-blue-600">{formatCurrency(quote.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Observações</CardTitle>
              {!editingNotes && (
                <Button variant="ghost" size="icon" onClick={() => setEditingNotes(true)}>
                  <Edit className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {editingNotes ? (
                <div className="space-y-4">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Adicione observações ao orçamento..."
                    rows={4}
                  />
                  <div className="flex gap-2">
                    <Button onClick={saveNotes} disabled={updating}>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingNotes(false);
                        setNotes(quote.notes || "");
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  {quote.notes || "Nenhuma observação adicionada"}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <Label className="text-xs text-muted-foreground">Nome</Label>
                <p className="font-semibold">{quote.customer.name}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Telefone</Label>
                <p>{quote.customer.phoneE164}</p>
              </div>
              {quote.customer.email && (
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="text-sm break-all">{quote.customer.email}</p>
                </div>
              )}
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => router.push(`/dashboard/customers/${quote.customer.id}`)}
              >
                Ver Detalhes
              </Button>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Itens</span>
                <span className="font-semibold">{quote.items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                {getStatusBadge(quote.status)}
              </div>
              <div className="flex justify-between pt-3 border-t">
                <span className="font-semibold">Total</span>
                <span className="text-lg font-bold text-blue-600">
                  {formatCurrency(quote.total)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

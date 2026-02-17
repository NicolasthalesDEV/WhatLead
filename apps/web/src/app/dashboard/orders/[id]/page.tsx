"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Package,
  User,
  DollarSign,
  Clock,
  Check,
  X,
  Edit,
  Save,
  History,
  FileText,
  Download,
} from "lucide-react";

interface OrderDetails {
  id: string;
  status: string;
  total: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    name: string;
    phoneE164: string;
    email?: string;
  };
  items: Array<{
    id: string;
    qty: number;
    priceCents: number;
    product: {
      id: string;
      title: string;
      description?: string;
      imageUrl?: string;
    };
  }>;
  payments: Array<{
    id: string;
    status: string;
    amount: number;
    provider: string;
    createdAt: string;
  }>;
  history: Array<{
    id: string;
    action: string;
    oldValue?: string;
    newValue?: string;
    description: string;
    createdAt: string;
  }>;
}

export default function OrderDetailsPage() {
  const router = useRouter();
  const routeParams = useParams<{ id: string }>();
  const id = routeParams?.id;
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!id) return;
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
        setNotes(data.order.notes || "");
      } else {
        router.push("/dashboard/orders");
      }
    } catch (error) {
      console.error("Erro ao carregar pedido:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!order) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        await loadOrder();
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    } finally {
      setUpdating(false);
    }
  };

  const saveNotes = async () => {
    if (!order) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });

      if (res.ok) {
        await loadOrder();
        setEditingNotes(false);
      }
    } catch (error) {
      console.error("Erro ao salvar notas:", error);
    } finally {
      setUpdating(false);
    }
  };

  const cancelOrder = async () => {
    if (!order || !confirm("Tem certeza que deseja cancelar este pedido?")) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await loadOrder();
      }
    } catch (error) {
      console.error("Erro ao cancelar pedido:", error);
    } finally {
      setUpdating(false);
    }
  };

  const downloadPdf = async () => {
    if (!order) return;

    try {
      const res = await fetch(`/api/orders/${order.id}/pdf`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `pedido-${order.id.slice(0, 8)}.pdf`;
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
      AWAITING_PAYMENT: { variant: "default", icon: DollarSign, label: "Aguardando Pagamento" },
      PAID: { variant: "default", icon: Check, label: "Pago" },
      CANCELED: { variant: "destructive", icon: X, label: "Cancelado" },
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
        <p className="text-muted-foreground">Carregando pedido...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Pedido não encontrado</p>
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
            <h1 className="text-3xl font-bold">Pedido #{order.id.slice(0, 8)}</h1>
            <p className="text-muted-foreground">Criado em {formatDate(order.createdAt)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {getStatusBadge(order.status)}
          <Button variant="outline" onClick={downloadPdf}>
            <Download className="h-4 w-4 mr-2" />
            Baixar PDF
          </Button>
          {order.status !== "CANCELED" && order.status !== "PAID" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={updating}>
                  <Edit className="h-4 w-4 mr-2" />
                  Alterar Status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {order.status !== "PENDING" && (
                  <DropdownMenuItem onClick={() => updateStatus("PENDING")}>
                    Marcar como Pendente
                  </DropdownMenuItem>
                )}
                {order.status !== "AWAITING_PAYMENT" && (
                  <DropdownMenuItem onClick={() => updateStatus("AWAITING_PAYMENT")}>
                    Marcar como Aguardando Pagamento
                  </DropdownMenuItem>
                )}
                {order.status !== "PAID" && (
                  <DropdownMenuItem onClick={() => updateStatus("PAID")}>
                    Marcar como Pago
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={cancelOrder} className="text-destructive">
                  Cancelar Pedido
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Itens do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items.map((item) => (
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
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.product.description}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">
                      Quantidade: {item.qty}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(item.priceCents)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(item.priceCents * item.qty)} total
                    </p>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-2xl font-bold">{formatCurrency(order.total)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payments */}
          <Card>
            <CardHeader>
              <CardTitle>Pagamentos</CardTitle>
            </CardHeader>
            <CardContent>
              {order.payments.length === 0 ? (
                <p className="text-muted-foreground">Nenhum pagamento registrado</p>
              ) : (
                <div className="space-y-3">
                  {order.payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{payment.provider}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(payment.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                        <Badge variant={payment.status === "PAID" ? "default" : "secondary"}>
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Observações</CardTitle>
                {!editingNotes && (
                  <Button variant="ghost" size="sm" onClick={() => setEditingNotes(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editingNotes ? (
                <div className="space-y-3">
                  <Textarea
                    value={notes}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                    placeholder="Adicione observações sobre o pedido..."
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
                        setNotes(order.notes || "");
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  {order.notes || "Nenhuma observação adicionada"}
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
                <p className="font-semibold">{order.customer.name}</p>
                <p className="text-sm text-muted-foreground">{order.customer.phoneE164}</p>
                {order.customer.email && (
                  <p className="text-sm text-muted-foreground">{order.customer.email}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.history.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum histórico disponível</p>
              ) : (
                <div className="space-y-4">
                  {order.history.map((entry) => (
                    <div key={entry.id} className="border-l-2 border-muted pl-4">
                      <p className="text-sm font-medium">{entry.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(entry.createdAt)}
                      </p>
                      {entry.oldValue && entry.newValue && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {entry.oldValue} → {entry.newValue}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

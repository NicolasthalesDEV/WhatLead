"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  MapPin,
  ShoppingCart,
  FileText,
  MessageSquare,
  Trash2,
  Tag,
  Clock,
  DollarSign,
  TrendingUp,
  Calendar,
  Package,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Customer {
  id: string;
  name: string;
  phoneE164: string;
  email?: string;
  tags: string[];
  notes?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  createdAt: string;
  updatedAt: string;
  orders: Array<{
    id: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    items: Array<{
      quantity: number;
      product: {
        title: string;
      };
    }>;
  }>;
  quotes: Array<{
    id: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    items: Array<{
      quantity: number;
      product: {
        title: string;
      };
    }>;
  }>;
  messages: Array<{
    id: string;
    direction: string;
    content: string;
    createdAt: string;
  }>;
  funnelCards: Array<{
    id: string;
    title: string;
    value?: number;
    createdAt: string;
    stage: {
      name: string;
    };
  }>;
  _count: {
    orders: number;
    quotes: number;
    messages: number;
  };
  metrics: {
    totalSpent: number;
    totalOrders: number;
    totalQuotes: number;
    totalMessages: number;
    firstOrderDate?: string;
    averageTicket: number;
  };
}

export default function CustomerDetailsPage() {
  const router = useRouter();
  const routeParams = useParams<{ id: string }>();
  const id = routeParams?.id;
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    if (!id) return;
    loadCustomer();
  }, [id]);

  const loadCustomer = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/customers/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCustomer(data.customer);
      } else {
        alert("Cliente não encontrado");
        router.push("/dashboard/customers");
      }
    } catch (error) {
      console.error("Erro ao carregar cliente:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteCustomer = async () => {
    if (!confirm("Tem certeza que deseja deletar este cliente?")) return;

    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/dashboard/customers");
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao deletar cliente");
      }
    } catch (error) {
      console.error("Erro ao deletar cliente:", error);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      awaiting_payment: "bg-orange-500",
      paid: "bg-green-600",
      cancelled: "bg-red-600",
      accepted: "bg-green-600",
      rejected: "bg-red-600",
    };
    return colors[status] || "bg-gray-500";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Pendente",
      awaiting_payment: "Aguardando Pgto",
      paid: "Pago",
      cancelled: "Cancelado",
      accepted: "Aceito",
      rejected: "Rejeitado",
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Carregando cliente...</p>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  // Build timeline from all activities
  const timeline = [
    ...customer.orders.map((o) => ({
      type: "order",
      id: o.id,
      date: o.createdAt,
      status: o.status,
      amount: o.totalAmount,
      items: o.items,
    })),
    ...customer.quotes.map((q) => ({
      type: "quote",
      id: q.id,
      date: q.createdAt,
      status: q.status,
      amount: q.totalAmount,
      items: q.items,
    })),
    ...customer.messages.map((m) => ({
      type: "message",
      id: m.id,
      date: m.createdAt,
      direction: m.direction,
      content: m.content,
    })),
    ...customer.funnelCards.map((f) => ({
      type: "funnel",
      id: f.id,
      date: f.createdAt,
      title: f.title,
      stage: f.stage.name,
      value: f.value,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/customers">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{customer.name}</h1>
            <p className="text-muted-foreground">Detalhes do cliente</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/customers/${customer.id}/edit`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
          <Button variant="destructive" onClick={deleteCustomer}>
            <Trash2 className="h-4 w-4 mr-2" />
            Deletar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informações de Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.phoneE164}</span>
                </div>

                {customer.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{customer.email}</span>
                  </div>
                )}

                {(customer.address || customer.city) && (
                  <div className="flex items-start gap-2 md:col-span-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="text-sm">
                      {customer.address && <p>{customer.address}</p>}
                      {customer.city && (
                        <p>
                          {customer.city}
                          {customer.state && `, ${customer.state}`}
                          {customer.zipCode && ` - ${customer.zipCode}`}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {customer.tags.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {customer.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {customer.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Notas:</p>
                  <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">
                    {customer.notes}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t text-xs text-muted-foreground">
                Cliente desde {format(new Date(customer.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline de Atividades</CardTitle>
              <CardDescription>
                Histórico completo de interações ({timeline.length} atividades)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {timeline.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhuma atividade registrada
                </p>
              ) : (
                <div className="space-y-4">
                  {timeline.slice(0, 20).map((activity, index) => (
                    <div
                      key={`${activity.type}-${activity.id}`}
                      className="flex gap-4 pb-4 border-b last:border-0"
                    >
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.type === "order"
                            ? "bg-green-100"
                            : activity.type === "quote"
                              ? "bg-blue-100"
                              : activity.type === "message"
                                ? "bg-purple-100"
                                : "bg-orange-100"
                            }`}
                        >
                          {activity.type === "order" && (
                            <ShoppingCart className="h-5 w-5 text-green-600" />
                          )}
                          {activity.type === "quote" && (
                            <FileText className="h-5 w-5 text-blue-600" />
                          )}
                          {activity.type === "message" && (
                            <MessageSquare className="h-5 w-5 text-purple-600" />
                          )}
                          {activity.type === "funnel" && (
                            <Package className="h-5 w-5 text-orange-600" />
                          )}
                        </div>
                        {index < timeline.length - 1 && (
                          <div className="w-px h-full bg-border mt-2" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <div>
                            {activity.type === "order" && (
                              <p className="font-medium">
                                Pedido #{activity.id.slice(0, 8)}
                              </p>
                            )}
                            {activity.type === "quote" && (
                              <p className="font-medium">
                                Orçamento #{activity.id.slice(0, 8)}
                              </p>
                            )}
                            {activity.type === "message" && (
                              <p className="font-medium">
                                Mensagem {"direction" in activity && activity.direction === "incoming" ? "recebida" : "enviada"}
                              </p>
                            )}
                            {activity.type === "funnel" && (
                              <p className="font-medium">Movido no funil</p>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(activity.date), "dd/MM/yyyy HH:mm", {
                              locale: ptBR,
                            })}
                          </p>
                        </div>

                        {(activity.type === "order" || activity.type === "quote") && (
                          <div>
                            <Badge className={"status" in activity ? getStatusColor(activity.status) : ""}>
                              {"status" in activity && getStatusLabel(activity.status)}
                            </Badge>
                            <p className="text-sm mt-1">
                              {"amount" in activity && formatCurrency(activity.amount)}
                            </p>
                            {"items" in activity && activity.items && activity.items.length > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {activity.items.length} {activity.items.length === 1 ? "item" : "itens"}
                              </p>
                            )}
                          </div>
                        )}

                        {activity.type === "message" && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {"content" in activity && activity.content}
                          </p>
                        )}

                        {activity.type === "funnel" && (
                          <div>
                            <p className="text-sm">{"title" in activity && activity.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {"stage" in activity && activity.stage}
                              {"value" in activity && activity.value && ` - ${formatCurrency(activity.value)}`}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {timeline.length > 20 && (
                    <p className="text-sm text-muted-foreground text-center pt-4">
                      Mostrando 20 de {timeline.length} atividades
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Métricas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm">Total Gasto</span>
                </div>
                <p className="text-2xl font-bold">
                  {formatCurrency(customer.metrics.totalSpent)}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm">Ticket Médio</span>
                </div>
                <p className="text-2xl font-bold">
                  {formatCurrency(customer.metrics.averageTicket)}
                </p>
              </div>

              {customer.metrics.firstOrderDate && (
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Primeira Compra</span>
                  </div>
                  <p className="text-sm font-medium">
                    {format(new Date(customer.metrics.firstOrderDate), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Pedidos</span>
                </div>
                <span className="font-semibold">{customer._count.orders}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Orçamentos</span>
                </div>
                <span className="font-semibold">{customer._count.quotes}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-purple-600" />
                  <span className="text-sm">Mensagens</span>
                </div>
                <span className="font-semibold">{customer._count.messages}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

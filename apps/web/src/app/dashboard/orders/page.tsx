"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Package,
  DollarSign,
  Search,
  Filter,
  Eye,
  X,
  Check,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Order {
  id: string;
  status: string;
  total: number;
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
  _count: {
    items: number;
    payments: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    loadOrders();
  }, [statusFilter, pagination.page]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (statusFilter !== "ALL") {
        params.append("status", statusFilter);
      }

      const res = await fetch(`/api/orders?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      PENDING: {
        variant: "secondary",
        icon: Clock,
        label: "Pendente",
      },
      AWAITING_PAYMENT: {
        variant: "default",
        icon: DollarSign,
        label: "Aguardando Pagamento",
      },
      PAID: {
        variant: "default",
        icon: Check,
        label: "Pago",
      },
      CANCELED: {
        variant: "destructive",
        icon: X,
        label: "Cancelado",
      },
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

  const filteredOrders = orders.filter((order) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      order.customer.name.toLowerCase().includes(search) ||
      order.id.toLowerCase().includes(search) ||
      order.customer.phoneE164.includes(search)
    );
  });

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "PENDING").length,
    awaitingPayment: orders.filter((o) => o.status === "AWAITING_PAYMENT").length,
    paid: orders.filter((o) => o.status === "PAID").length,
    canceled: orders.filter((o) => o.status === "CANCELED").length,
    totalValue: orders.reduce((sum, o) => sum + o.total, 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Carregando pedidos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reservas</h1>
        <p className="text-muted-foreground">Gerencie as reservas do seu hotel</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total de Pedidos</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pendentes</CardDescription>
            <CardTitle className="text-2xl">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Aguardando Pgto</CardDescription>
            <CardTitle className="text-2xl">{stats.awaitingPayment}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pagos</CardDescription>
            <CardTitle className="text-2xl text-green-600">{stats.paid}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Valor Total</CardDescription>
            <CardTitle className="text-2xl">{formatCurrency(stats.totalValue)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, ID ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Status: {statusFilter === "ALL" ? "Todos" : statusFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setStatusFilter("ALL")}>
              Todos
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("PENDING")}>
              Pendentes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("AWAITING_PAYMENT")}>
              Aguardando Pagamento
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("PAID")}>
              Pagos
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("CANCELED")}>
              Cancelados
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Orders List */}
      <Card>
        <CardContent className="p-0">
          {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum pedido encontrado</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{order.customer.name}</h3>
                        {getStatusBadge(order.status)}
                      </div>

                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Pedido #{order.id.slice(0, 8)}</p>
                        <p>
                          {order._count.items} {order._count.items === 1 ? "item" : "itens"} •{" "}
                          {formatDate(order.createdAt)}
                        </p>
                        {order.items.slice(0, 2).map((item) => (
                          <p key={item.id} className="text-xs">
                            {item.qty}x {item.product.title}
                          </p>
                        ))}
                        {order._count.items > 2 && (
                          <p className="text-xs">
                            +{order._count.items - 2} {order._count.items - 2 === 1 ? "item" : "itens"}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right space-y-2">
                      <p className="text-2xl font-bold">{formatCurrency(order.total)}</p>
                      <Link href={`/dashboard/orders/${order.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {pagination.page} de {pagination.pages} • {pagination.total} pedidos
          </p>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page === pagination.pages}
            >
              Próxima
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

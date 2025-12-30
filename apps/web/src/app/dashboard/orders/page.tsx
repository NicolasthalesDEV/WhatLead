import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { 
  CalendarCheck, 
  Search, 
  Plus, 
  Eye, 
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  BedDouble
} from "lucide-react";

export default function OrdersPage() {
  // Dados simulados de reservas
  const orders = [
    {
      id: "#1234",
      customer: "João Silva",
      date: "2024-01-15",
      status: "paid",
      total: "R$ 1.350,00",
      items: 3,
      paymentMethod: "PIX",
      shippingAddress: "Suíte Master - 3 noites",
      checkIn: "15/01/2024",
      checkOut: "18/01/2024"
    },
    {
      id: "#1233",
      customer: "Maria Santos",
      date: "2024-01-14",
      status: "pending",
      total: "R$ 540,00",
      items: 1,
      paymentMethod: "PIX",
      shippingAddress: "Quarto Standard - 3 noites",
      checkIn: "20/01/2024",
      checkOut: "23/01/2024"
    },
    {
      id: "#1232",
      customer: "Pedro Costa",
      date: "2024-01-14",
      status: "awaiting_payment",
      total: "R$ 960,00",
      items: 2,
      paymentMethod: "PIX",
      shippingAddress: "Suíte Premium - 3 noites",
      checkIn: "22/01/2024",
      checkOut: "25/01/2024"
    },
    {
      id: "#1231",
      customer: "Ana Silva",
      date: "2024-01-13",
      status: "canceled",
      total: "R$ 450,00",
      items: 1,
      paymentMethod: "PIX",
      shippingAddress: "Suíte Master - 1 noite",
      checkIn: "16/01/2024",
      checkOut: "17/01/2024"
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Confirmada</Badge>;
      case "pending":
        return <Badge variant="secondary">Pendente</Badge>;
      case "awaiting_payment":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Aguardando Pagamento</Badge>;
      case "canceled":
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-gray-600" />;
      case "awaiting_payment":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "canceled":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reservas</h1>
          <p className="text-muted-foreground">
            Gerencie todas as reservas do hotel
          </p>
        </div>
        <Link href="/dashboard/quick-actions/create-order">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Reserva
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Reservas</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,847</div>
            <p className="text-xs text-muted-foreground">+15% em relação ao mês anterior</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 84.290</div>
            <p className="text-xs text-muted-foreground">+22% vs mês anterior</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aguardando Confirmação</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">R$ 2.489 em valor</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Diária Média</CardTitle>
            <BedDouble className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 250</div>
            <p className="text-xs text-muted-foreground">+8% vs mês anterior</p>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Reservas</CardTitle>
          <CardDescription>Visualize e gerencie todas as reservas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar reservas..." className="pl-8" />
            </div>
            <Button variant="outline">Filtros</Button>
            <Button variant="outline">Status</Button>
            <Button variant="outline">Data</Button>
          </div>

          {/* Orders Table */}
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    {getStatusIcon(order.status)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">{order.id}</h3>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>Hóspede: <strong>{order.customer}</strong></span>
                      <span>Check-in: {order.checkIn}</span>
                      <span>Check-out: {order.checkOut}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {order.shippingAddress} • {order.paymentMethod}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <div className="text-lg font-semibold">{order.total}</div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      Ver
                    </Button>
                    <Button size="sm" variant="outline">
                      Editar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t">
            <p className="text-sm text-muted-foreground">
              Mostrando 1-4 de 2,847 reservas
            </p>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" disabled>
                Anterior
              </Button>
              <Button variant="outline" size="sm">
                Próximo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
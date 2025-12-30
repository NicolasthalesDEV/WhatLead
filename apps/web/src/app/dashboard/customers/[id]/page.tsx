"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft,
  Edit,
  MessageSquare,
  Phone,
  Mail,
  Calendar,
  MapPin,
  ShoppingBag,
  Clock,
  Eye
} from "lucide-react";

export default function CustomerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  // Dados simulados do hóspede
  const customer = {
    id: customerId,
    name: "João Silva",
    email: "joao.silva@email.com",
    phone: "(11) 99999-9999",
    status: "online",
    lastSeen: "Online",
    avatar: "JS",
    room: "Quarto 101",
    address: {
      street: "Rua das Flores, 123",
      neighborhood: "Centro",
      city: "São Paulo",
      state: "SP",
      zipCode: "01234-567"
    },
    profile: {
      totalSpent: "R$ 2.450,00",
      totalOrders: 12,
      averageTicket: "R$ 204,17",
      firstPurchase: "15/03/2024",
      lastContact: "2 dias atrás",
      segment: "VIP"
    },
    recentOrders: [
      {
        id: 1,
        date: "18/09/2024",
        total: "R$ 1.350,00",
        status: "Concluída",
        items: ["Suíte Master - 3 noites"]
      },
      {
        id: 2,
        date: "10/09/2024",
        total: "R$ 540,00",
        status: "Concluída",
        items: ["Quarto Standard - 3 noites"]
      },
      {
        id: 3,
        date: "02/09/2024",
        total: "R$ 900,00",
        status: "Concluída",
        items: ["Suíte Premium - 2 noites"]
      }
    ]
  };

  const handleEdit = () => {
    router.push(`/dashboard/customers/${customerId}/edit`);
  };

  const handleOpenChat = () => {
    router.push(`/dashboard/whatsapp?contact=${encodeURIComponent(customer.name)}`);
  };

  const handleBack = () => {
    router.push('/dashboard/customers');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Detalhes do Hóspede</h1>
            <p className="text-muted-foreground">Informações completas sobre {customer.name}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleOpenChat}>
            <MessageSquare className="h-4 w-4 mr-2" />
            WhatsApp
          </Button>
          <Button onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Informações Básicas */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-semibold text-2xl">
                    {customer.avatar}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-semibold">{customer.name}</h2>
                    <Badge variant={customer.status === 'online' ? 'default' : 'secondary'}>
                      {customer.lastSeen}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      {customer.email}
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-1" />
                      {customer.phone}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t my-4"></div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Endereço
                  </h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>{customer.address.street}</p>
                    <p>{customer.address.neighborhood}</p>
                    <p>{customer.address.city}, {customer.address.state}</p>
                    <p>CEP: {customer.address.zipCode}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Histórico
                  </h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Primeira reserva: {customer.profile.firstPurchase}</p>
                    <p>Último contato: {customer.profile.lastContact}</p>
                    <p>Segmento: {customer.profile.segment}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reservas Recentes */}
          <Card>
            <CardHeader>
              <CardTitle>Reservas Recentes</CardTitle>
              <CardDescription>Últimas estadias do hóspede</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customer.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold">Reserva #{order.id}</h4>
                        <Badge variant="outline">{order.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {order.items.join(", ")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.date}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{order.total}</p>
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Estatísticas */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Gasto</span>
                  <span className="font-semibold text-lg">{customer.profile.totalSpent}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total de Reservas</span>
                  <span className="font-semibold">{customer.profile.totalOrders}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Valor Médio</span>
                  <span className="font-semibold">{customer.profile.averageTicket}</span>
                </div>
              </div>

              <div className="border-t my-4"></div>

              <div className="space-y-4">
                <h3 className="font-semibold">Ações Rápidas</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full" onClick={handleOpenChat}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Iniciar Conversa
                  </Button>
                  <Button variant="outline" className="w-full">
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Nova Reserva
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Calendar className="h-4 w-4 mr-2" />
                    Agendar Contato
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
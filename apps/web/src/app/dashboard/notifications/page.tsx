"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Bell, 
  Search, 
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageSquare,
  ShoppingCart,
  Package,
  Users,
  Eye
} from "lucide-react";
import Link from "next/link";

export default function NotificationsPage() {
  // Dados simulados de notificações
  const notifications = [
    {
      id: "novo-pedido-1234",
      type: "order",
      title: "Novo pedido recebido",
      description: "Pedido #1234 de João Silva no valor de R$ 350,00",
      time: "2 min atrás",
      read: false,
      priority: "high",
      icon: ShoppingCart,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      id: "estoque-baixo-led20w",
      type: "inventory",
      title: "Produto com estoque baixo",
      description: "Painel LED 20W - Apenas 5 unidades restantes em estoque",
      time: "1h atrás",
      read: false,
      priority: "medium",
      icon: AlertTriangle,
      color: "text-amber-600",
      bgColor: "bg-amber-50"
    },
    {
      id: "whatsapp-maria-santos",
      type: "message",
      title: "Nova mensagem no WhatsApp",
      description: "Maria Santos: 'Gostaria de saber sobre o prazo de entrega'",
      time: "3h atrás",
      read: true,
      priority: "medium",
      icon: MessageSquare,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      id: "novo-cliente-ana",
      type: "customer",
      title: "Novo cliente cadastrado",
      description: "Ana Silva se cadastrou através do catálogo online",
      time: "5h atrás",
      read: true,
      priority: "low",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      id: "pedido-entregue-1230",
      type: "delivery",
      title: "Pedido entregue",
      description: "Pedido #1230 foi entregue com sucesso para Pedro Costa",
      time: "1 dia atrás",
      read: true,
      priority: "low",
      icon: Package,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      id: "pagamento-confirmado-1233",
      type: "payment",
      title: "Pagamento confirmado",
      description: "PIX de R$ 280,00 confirmado para o pedido #1233",
      time: "2 dias atrás",
      read: true,
      priority: "medium",
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-50"
    }
  ];

  const unreadCount = notifications.filter(n => !n.read).length;
  const todayCount = notifications.filter(n => n.time.includes('min') || n.time.includes('h')).length;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-amber-500';
      case 'low': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notificações</h1>
          <p className="text-muted-foreground">
            Central de notificações e alertas do sistema
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
          <Button>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Marcar todas como lidas
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.length}</div>
            <p className="text-xs text-muted-foreground">Todas as notificações</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Não Lidas</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{unreadCount}</div>
            <p className="text-xs text-muted-foreground">Requerem atenção</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoje</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayCount}</div>
            <p className="text-xs text-muted-foreground">Recebidas hoje</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alta Prioridade</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {notifications.filter(n => n.priority === 'high').length}
            </div>
            <p className="text-xs text-muted-foreground">Urgentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar notificações..." className="pl-8" />
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">Todas</Badge>
              <Badge variant="outline">Não lidas</Badge>
              <Badge variant="outline">Pedidos</Badge>
              <Badge variant="outline">WhatsApp</Badge>
              <Badge variant="outline">Estoque</Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>Todas as Notificações</CardTitle>
          <CardDescription>Lista completa de notificações recebidas</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-0">
            {notifications.map((notification) => {
              const IconComponent = notification.icon;
              return (
                <Link 
                  key={notification.id} 
                  href={`/dashboard/notifications/${notification.id}`}
                  className="block"
                >
                  <div className={`flex items-center p-4 hover:bg-gray-50 border-b transition-colors ${
                    !notification.read ? 'bg-blue-50/30' : ''
                  }`}>
                    <div className={`w-12 h-12 rounded-full ${notification.bgColor} flex items-center justify-center mr-4`}>
                      <IconComponent className={`h-6 w-6 ${notification.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className={`font-semibold text-sm ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {notification.title}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-muted-foreground">{notification.time}</span>
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(notification.priority)}`}></div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {notification.description}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant="outline" className="text-xs">
                          {notification.type}
                        </Badge>
                        {!notification.read && (
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                            <span className="text-xs text-blue-600 font-medium">Nova</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Mostrando {notifications.length} de {notifications.length} notificações
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" disabled>
            Anterior
          </Button>
          <Button variant="outline" size="sm" disabled>
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
}
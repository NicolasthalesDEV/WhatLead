"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageSquare,
  ShoppingCart,
  Package,
  Users,
  ExternalLink,
  Archive,
  Trash2
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useRouter } from "next/navigation";
import { use } from "react";

// Dados simulados - em produção viriam de uma API
const getNotificationData = (id: string) => {
  const notifications: { [key: string]: any } = {
    "novo-pedido-1234": {
      id: "novo-pedido-1234",
      type: "order",
      title: "Novo pedido recebido",
      description: "Pedido #1234 de João Silva no valor de R$ 350,00",
      fullContent: `
        <h3>Detalhes do Pedido</h3>
        <p><strong>Número:</strong> #1234</p>
        <p><strong>Cliente:</strong> João Silva</p>
        <p><strong>Email:</strong> joao.silva@email.com</p>
        <p><strong>Telefone:</strong> (11) 99999-9999</p>
        <p><strong>Valor Total:</strong> R$ 350,00</p>
        <p><strong>Forma de Pagamento:</strong> PIX</p>
        
        <h4>Produtos:</h4>
        <ul>
          <li>2x Painel LED 20W - R$ 125,00 cada</li>
          <li>1x Refletor 50W - R$ 100,00</li>
        </ul>
        
        <h4>Endereço de Entrega:</h4>
        <p>Rua das Flores, 123 - Centro<br>São Paulo/SP - CEP: 01234-567</p>
        
        <p><strong>Status:</strong> Aguardando confirmação</p>
      `,
      time: "2 min atrás",
      read: false,
      priority: "high",
      icon: ShoppingCart,
      color: "text-green-600",
      bgColor: "bg-green-50",
      actions: [
        { label: "Ver Pedido", link: "/dashboard/orders/1234", external: false },
        { label: "Confirmar Pedido", action: "confirm", variant: "default" }
      ]
    },
    "estoque-baixo-led20w": {
      id: "estoque-baixo-led20w",
      type: "inventory",
      title: "Produto com estoque baixo",
      description: "Painel LED 20W - Apenas 5 unidades restantes em estoque",
      fullContent: `
        <h3>Alerta de Estoque</h3>
        <p><strong>Produto:</strong> Painel LED 20W</p>
        <p><strong>SKU:</strong> LED-20W-001</p>
        <p><strong>Estoque Atual:</strong> 5 unidades</p>
        <p><strong>Estoque Mínimo:</strong> 10 unidades</p>
        <p><strong>Última Venda:</strong> Hoje às 14:30</p>
        
        <h4>Histórico de Vendas (7 dias):</h4>
        <ul>
          <li>Hoje: 3 unidades</li>
          <li>Ontem: 2 unidades</li>
          <li>Há 2 dias: 4 unidades</li>
          <li>Há 3 dias: 1 unidade</li>
        </ul>
        
        <p><strong>Fornecedor:</strong> LED Tech Ltda</p>
        <p><strong>Prazo de Reposição:</strong> 3-5 dias úteis</p>
      `,
      time: "1h atrás",
      read: false,
      priority: "medium",
      icon: AlertTriangle,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      actions: [
        { label: "Ver Produto", link: "/dashboard/products/led-20w-001", external: false },
        { label: "Solicitar Reposição", action: "restock", variant: "default" }
      ]
    },
    "whatsapp-maria-santos": {
      id: "whatsapp-maria-santos",
      type: "message",
      title: "Nova mensagem no WhatsApp",
      description: "Maria Santos: 'Gostaria de saber sobre o prazo de entrega'",
      fullContent: `
        <h3>Mensagem do WhatsApp</h3>
        <p><strong>Contato:</strong> Maria Santos</p>
        <p><strong>Telefone:</strong> (11) 98888-8888</p>
        <p><strong>Horário:</strong> Hoje às 14:25</p>
        
        <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p><strong>Maria Santos:</strong></p>
          <p>"Oi! Gostaria de saber sobre o prazo de entrega para o CEP 04567-890. Estou interessada no Painel LED 20W."</p>
        </div>
        
        <h4>Histórico de Conversas:</h4>
        <ul>
          <li>Primeiro contato: Há 2 dias</li>
          <li>Interesse demonstrado: Painel LED, Refletor 50W</li>
          <li>Status: Lead qualificado</li>
        </ul>
      `,
      time: "3h atrás",
      read: true,
      priority: "medium",
      icon: MessageSquare,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      actions: [
        { label: "Responder no WhatsApp", link: "/dashboard/whatsapp", external: false },
        { label: "Ver Conversa", action: "view_chat", variant: "outline" }
      ]
    }
  };

  return notifications[id] || null;
};

interface NotificationDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function NotificationDetailPage({ params }: NotificationDetailPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const notification = getNotificationData(resolvedParams.id);

  if (!notification) {
    notFound();
  }

  const IconComponent = notification.icon;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-amber-500';
      case 'low': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return 'Normal';
    }
  };

  const handleArchive = () => {
    console.log('Arquivando notificação:', resolvedParams.id);
    // Aqui você implementaria a lógica de arquivar
  };

  const handleDelete = () => {
    console.log('Excluindo notificação:', resolvedParams.id);
    // Aqui você implementaria a lógica de excluir
  };

  const handleMarkAsRead = () => {
    console.log('Marcando como lida:', resolvedParams.id);
    // Aqui você implementaria a lógica de marcar como lida
  };

  const handleAction = (action: string) => {
    console.log('Executando ação:', action);
    // Aqui você implementaria as ações específicas
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/notifications">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{notification.title}</h1>
            <p className="text-muted-foreground">{notification.time}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleArchive}>
            <Archive className="mr-2 h-4 w-4" />
            Arquivar
          </Button>
          <Button variant="outline" size="sm" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </Button>
          {!notification.read && (
            <Button size="sm" onClick={handleMarkAsRead}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Marcar como lida
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-full ${notification.bgColor} flex items-center justify-center`}>
                <IconComponent className={`h-6 w-6 ${notification.color}`} />
              </div>
              <div className="flex-1">
                <CardTitle className="flex items-center space-x-2">
                  <span>{notification.title}</span>
                  {!notification.read && (
                    <Badge className="bg-blue-600">Nova</Badge>
                  )}
                </CardTitle>
                <CardDescription>{notification.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: notification.fullContent }}
            />
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tipo</span>
                <Badge variant="outline">{notification.type}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Prioridade</span>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${getPriorityColor(notification.priority)}`}></div>
                  <span className="text-sm font-medium">{getPriorityText(notification.priority)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={notification.read ? "secondary" : "default"}>
                  {notification.read ? "Lida" : "Não lida"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Recebida</span>
                <span className="text-sm font-medium">{notification.time}</span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {notification.actions && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {notification.actions.map((action: any, index: number) => (
                  <div key={index}>
                    {action.link ? (
                      <Link href={action.link} className="block">
                        <Button
                          variant={action.variant || "outline"}
                          className="w-full justify-start"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          {action.label}
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        variant={action.variant || "outline"}
                        className="w-full justify-start"
                        onClick={() => handleAction(action.action)}
                      >
                        {action.label}
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Related */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Relacionados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <Link href="/dashboard/notifications" className="block text-blue-600 hover:underline">
                  Ver todas as notificações
                </Link>
                <Link href="/dashboard/notifications?type=order" className="block text-blue-600 hover:underline">
                  Outras notificações de pedidos
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
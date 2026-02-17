"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import {
  Users,
  CalendarCheck,
  BedDouble,
  MessageSquare,
  TrendingUp,
  DollarSign,
  Activity,
  Calendar,
  ChevronDown,
  Check
} from "lucide-react";

type PeriodFilter = '7d' | '30d' | '90d' | '1y';

interface PeriodOption {
  value: PeriodFilter;
  label: string;
}

interface DashboardMetrics {
  customers: {
    value: string;
    trend: string;
    description: string;
  };
  orders: {
    value: string;
    trend: string;
    description: string;
  };
  products: {
    value: string;
    trend: string;
    description: string;
  };
  messages: {
    value: string;
    trend: string;
    description: string;
  };
}

interface RecentActivity {
  id: string;
  type: 'order' | 'message' | 'payment' | 'customer';
  message: string;
  time: string;
}

const periodOptions: PeriodOption[] = [
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
  { value: '1y', label: 'Último ano' }
];

export default function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('30d');
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);

  // Carregar métricas ao montar e quando mudar o período
  useEffect(() => {
    loadMetrics();
    loadActivities();
  }, [selectedPeriod]);

  // Função para carregar métricas
  const loadMetrics = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/dashboard/metrics?period=${selectedPeriod}`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics);
      }
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para carregar atividades recentes
  const loadActivities = async () => {
    try {
      const response = await fetch('/api/dashboard/activity?limit=4');
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error('Failed to load activities:', error);
    }
  };

  // Função para mudar período
  const handlePeriodChange = (period: PeriodFilter) => {
    setSelectedPeriod(period);
  };

  // Mapear métricas para o formato de stats
  const stats = metrics ? [
    {
      title: "Total de Hóspedes",
      value: metrics.customers.value,
      description: metrics.customers.description,
      icon: Users,
      trend: metrics.customers.trend
    },
    {
      title: "Reservas",
      value: metrics.orders.value,
      description: metrics.orders.description,
      icon: CalendarCheck,
      trend: metrics.orders.trend
    },
    {
      title: "Quartos Disponíveis",
      value: metrics.products.value,
      description: metrics.products.description,
      icon: BedDouble,
      trend: metrics.products.trend
    },
    {
      title: "Mensagens WhatsApp",
      value: metrics.messages.value,
      description: metrics.messages.description,
      icon: MessageSquare,
      trend: metrics.messages.trend
    }
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral da gestão hoteleira
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              {periodOptions.find(p => p.value === selectedPeriod)?.label}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {periodOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => handlePeriodChange(option.value)}
                className={`cursor-pointer ${selectedPeriod === option.value ? "bg-accent" : ""}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span>{option.label}</span>
                  {selectedPeriod === option.value && (
                    <Check className="h-4 w-4" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Loading State */}
      {isLoading && !metrics && (
        <div className="text-center py-12">Carregando métricas...</div>
      )}

      {/* Stats Grid */}
      {!isLoading && stats.length === 0 && (
        <div className="text-center py-12">Nenhuma métrica disponível. Configure o banco de dados.</div>
      )}

      {stats.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="transition-all duration-300 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold transition-all duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
                {stat.value}
              </div>
              <p className={`text-xs text-muted-foreground transition-all duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
                {stat.description}
              </p>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className={`text-xs text-green-500 transition-all duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
                  {stat.trend}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Revenue Chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Receita</CardTitle>
            <CardDescription>
              {periodOptions.find(p => p.value === selectedPeriod)?.label}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
              <div className="text-center">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  Gráfico de receita aqui
                </p>
                <p className="text-xs text-muted-foreground">
                  (Integração com biblioteca de gráficos)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>
              Últimas ações no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma atividade recente
                </p>
              ) : (
                activities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-4">
                    <div className="p-2 bg-gray-100 rounded-full">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {activity.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Acesso rápido às principais funcionalidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Link href="/dashboard/quick-actions/new-customer">
              <Button variant="outline" className="h-24 flex-col w-full">
                <Users className="h-6 w-6 mb-2" />
                <span>Novo Hóspede</span>
              </Button>
            </Link>
            <Link href="/dashboard/quick-actions/add-product">
              <Button variant="outline" className="h-24 flex-col w-full">
                <BedDouble className="h-6 w-6 mb-2" />
                <span>Adicionar Quarto</span>
              </Button>
            </Link>
            <Link href="/dashboard/quick-actions/create-order">
              <Button variant="outline" className="h-24 flex-col w-full">
                <CalendarCheck className="h-6 w-6 mb-2" />
                <span>Nova Reserva</span>
              </Button>
            </Link>
            <Link href="/dashboard/quick-actions/send-message">
              <Button variant="outline" className="h-24 flex-col w-full">
                <MessageSquare className="h-6 w-6 mb-2" />
                <span>Enviar Mensagem</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

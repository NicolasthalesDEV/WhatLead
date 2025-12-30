"use client";

import { useState } from "react";
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

const periodOptions: PeriodOption[] = [
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
  { value: '1y', label: 'Último ano' }
];

export default function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('30d');
  const [isLoading, setIsLoading] = useState(false);

  // Função para mudar período com animação de carregamento
  const handlePeriodChange = (period: PeriodFilter) => {
    setIsLoading(true);
    setSelectedPeriod(period);

    // Simula delay de carregamento dos dados
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  };

  // Função para obter dados baseados no período selecionado
  const getStatsForPeriod = (period: PeriodFilter) => {
    const baseStats = {
      '7d': {
        customers: { value: "89", trend: "+5%", description: "+5% em relação à semana anterior" },
        orders: { value: "12", trend: "+15%", description: "3 aguardando confirmação" },
        products: { value: "157", trend: "+2%", description: "12 quartos disponíveis" },
        messages: { value: "234", trend: "+22%", description: "Últimos 7 dias" }
      },
      '30d': {
        customers: { value: "1,248", trend: "+12%", description: "+12% em relação ao mês anterior" },
        orders: { value: "89", trend: "+8%", description: "15 aguardando confirmação" },
        products: { value: "157", trend: "+2%", description: "12 quartos disponíveis" },
        messages: { value: "2,156", trend: "+15%", description: "Últimos 30 dias" }
      },
      '90d': {
        customers: { value: "3,567", trend: "+18%", description: "+18% em relação ao trimestre anterior" },
        orders: { value: "298", trend: "+25%", description: "45 aguardando confirmação" },
        products: { value: "157", trend: "+12%", description: "28 quartos disponíveis" },
        messages: { value: "8,932", trend: "+28%", description: "Últimos 90 dias" }
      },
      '1y': {
        customers: { value: "12,453", trend: "+42%", description: "+42% em relação ao ano anterior" },
        orders: { value: "1,567", trend: "+35%", description: "89 aguardando confirmação" },
        products: { value: "157", trend: "+45%", description: "67 quartos disponíveis" },
        messages: { value: "45,678", trend: "+38%", description: "Último ano" }
      }
    };

    const periodData = baseStats[period];

    return [
      {
        title: "Total de Hóspedes",
        value: periodData.customers.value,
        description: periodData.customers.description,
        icon: Users,
        trend: periodData.customers.trend
      },
      {
        title: "Reservas",
        value: periodData.orders.value,
        description: periodData.orders.description,
        icon: CalendarCheck,
        trend: periodData.orders.trend
      },
      {
        title: "Quartos Disponíveis",
        value: periodData.products.value,
        description: periodData.products.description,
        icon: BedDouble,
        trend: periodData.products.trend
      },
      {
        title: "Mensagens WhatsApp",
        value: periodData.messages.value,
        description: periodData.messages.description,
        icon: MessageSquare,
        trend: periodData.messages.trend
      }
    ];
  };

  const stats = getStatsForPeriod(selectedPeriod);

  const recentActivity = [
    { id: 1, type: "order", message: "Nova reserva #1234 recebida", time: "2 min atrás" },
    { id: 2, type: "message", message: "Mensagem de João Silva", time: "5 min atrás" },
    { id: 3, type: "payment", message: "Pagamento confirmado #1232", time: "8 min atrás" },
    { id: 4, type: "customer", message: "Novo hóspede cadastrado", time: "15 min atrás" },
  ];

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

      {/* Stats Grid */}
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
              {recentActivity.map((activity) => (
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
              ))}
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

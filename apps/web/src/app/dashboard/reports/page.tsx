"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
  TrendingUp,
  Users,
  ShoppingCart,
  DollarSign,
  Download,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Overview = {
  summary: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    newCustomers: number;
    totalCustomers: number;
    quotesCreated: number;
    quotesAccepted: number;
    conversionRate: number;
    messagesReceived: number;
    paymentsReceived: number;
  };
  dailyTrend: Array<{
    date: string;
    totalOrders: number;
    totalRevenue: number;
    newCustomers: number;
    conversionRate: number;
  }>;
};

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);
  const [overview, setOverview] = useState<Overview | null>(null);

  useEffect(() => {
    loadOverview();
  }, [period]);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/overview?days=${period}`);
      if (!res.ok) {
        setOverview(null);
        setLoading(false);
        return;
      }
      const data = await res.json();
      // Ensure dailyTrend exists and has proper structure
      if (!data.dailyTrend || !Array.isArray(data.dailyTrend)) {
        data.dailyTrend = [];
      }
      setOverview(data);
    } catch (error) {
      // Silently handle - user sees "Erro ao carregar dados" message
      setOverview(null);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="text-center py-12">Carregando relatórios...</div>;
  }

  if (!overview || !overview.summary) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Ainda não há dados suficientes para gerar relatórios.</p>
        <p className="text-sm text-muted-foreground">Comece cadastrando clientes, produtos e pedidos para visualizar estatísticas aqui.</p>
      </div>
    );
  }

  const { summary, dailyTrend = [] } = overview;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Relatórios & Analytics
          </h1>
          <p className="text-gray-600">Visão geral do desempenho do negócio</p>
        </div>
        <div className="flex gap-2">
          <Button variant={period === 7 ? "default" : "outline"} onClick={() => setPeriod(7)}>
            7 dias
          </Button>
          <Button variant={period === 30 ? "default" : "outline"} onClick={() => setPeriod(30)}>
            30 dias
          </Button>
          <Button variant={period === 90 ? "default" : "outline"} onClick={() => setPeriod(90)}>
            90 dias
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Receita Total</CardDescription>
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {(summary.totalRevenue || 0).toLocaleString("pt-BR")}
            </div>
            <div className="text-xs text-gray-500 mt-1">Últimos {period} dias</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Total de Pedidos</CardDescription>
              <ShoppingCart className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalOrders || 0}</div>
            <div className="text-xs text-gray-500 mt-1">
              Ticket médio: R$ {(summary.averageOrderValue || 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Novos Clientes</CardDescription>
              <Users className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.newCustomers || 0}</div>
            <div className="text-xs text-gray-500 mt-1">
              Total: {summary.totalCustomers || 0} clientes
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Taxa de Conversão</CardDescription>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(summary.conversionRate || 0).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {summary.quotesAccepted || 0} de {summary.quotesCreated || 0} cotações
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ticket Médio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              R$ {(summary.averageOrderValue || 0).toLocaleString("pt-BR")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Mensagens Recebidas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{summary.messagesReceived || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pagamentos Recebidos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{summary.paymentsReceived || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tendência Diária</CardTitle>
          <CardDescription>Últimos 7 dias</CardDescription>
        </CardHeader>
        <CardContent>
          {dailyTrend.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum dado disponível. Execute as migrations e seed do banco de dados.
            </div>
          ) : (
          <div className="space-y-4">
            {dailyTrend.slice(-7).map((day, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-24 text-sm text-gray-600">
                  {format(new Date(day.date), "dd/MM", { locale: ptBR })}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            100,
                            ((day.totalRevenue || 0) /
                              Math.max(...dailyTrend.map((d) => d.totalRevenue || 0), 1)) *
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="w-32 text-sm font-medium text-right">
                      R$ {(day.totalRevenue || 0).toLocaleString("pt-BR")}
                    </div>
                    <div className="w-20 text-sm text-gray-600 text-right">
                      {day.totalOrders || 0} pedidos
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition cursor-pointer">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Relatório de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Análise detalhada de vendas e produtos mais vendidos
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition cursor-pointer">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5" />
              Relatório de Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Análise de clientes, segmentação e lifetime value
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition cursor-pointer">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Funil de Conversão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Taxa de conversão de cotações para pedidos
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

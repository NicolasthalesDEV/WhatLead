"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from "lucide-react";
import Link from "next/link";

type Analytics = {
  summary: {
    totalExecutions: number;
    completedExecutions: number;
    failedExecutions: number;
    avgDuration: number;
  };
  byFlow: Array<{
    flowId: string;
    flowName: string;
    totalExecutions: number;
    completedExecutions: number;
    failedExecutions: number;
    avgDuration: number;
  }>;
};

export default function ChatbotAnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(7); // dias

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/chatbot/analytics?days=${period}`);
      const data = await res.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="text-center py-12">Carregando analytics...</div>;
  }

  if (!analytics) {
    return <div className="text-center py-12">Nenhum dado disponível</div>;
  }

  const completionRate =
    analytics.summary.totalExecutions > 0
      ? (analytics.summary.completedExecutions / analytics.summary.totalExecutions) * 100
      : 0;

  const failureRate =
    analytics.summary.totalExecutions > 0
      ? (analytics.summary.failedExecutions / analytics.summary.totalExecutions) * 100
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/chatbot">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Analytics do Chatbot</h1>
              <p className="text-gray-600">Análise de desempenho dos fluxos</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={period === 7 ? "default" : "outline"}
            onClick={() => setPeriod(7)}
          >
            7 dias
          </Button>
          <Button
            variant={period === 30 ? "default" : "outline"}
            onClick={() => setPeriod(30)}
          >
            30 dias
          </Button>
          <Button
            variant={period === 90 ? "default" : "outline"}
            onClick={() => setPeriod(90)}
          >
            90 dias
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Execuções</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.summary.totalExecutions}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Últimos {period} dias
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Taxa de Conclusão</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {completionRate.toFixed(1)}%
            </div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              {analytics.summary.completedExecutions} concluídas
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Taxa de Falha</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {failureRate.toFixed(1)}%
            </div>
            <div className="flex items-center text-xs text-red-600 mt-1">
              <TrendingDown className="h-3 w-3 mr-1" />
              {analytics.summary.failedExecutions} com erro
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Duração Média</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(analytics.summary.avgDuration / 1000).toFixed(1)}s
            </div>
            <div className="flex items-center text-xs text-gray-500 mt-1">
              <Minus className="h-3 w-3 mr-1" />
              Por execução
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance por Fluxo */}
      <Card>
        <CardHeader>
          <CardTitle>Performance por Fluxo</CardTitle>
          <CardDescription>
            Detalhamento de cada fluxo de conversa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.byFlow.map((flow) => {
              const flowCompletionRate =
                flow.totalExecutions > 0
                  ? (flow.completedExecutions / flow.totalExecutions) * 100
                  : 0;

              return (
                <div
                  key={flow.flowId}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">{flow.flowName}</h3>
                    <Badge
                      variant={flowCompletionRate >= 80 ? "default" : "outline"}
                    >
                      {flowCompletionRate.toFixed(0)}% conclusão
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Execuções</div>
                      <div className="text-lg font-semibold">
                        {flow.totalExecutions}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Concluídas</div>
                      <div className="text-lg font-semibold text-green-600">
                        {flow.completedExecutions}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Falhas</div>
                      <div className="text-lg font-semibold text-red-600">
                        {flow.failedExecutions}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Duração Média</div>
                      <div className="text-lg font-semibold">
                        {(flow.avgDuration / 1000).toFixed(1)}s
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${flowCompletionRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {analytics.byFlow.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhum dado disponível para o período selecionado
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

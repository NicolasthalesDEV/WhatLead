"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  TrendingUp,
  MessageSquare,
  Volume2,
  Bot,
  RefreshCw,
  AlertCircle,
  Users,
  Zap,
  BarChart3,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

interface ProviderSummary {
  provider: string;
  calls: number;
  costUsd: number;
  inputUnits: number;
  outputUnits: number;
}

interface OperationSummary {
  provider: string;
  operation: string;
  calls: number;
  costUsd: number;
}

interface DayPoint {
  date: string;
  costUsd: number;
  calls: number;
}

interface TopCustomer {
  customerId: string;
  name: string;
  phone: string;
  costUsd: number;
  calls: number;
}

interface CostsData {
  period: { from: string; to: string };
  summary: { totalCostUsd: number; totalCalls: number };
  byProvider: ProviderSummary[];
  byOperation: OperationSummary[];
  dailySeries: DayPoint[];
  topCustomers: TopCustomer[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

const PROVIDER_META: Record<
  string,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  openai: {
    label: "OpenAI",
    icon: Bot,
    color: "text-emerald-600",
    bg: "bg-emerald-500",
  },
  elevenlabs: {
    label: "ElevenLabs",
    icon: Volume2,
    color: "text-violet-600",
    bg: "bg-violet-500",
  },
  meta: {
    label: "Meta (WhatsApp)",
    icon: MessageSquare,
    color: "text-blue-600",
    bg: "bg-blue-500",
  },
};

function fmt(usd: number) {
  return `$${usd.toFixed(4)}`;
}

function fmtShort(usd: number) {
  if (usd >= 1) return `$${usd.toFixed(2)}`;
  return `$${usd.toFixed(4)}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

// ── Bar from 0–100% ────────────────────────────────────────────────────────
function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
      <div
        className={cn("h-full rounded-full transition-all duration-500", color)}
        style={{ width: `${Math.max(pct, 2)}%` }}
      />
    </div>
  );
}

// ── Pill period selector ───────────────────────────────────────────────────
const PERIODS: { label: string; value: string }[] = [
  { label: "7 dias", value: "7d" },
  { label: "30 dias", value: "30d" },
  { label: "90 dias", value: "90d" },
];

// ── Page ──────────────────────────────────────────────────────────────────

export default function ApiCostsPage() {
  const [period, setPeriod] = useState("30d");
  const [data, setData] = useState<CostsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/api-costs?period=${period}`, { credentials: "include" });
      if (!res.ok) throw new Error("Erro ao carregar dados");
      const json: CostsData = await res.json();
      setData(json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  const maxDailyCost = data?.dailySeries.length
    ? Math.max(...data.dailySeries.map((d) => d.costUsd), 0.0001)
    : 1;

  const maxProviderCost = data?.byProvider.length
    ? Math.max(...data.byProvider.map((p) => p.costUsd), 0.0001)
    : 1;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">

        {/* ── Header ───────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-primary" />
              Custos de API
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Monitoramento de gastos por provedor — OpenAI, ElevenLabs e Meta
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Period pills */}
            <div className="flex rounded-lg border bg-background p-1 gap-1">
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                    period === p.value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4 mr-1.5", loading && "animate-spin")} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* ── Error state ──────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* ── Loading skeleton ─────────────────────────────────── */}
        {loading && !data && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        )}

        {data && (
          <>
            {/* ── Summary cards ────────────────────────────────── */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Total cost */}
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4" />
                    Custo Total
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{fmtShort(data.summary.totalCostUsd)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {PERIODS.find((p) => p.value === period)?.label}
                  </p>
                </CardContent>
              </Card>

              {/* Total calls */}
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1.5">
                    <Zap className="h-4 w-4" />
                    Total de Chamadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{data.summary.totalCalls.toLocaleString("pt-BR")}</p>
                  <p className="text-xs text-muted-foreground mt-1">Todas as APIs</p>
                </CardContent>
              </Card>

              {/* OpenAI cost */}
              {(() => {
                const p = data.byProvider.find((p) => p.provider === "openai");
                return (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-1.5">
                        <Bot className="h-4 w-4 text-emerald-500" />
                        OpenAI
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{fmtShort(p?.costUsd ?? 0)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {p?.calls ?? 0} chamadas · {(p?.inputUnits ?? 0) + (p?.outputUnits ?? 0)} tokens
                      </p>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* ElevenLabs cost */}
              {(() => {
                const p = data.byProvider.find((p) => p.provider === "elevenlabs");
                return (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription className="flex items-center gap-1.5">
                        <Volume2 className="h-4 w-4 text-violet-500" />
                        ElevenLabs
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{fmtShort(p?.costUsd ?? 0)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {p?.calls ?? 0} chamadas · {p?.inputUnits ?? 0} chars
                      </p>
                    </CardContent>
                  </Card>
                );
              })()}
            </div>

            {/* ── Middle row: Provider breakdown + Daily chart ─── */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

              {/* Provider breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart3 className="h-4 w-4" />
                    Custo por Provedor
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.byProvider.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      Nenhum dado no período selecionado.
                    </p>
                  )}
                  {data.byProvider
                    .sort((a, b) => b.costUsd - a.costUsd)
                    .map((p) => {
                      const meta = PROVIDER_META[p.provider] ?? {
                        label: p.provider,
                        icon: Zap,
                        color: "text-gray-600",
                        bg: "bg-gray-500",
                      };
                      const Icon = meta.icon;
                      const pct = (p.costUsd / maxProviderCost) * 100;
                      return (
                        <div key={p.provider} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className={cn("flex items-center gap-1.5 font-medium", meta.color)}>
                              <Icon className="h-4 w-4" />
                              {meta.label}
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="text-muted-foreground text-xs">{p.calls} chamadas</span>
                              <span className="font-semibold">{fmtShort(p.costUsd)}</span>
                            </div>
                          </div>
                          <Bar pct={pct} color={meta.bg} />
                        </div>
                      );
                    })}
                </CardContent>
              </Card>

              {/* Daily cost trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-4 w-4" />
                    Tendência Diária de Custo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.dailySeries.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      Nenhum dado no período selecionado.
                    </p>
                  )}
                  {data.dailySeries.length > 0 && (
                    <div className="space-y-1">
                      {/* Bar chart */}
                      <div className="flex items-end gap-1 h-32 overflow-x-auto pb-2">
                        {data.dailySeries.map((day) => {
                          const h = Math.max((day.costUsd / maxDailyCost) * 100, 2);
                          return (
                            <div
                              key={day.date}
                              className="flex flex-col items-center gap-1 flex-1 min-w-[18px] group relative"
                            >
                              {/* Tooltip */}
                              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                {formatDate(day.date)}: {fmt(day.costUsd)}
                                <br />
                                {day.calls} chamada{day.calls !== 1 ? "s" : ""}
                              </div>
                              <div
                                className="w-full rounded-t-sm bg-primary/80 hover:bg-primary transition-colors cursor-default"
                                style={{ height: `${h}%` }}
                              />
                            </div>
                          );
                        })}
                      </div>

                      {/* X axis labels (show first, middle, last) */}
                      {data.dailySeries.length > 1 && (
                        <div className="flex justify-between text-xs text-muted-foreground px-0.5">
                          <span>{formatDate(data.dailySeries[0].date)}</span>
                          {data.dailySeries.length > 2 && (
                            <span>
                              {formatDate(
                                data.dailySeries[Math.floor(data.dailySeries.length / 2)].date
                              )}
                            </span>
                          )}
                          <span>{formatDate(data.dailySeries[data.dailySeries.length - 1].date)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* ── Operations breakdown ─────────────────────────── */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="h-4 w-4" />
                  Custo por Operação
                </CardTitle>
                <CardDescription>Detalhamento de cada tipo de chamada de API</CardDescription>
              </CardHeader>
              <CardContent>
                {data.byOperation.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Nenhum dado no período selecionado.
                  </p>
                )}
                <div className="overflow-x-auto">
                  {data.byOperation.length > 0 && (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground text-xs">
                          <th className="text-left py-2 pr-4 font-medium">Provedor</th>
                          <th className="text-left py-2 pr-4 font-medium">Operação</th>
                          <th className="text-right py-2 pr-4 font-medium">Chamadas</th>
                          <th className="text-right py-2 font-medium">Custo (USD)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {data.byOperation
                          .sort((a, b) => b.costUsd - a.costUsd)
                          .map((op, i) => {
                            const meta = PROVIDER_META[op.provider];
                            const Icon = meta?.icon ?? Zap;
                            return (
                              <tr key={i} className="hover:bg-muted/40 transition-colors">
                                <td className="py-2.5 pr-4">
                                  <span
                                    className={cn(
                                      "flex items-center gap-1.5 font-medium",
                                      meta?.color ?? "text-gray-600"
                                    )}
                                  >
                                    <Icon className="h-3.5 w-3.5" />
                                    {meta?.label ?? op.provider}
                                  </span>
                                </td>
                                <td className="py-2.5 pr-4 text-muted-foreground font-mono text-xs">
                                  {op.operation}
                                </td>
                                <td className="py-2.5 pr-4 text-right tabular-nums">
                                  {op.calls.toLocaleString("pt-BR")}
                                </td>
                                <td className="py-2.5 text-right tabular-nums font-semibold">
                                  {fmtShort(op.costUsd)}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* ── Top customers ────────────────────────────────── */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4" />
                  Top Clientes por Custo
                </CardTitle>
                <CardDescription>
                  Os 10 clientes que geraram mais custo de API no período
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.topCustomers.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Nenhum dado de cliente no período selecionado.
                  </p>
                )}
                {data.topCustomers.length > 0 && (
                  <div className="space-y-3">
                    {data.topCustomers.map((c, i) => {
                      const maxCost = data.topCustomers[0].costUsd;
                      const pct = (c.costUsd / maxCost) * 100;
                      return (
                        <div key={c.customerId} className="flex items-center gap-3">
                          {/* Rank badge */}
                          <span className="w-6 text-xs text-muted-foreground text-center flex-shrink-0">
                            #{i + 1}
                          </span>

                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <div className="min-w-0">
                                <span className="font-medium truncate block">{c.name}</span>
                                <span className="text-xs text-muted-foreground">{c.phone}</span>
                              </div>
                              <div className="text-right flex-shrink-0 ml-2">
                                <span className="font-semibold">{fmtShort(c.costUsd)}</span>
                                <span className="text-xs text-muted-foreground block">
                                  {c.calls} chamadas
                                </span>
                              </div>
                            </div>
                            <Bar pct={pct} color="bg-primary" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── Period info ──────────────────────────────────── */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                Período:{" "}
                {new Date(data.period.from).toLocaleDateString("pt-BR")}
                {" – "}
                {new Date(data.period.to).toLocaleDateString("pt-BR")}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

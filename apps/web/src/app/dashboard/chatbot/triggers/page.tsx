"use client";

import { fetchApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { Plus, Trash2, Edit, ArrowLeft, Zap } from "lucide-react";
import Link from "next/link";

type Trigger = {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  conditions: any;
  flowId: string;
  flow?: { name: string };
};

type Flow = {
  id: string;
  name: string;
};

const TRIGGER_TYPES = [
  { value: "MESSAGE_KEYWORD", label: "Palavra-chave na Mensagem" },
  { value: "NEW_CUSTOMER", label: "Novo Cliente" },
  { value: "ORDER_CREATED", label: "Pedido Criado" },
  { value: "ORDER_PAID", label: "Pedido Pago" },
  { value: "ORDER_CANCELLED", label: "Pedido Cancelado" },
  { value: "IDLE_CUSTOMER", label: "Cliente Inativo" },
  { value: "TIME_BASED", label: "Baseado em Horário" },
  { value: "CUSTOM_EVENT", label: "Evento Customizado" },
];

export default function TriggersPage() {
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<Trigger | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    type: "MESSAGE_KEYWORD",
    flowId: "",
    conditions: {} as any,
  });

  useEffect(() => {
    loadTriggers();
    loadFlows();
  }, []);

  const loadTriggers = async () => {
    try {
      const res = await fetchApi("/api/chatbot/triggers");
      const data = await res.json();
      setTriggers(data.triggers || []);
    } catch (error) {
      console.error("Failed to load triggers:", error);
    }
  };

  const loadFlows = async () => {
    try {
      const res = await fetchApi("/api/chatbot/flows");
      const data = await res.json();
      setFlows(data.flows || []);
    } catch (error) {
      console.error("Failed to load flows:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetchApi("/api/chatbot/triggers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          isActive: true,
        }),
      });

      if (res.ok) {
        setShowForm(false);
        setFormData({ name: "", type: "MESSAGE_KEYWORD", flowId: "", conditions: {} });
        await loadTriggers();
      }
    } catch (error) {
      console.error("Failed to create trigger:", error);
    }

    setLoading(false);
  };

  const deleteTrigger = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este trigger?")) return;

    try {
      await fetchApi(`/api/chatbot/triggers/${id}`, { method: "DELETE" });
      await loadTriggers();
    } catch (error) {
      console.error("Failed to delete trigger:", error);
    }
  };

  const handleTypeChange = (type: string) => {
    let defaultConditions = {};

    switch (type) {
      case "MESSAGE_KEYWORD":
        defaultConditions = { keywords: "" };
        break;
      case "IDLE_CUSTOMER":
        defaultConditions = { days: 7 };
        break;
      case "TIME_BASED":
        defaultConditions = { time: "09:00", daysOfWeek: [] };
        break;
    }

    setFormData({ ...formData, type, conditions: defaultConditions });
  };

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
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Zap className="h-7 w-7" />
                Triggers de Automação
              </h1>
              <p className="text-gray-600">Configure disparadores automáticos</p>
            </div>
          </div>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Trigger
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Criar Novo Trigger</CardTitle>
            <CardDescription>
              Configure um gatilho para iniciar fluxos automaticamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Nome do Trigger</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Boas-vindas novo cliente"
                  required
                />
              </div>

              <div>
                <Label>Tipo de Trigger</Label>
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={formData.type}
                  onChange={(e) => handleTypeChange(e.target.value)}
                >
                  {TRIGGER_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Fluxo a Executar</Label>
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={formData.flowId}
                  onChange={(e) => setFormData({ ...formData, flowId: e.target.value })}
                  required
                >
                  <option value="">Selecione um fluxo</option>
                  {flows.map((flow) => (
                    <option key={flow.id} value={flow.id}>
                      {flow.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Condições específicas por tipo */}
              {formData.type === "MESSAGE_KEYWORD" && (
                <div>
                  <Label>Palavras-chave (separadas por vírgula)</Label>
                  <Input
                    value={formData.conditions.keywords || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        conditions: { ...formData.conditions, keywords: e.target.value },
                      })
                    }
                    placeholder="Ex: oi, olá, bom dia"
                  />
                </div>
              )}

              {formData.type === "IDLE_CUSTOMER" && (
                <div>
                  <Label>Dias de inatividade</Label>
                  <Input
                    type="number"
                    value={formData.conditions.days || 7}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        conditions: { ...formData.conditions, days: parseInt(e.target.value) },
                      })
                    }
                  />
                </div>
              )}

              {formData.type === "TIME_BASED" && (
                <div className="space-y-3">
                  <div>
                    <Label>Horário</Label>
                    <Input
                      type="time"
                      value={formData.conditions.time || "09:00"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          conditions: { ...formData.conditions, time: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Dias da semana</Label>
                    <div className="flex gap-2 flex-wrap mt-2">
                      {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day, index) => (
                        <Button
                          key={day}
                          type="button"
                          variant={
                            formData.conditions.daysOfWeek?.includes(index)
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() => {
                            const days = formData.conditions.daysOfWeek || [];
                            const newDays = days.includes(index)
                              ? days.filter((d: number) => d !== index)
                              : [...days, index];
                            setFormData({
                              ...formData,
                              conditions: { ...formData.conditions, daysOfWeek: newDays },
                            });
                          }}
                        >
                          {day}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? "Criando..." : "Criar Trigger"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Triggers List */}
      <Card>
        <CardHeader>
          <CardTitle>Triggers Configurados</CardTitle>
          <CardDescription>
            {triggers.length} trigger(s) ativo(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {triggers.map((trigger) => (
              <div
                key={trigger.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{trigger.name}</h3>
                    <Badge variant={trigger.isActive ? "default" : "outline"}>
                      {trigger.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                    <Badge variant="outline">
                      {TRIGGER_TYPES.find((t) => t.value === trigger.type)?.label}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Executa: {trigger.flow?.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {JSON.stringify(trigger.conditions)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteTrigger(trigger.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {triggers.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Zap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhum trigger configurado</p>
                <p className="text-sm">Clique em "Novo Trigger" para começar</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

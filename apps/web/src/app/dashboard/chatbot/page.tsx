"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { useState, useEffect } from "react";
import {
  Bot,
  Plus,
  Play,
  Pause,
  Edit,
  Trash2,
  BarChart3,
  MessageSquare,
  Zap,
  Settings,
  ChevronRight,
  Save,
  ArrowLeft,
} from "lucide-react";

type Flow = {
  id: string;
  name: string;
  description?: string;
  status: string;
  triggers: string[];
  priority: number;
  _count?: { executions: number };
  nodes?: any[];
};

type Node = {
  id: string;
  type: string;
  data: any;
  position: { x: number; y: number };
  connections: any[];
  order: number;
};

export default function ChatbotPage() {
  const [view, setView] = useState<"list" | "editor" | "analytics">("list");
  const [flows, setFlows] = useState<Flow[]>([]);
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null);
  const [loading, setLoading] = useState(false);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newFlowName, setNewFlowName] = useState("");
  const [newFlowDescription, setNewFlowDescription] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    loadFlows();
  }, []);

  const loadFlows = async () => {
    try {
      const res = await fetch("/api/chatbot/flows");
      const data = await res.json();
      setFlows(data.flows || []);
    } catch (error) {
      console.error("Failed to load flows:", error);
      showToast("Erro ao carregar fluxos", "error");
    }
  };

  const createFlow = async () => {
    if (!newFlowName.trim()) {
      showToast("Nome do fluxo é obrigatório", "warning");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/chatbot/flows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFlowName.trim(),
          description: newFlowDescription.trim(),
          triggers: [],
          priority: 0,
        }),
      });

      if (res.ok) {
        showToast("Fluxo criado com sucesso!", "success");
        setShowCreateDialog(false);
        setNewFlowName("");
        setNewFlowDescription("");
        await loadFlows();
      } else {
        const error = await res.json();
        showToast(error.message || "Erro ao criar fluxo", "error");
      }
    } catch (error) {
      console.error("Failed to create flow:", error);
      showToast("Erro ao criar fluxo", "error");
    }
    setLoading(false);
  };

  const deleteFlow = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este fluxo?")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/chatbot/flows/${id}`, { method: "DELETE" });
      
      if (res.ok) {
        showToast("Fluxo excluído com sucesso!", "success");
        await loadFlows();
      } else {
        showToast("Erro ao excluir fluxo", "error");
      }
    } catch (error) {
      console.error("Failed to delete flow:", error);
      showToast("Erro ao excluir fluxo", "error");
    }
    setLoading(false);
  };

  const toggleFlowStatus = async (flow: Flow) => {
    const newStatus = flow.status === "ACTIVE" ? "PAUSED" : "ACTIVE";

    try {
      await fetch(`/api/chatbot/flows/${flow.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...flow, status: newStatus }),
      });
      await loadFlows();
    } catch (error) {
      console.error("Failed to update flow:", error);
    }
  };

  const openEditor = async (flow: Flow) => {
    setSelectedFlow(flow);

    try {
      const res = await fetch(`/api/chatbot/flows/${flow.id}`);
      const data = await res.json();
      setNodes(data.flow?.nodes || []);
      setView("editor");
    } catch (error) {
      console.error("Failed to load flow details:", error);
    }
  };

  const addNode = (type: string) => {
    const newNode: Node = {
      id: `node_${Date.now()}`,
      type,
      data: getDefaultNodeData(type),
      position: { x: 100, y: 100 + nodes.length * 150 },
      connections: [],
      order: nodes.length,
    };

    setNodes([...nodes, newNode]);
  };

  const getDefaultNodeData = (type: string) => {
    switch (type) {
      case "MESSAGE":
        return { message: "Digite sua mensagem aqui" };
      case "QUESTION":
        return { message: "Digite sua pergunta aqui", variable: "resposta" };
      case "CONDITION":
        return { condition: "lastInput contains sim" };
      case "ACTION":
        return { action: "save_variable", variable: "dados" };
      case "DELAY":
        return { delay: 1000 };
      default:
        return {};
    }
  };

  const saveFlow = async () => {
    if (!selectedFlow) return;

    setLoading(true);
    try {
      await fetch(`/api/chatbot/flows/${selectedFlow.id}/nodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes }),
      });

      alert("Fluxo salvo com sucesso!");
    } catch (error) {
      console.error("Failed to save flow:", error);
      alert("Erro ao salvar fluxo");
    }
    setLoading(false);
  };

  if (view === "editor" && selectedFlow) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setView("list")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{selectedFlow.name}</h1>
              <p className="text-gray-600">Editor de Fluxo</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setView("analytics")}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Button onClick={saveFlow} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Componentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => addNode("TRIGGER")}
              >
                <Zap className="h-4 w-4 mr-2" />
                Início
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => addNode("MESSAGE")}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Mensagem
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => addNode("QUESTION")}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Pergunta
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => addNode("CONDITION")}
              >
                <Settings className="h-4 w-4 mr-2" />
                Condição
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => addNode("ACTION")}
              >
                <Zap className="h-4 w-4 mr-2" />
                Ação
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => addNode("DELAY")}
              >
                <Settings className="h-4 w-4 mr-2" />
                Delay
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => addNode("END_FLOW")}
              >
                <Settings className="h-4 w-4 mr-2" />
                Fim
              </Button>
            </CardContent>
          </Card>

          <div className="col-span-3">
            <Card className="h-[600px] overflow-auto bg-gray-50">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {nodes.map((node, index) => (
                    <div
                      key={node.id}
                      className="bg-white border-2 border-blue-500 rounded-lg p-4 shadow-sm hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{node.type}</Badge>
                          <span className="text-sm font-medium">Nó {index + 1}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setNodes(nodes.filter((n) => n.id !== node.id))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {node.type === "MESSAGE" && (
                        <Input
                          placeholder="Digite a mensagem"
                          value={node.data.message || ""}
                          onChange={(e) => {
                            const updated = nodes.map((n) =>
                              n.id === node.id
                                ? { ...n, data: { ...n.data, message: e.target.value } }
                                : n
                            );
                            setNodes(updated);
                          }}
                        />
                      )}

                      {node.type === "QUESTION" && (
                        <div className="space-y-2">
                          <Input
                            placeholder="Digite a pergunta"
                            value={node.data.message || ""}
                            onChange={(e) => {
                              const updated = nodes.map((n) =>
                                n.id === node.id
                                  ? { ...n, data: { ...n.data, message: e.target.value } }
                                  : n
                              );
                              setNodes(updated);
                            }}
                          />
                          <Input
                            placeholder="Nome da variável"
                            value={node.data.variable || ""}
                            onChange={(e) => {
                              const updated = nodes.map((n) =>
                                n.id === node.id
                                  ? { ...n, data: { ...n.data, variable: e.target.value } }
                                  : n
                              );
                              setNodes(updated);
                            }}
                          />
                        </div>
                      )}

                      {node.type === "CONDITION" && (
                        <Input
                          placeholder="Condição (ex: lastInput contains sim)"
                          value={node.data.condition || ""}
                          onChange={(e) => {
                            const updated = nodes.map((n) =>
                              n.id === node.id
                                ? { ...n, data: { ...n.data, condition: e.target.value } }
                                : n
                            );
                            setNodes(updated);
                          }}
                        />
                      )}

                      {index < nodes.length - 1 && (
                        <div className="flex justify-center mt-2">
                          <ChevronRight className="h-6 w-6 text-blue-500 rotate-90" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-8 w-8" />
            Chatbot & Automação
          </h1>
          <p className="text-gray-600">Crie fluxos automatizados de conversa</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setView("analytics")}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button onClick={() => setShowCreateDialog(true)} disabled={loading}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Fluxo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Fluxos Ativos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {flows.filter((f) => f.status === "ACTIVE").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Execuções</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {flows.reduce((acc, f) => acc + (f._count?.executions || 0), 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Triggers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {flows.reduce((acc, f) => acc + f.triggers.length, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Taxa de Sucesso</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">94%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fluxos de Conversa</CardTitle>
          <CardDescription>
            Gerencie os fluxos automatizados do seu chatbot
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {flows.map((flow) => (
              <div
                key={flow.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{flow.name}</h3>
                    <Badge variant={flow.status === "ACTIVE" ? "default" : "outline"}>
                      {flow.status === "ACTIVE" ? "Ativo" : "Pausado"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {flow.description || "Sem descrição"}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span>{flow._count?.executions || 0} execuções</span>
                    <span>•</span>
                    <span>{flow.triggers.length} triggers</span>
                    {flow.triggers.length > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-xs">{flow.triggers.join(", ")}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFlowStatus(flow)}
                  >
                    {flow.status === "ACTIVE" ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditor(flow)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteFlow(flow.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {flows.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Bot className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhum fluxo criado ainda</p>
                <p className="text-sm">Clique em "Novo Fluxo" para começar</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog para criar novo fluxo */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Fluxo</DialogTitle>
            <DialogDescription>
              Crie um novo fluxo de conversação para o chatbot
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="flow-name">Nome do Fluxo *</Label>
              <Input
                id="flow-name"
                placeholder="Ex: Atendimento Inicial"
                value={newFlowName}
                onChange={(e) => setNewFlowName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loading) {
                    createFlow();
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="flow-description">Descrição</Label>
              <Textarea
                id="flow-description"
                placeholder="Descreva brevemente o propósito deste fluxo"
                value={newFlowDescription}
                onChange={(e) => setNewFlowDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setNewFlowName("");
                setNewFlowDescription("");
              }}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button onClick={createFlow} disabled={loading || !newFlowName.trim()}>
              {loading ? "Criando..." : "Criar Fluxo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

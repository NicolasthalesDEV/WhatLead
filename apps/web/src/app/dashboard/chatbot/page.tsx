"use client";

import "@xyflow/react/dist/style.css";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Handle,
  Position,
  Connection,
  NodeProps,
  Edge,
  Node,
} from "@xyflow/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { useCallback, useState, useEffect, useRef } from "react";
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
  Save,
  ArrowLeft,
  GitBranch,
  Clock,
  StopCircle,
  Tag,
  Phone,
  Globe,
  ChevronRight,
  Workflow,
  TrendingUp,
  Users,
  CheckCircle2,
  X,
  Copy,
  RefreshCw,
  SlidersHorizontal,
  Smile,
  Bell,
  BellOff,
  Timer,
  UserCheck,
  Languages,
  Palette,
  Volume2,
  Mic,
  Brain,
  Sliders,
  AlignLeft,
  Sparkles,
} from "lucide-react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type Flow = {
  id: string;
  name: string;
  description?: string;
  status: string;
  triggers: string[];
  priority: number;
  _count?: { executions: number };
};

type ChatbotSettings = {
  botName: string;
  botEmoji: string;
  language: string;
  tone: string;
  autoReplyEnabled: boolean;
  typingDelay: number;
  sessionTimeoutMinutes: number;
  maxMessagesPerSession: number;
  welcomeMessage: string;
  farewellMessage: string;
  unknownCommandMessage: string;
  offHoursEnabled: boolean;
  offHoursMessage: string;
  businessHoursStart: string;
  businessHoursEnd: string;
  businessDays: string[];
  handoffEnabled: boolean;
  handoffKeyword: string;
  handoffMessage: string;
  // Agent personality
  agentPersonality: string;
  agentContext: string;
  responseLength: string;
  // OpenAI
  openAIEnabled: boolean;
  openAIModel: string;
  openAISystemPrompt: string;
  openAITemperature: number;
  openAIMaxTokens: number;
  openAIContextMessages: number;
  // ElevenLabs
  elevenLabsEnabled: boolean;
  elevenLabsVoiceId: string;
  elevenLabsModel: string;
  elevenLabsStability: number;
  elevenLabsSimilarity: number;
  elevenLabsStyle: number;
};

const DEFAULT_SETTINGS: ChatbotSettings = {
  botName: "Assistente",
  botEmoji: "🤖",
  language: "pt-BR",
  tone: "friendly",
  autoReplyEnabled: true,
  typingDelay: 1500,
  sessionTimeoutMinutes: 30,
  maxMessagesPerSession: 50,
  welcomeMessage: "Olá! Como posso ajudar você hoje? 😊",
  farewellMessage: "Obrigado pelo contato! Até logo! 👋",
  unknownCommandMessage: "Desculpe, não entendi. Poderia reformular sua pergunta?",
  offHoursEnabled: false,
  offHoursMessage: "Estamos fora do horário de atendimento. Retornaremos em breve!",
  businessHoursStart: "08:00",
  businessHoursEnd: "18:00",
  businessDays: ["MON", "TUE", "WED", "THU", "FRI"],
  handoffEnabled: true,
  handoffKeyword: "humano",
  handoffMessage: "Transferindo para um atendente humano...",
  agentPersonality: "",
  agentContext: "",
  responseLength: "normal",
  openAIEnabled: false,
  openAIModel: "gpt-4o-mini",
  openAISystemPrompt: "",
  openAITemperature: 0.7,
  openAIMaxTokens: 512,
  openAIContextMessages: 10,
  elevenLabsEnabled: false,
  elevenLabsVoiceId: "",
  elevenLabsModel: "eleven_multilingual_v2",
  elevenLabsStability: 0.5,
  elevenLabsSimilarity: 0.75,
  elevenLabsStyle: 0.0,
};

type NodeData = {
  label: string;
  message?: string;
  variable?: string;
  delay?: number;
  condition?: string;
  action?: string;
  flowId?: string;
  tags?: string;
  apiUrl?: string;
  [key: string]: any;
};

// ─────────────────────────────────────────────
// Node color / icon map
// ─────────────────────────────────────────────
const NODE_META: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: React.ReactNode }
> = {
  TRIGGER: {
    label: "Início",
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-400",
    icon: <Zap className="h-4 w-4 text-green-600" />,
  },
  MESSAGE: {
    label: "Mensagem",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-400",
    icon: <MessageSquare className="h-4 w-4 text-blue-600" />,
  },
  QUESTION: {
    label: "Pergunta",
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-400",
    icon: <MessageSquare className="h-4 w-4 text-purple-600" />,
  },
  CONDITION: {
    label: "Condição",
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-400",
    icon: <GitBranch className="h-4 w-4 text-orange-600" />,
  },
  ACTION: {
    label: "Ação",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-400",
    icon: <Zap className="h-4 w-4 text-red-600" />,
  },
  DELAY: {
    label: "Espera",
    color: "text-gray-700",
    bg: "bg-gray-50",
    border: "border-gray-400",
    icon: <Clock className="h-4 w-4 text-gray-600" />,
  },
  ASSIGN_TAG: {
    label: "Atribuir Tag",
    color: "text-yellow-700",
    bg: "bg-yellow-50",
    border: "border-yellow-400",
    icon: <Tag className="h-4 w-4 text-yellow-600" />,
  },
  HANDOFF: {
    label: "Transferir",
    color: "text-teal-700",
    bg: "bg-teal-50",
    border: "border-teal-400",
    icon: <Phone className="h-4 w-4 text-teal-600" />,
  },
  API_CALL: {
    label: "Chamar API",
    color: "text-indigo-700",
    bg: "bg-indigo-50",
    border: "border-indigo-400",
    icon: <Globe className="h-4 w-4 text-indigo-600" />,
  },
  END_FLOW: {
    label: "Encerrar",
    color: "text-slate-700",
    bg: "bg-slate-100",
    border: "border-slate-500",
    icon: <StopCircle className="h-4 w-4 text-slate-600" />,
  },
  AI_RESPONSE: {
    label: "IA (GPT)",
    color: "text-violet-700",
    bg: "bg-violet-50",
    border: "border-violet-400",
    icon: <Bot className="h-4 w-4 text-violet-600" />,
  },
  VOICE_REPLY: {
    label: "Voz (ElevenLabs)",
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-400",
    icon: <Volume2 className="h-4 w-4 text-rose-600" />,
  },
};

// ─────────────────────────────────────────────
// Custom Node Component
// ─────────────────────────────────────────────
function ChatbotNode({ id, data, selected }: NodeProps) {
  const meta = NODE_META[data.type as string] || NODE_META.MESSAGE;
  const isStart = data.type === "TRIGGER";
  const isEnd = data.type === "END_FLOW" || data.type === "HANDOFF";

  return (
    <div
      className={`
        min-w-[200px] max-w-[240px] rounded-xl border-2 shadow-md transition-all duration-150
        ${meta.bg} ${meta.border}
        ${selected ? "ring-2 ring-offset-1 ring-blue-400 shadow-lg scale-[1.02]" : ""}
      `}
    >
      {/* Input handle (top) */}
      {!isStart && (
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-white !border-2 !border-gray-400 !rounded-full"
        />
      )}

      {/* Header */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-t-lg bg-white/60 border-b ${meta.border}`}>
        {meta.icon}
        <span className={`text-xs font-semibold uppercase tracking-wide ${meta.color}`}>
          {meta.label}
        </span>
      </div>

      {/* Content */}
      <div className="px-3 py-2 space-y-1">
        <p className="text-sm font-medium text-gray-800 leading-snug">
          {data.label as string || meta.label}
        </p>
        {!!data.message && (
          <p className="text-xs text-gray-500 leading-snug truncate max-w-[200px]">
            {data.message as string}
          </p>
        )}
        {!!data.condition && (
          <p className="text-xs font-mono text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded truncate">
            {data.condition as string}
          </p>
        )}
        {!!data.delay && (
          <p className="text-xs text-gray-500">⏱ {Number(data.delay) / 1000}s</p>
        )}
        {!!data.tags && (
          <p className="text-xs text-yellow-700 bg-yellow-100 px-1.5 py-0.5 rounded truncate">
            #{data.tags as string}
          </p>
        )}
      </div>

      {/* Output handle (bottom) */}
      {!(data.type === "END_FLOW") && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 !bg-white !border-2 !border-gray-400 !rounded-full"
        />
      )}

      {/* Condition has two outputs */}
      {data.type === "CONDITION" && (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            style={{ top: "60%" }}
            className="!w-3 !h-3 !bg-green-200 !border-2 !border-green-500 !rounded-full"
          />
          <Handle
            type="source"
            position={Position.Left}
            id="false"
            style={{ top: "60%" }}
            className="!w-3 !h-3 !bg-red-200 !border-2 !border-red-500 !rounded-full"
          />
        </>
      )}
    </div>
  );
}

const nodeTypes = { chatbotNode: ChatbotNode };

// ─────────────────────────────────────────────
// Flow Editor
// ─────────────────────────────────────────────
function FlowEditor({
  flow,
  initialNodes,
  onSave,
  onBack,
}: {
  flow: Flow;
  initialNodes: any[];
  onSave: (nodes: Node[], edges: Edge[]) => Promise<void>;
  onBack: () => void;
}) {
  const { showToast } = useToast();

  // Convert DB nodes → React Flow nodes + edges
  const toRFNodes = (dbNodes: any[]): Node[] =>
    dbNodes.map((n) => ({
      id: n.id,
      type: "chatbotNode",
      position: n.position ?? { x: Math.random() * 400, y: Math.random() * 400 },
      data: { ...n.data, type: n.type, label: NODE_META[n.type]?.label ?? n.type },
      selected: false,
    }));

  const toRFEdges = (dbNodes: any[]): Edge[] => {
    const edges: Edge[] = [];
    dbNodes.forEach((node) => {
      (node.connections ?? []).forEach((conn: any, idx: number) => {
        edges.push({
          id: `e-${node.id}-${conn.targetNodeId}-${idx}`,
          source: node.id,
          target: conn.targetNodeId,
          sourceHandle: conn.condition || undefined,
          label: conn.label || conn.condition || undefined,
          animated: false,
          style: { stroke: "#94a3b8", strokeWidth: 2 },
          labelStyle: { fontSize: 11, fill: "#64748b" },
          labelBgStyle: { fill: "#f8fafc" },
        });
      });
    });
    return edges;
  };

  const [nodes, setNodes, onNodesChange] = useNodesState(toRFNodes(initialNodes));
  const [edges, setEdges, onEdgesChange] = useEdgesState(toRFEdges(initialNodes));
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [saving, setSaving] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: false,
            style: { stroke: "#94a3b8", strokeWidth: 2 },
          },
          eds
        )
      ),
    [setEdges]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const addNode = (type: string) => {
    const id = `node_${Date.now()}`;
    const meta = NODE_META[type];
    const newNode: Node = {
      id,
      type: "chatbotNode",
      position: {
        x: 100 + Math.random() * 200,
        y: 100 + nodes.length * 120,
      },
      data: {
        type,
        label: meta?.label ?? type,
        ...getDefaultData(type),
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const getDefaultData = (type: string): Partial<NodeData> => {
    switch (type) {
      case "MESSAGE":
        return { message: "Olá! Como posso ajudar?" };
      case "QUESTION":
        return { message: "Qual é o seu nome?", variable: "nome" };
      case "CONDITION":
        return { condition: "lastInput contains sim" };
      case "ACTION":
        return { action: "save_variable", variable: "dados" };
      case "DELAY":
        return { delay: 2000 };
      case "ASSIGN_TAG":
        return { tags: "lead" };
      case "API_CALL":
        return { apiUrl: "https://", apiMethod: "GET" };
      default:
        return {};
    }
  };

  const updateSelectedNode = (field: string, value: any) => {
    if (!selectedNode) return;
    const updated = {
      ...selectedNode,
      data: { ...selectedNode.data, [field]: value },
    };
    setSelectedNode(updated);
    setNodes((nds) => nds.map((n) => (n.id === selectedNode.id ? updated : n)));
  };

  const deleteSelectedNode = () => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) =>
      eds.filter(
        (e) => e.source !== selectedNode.id && e.target !== selectedNode.id
      )
    );
    setSelectedNode(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(nodes, edges);
      showToast("Fluxo salvo com sucesso!", "success");
    } catch {
      showToast("Erro ao salvar fluxo", "error");
    }
    setSaving(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-3 bg-white border-b shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Voltar</span>
          </Button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate max-w-[150px] sm:max-w-none">{flow.name}</h1>
            <p className="text-xs text-gray-500 hidden sm:block">Editor de Fluxo Visual</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={flow.status === "ACTIVE" ? "default" : "outline"} className="hidden sm:flex">
            {flow.status === "ACTIVE" ? "● Ativo" : "○ Rascunho"}
          </Badge>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-1" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      {/* Mobile notice */}
      <div className="sm:hidden flex flex-col items-center justify-center flex-1 p-8 text-center bg-gray-50">
        <div className="p-4 bg-blue-50 rounded-full mb-4">
          <Workflow className="h-12 w-12 text-blue-400" />
        </div>
        <h2 className="text-lg font-bold text-gray-800 mb-2">Editor Visual</h2>
        <p className="text-gray-500 text-sm max-w-xs">
          O editor de fluxos visuais funciona melhor em telas maiores. Acesse pelo computador para criar e editar fluxos.
        </p>
        <Button className="mt-6" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar à lista
        </Button>
      </div>

      <div className="hidden sm:flex flex-1 overflow-hidden">
        {/* Node palette */}
        <aside className="w-52 bg-white border-r p-3 overflow-y-auto flex-shrink-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Componentes
          </p>
          <div className="space-y-1.5">
            {Object.entries(NODE_META).map(([type, meta]) => (
              <button
                key={type}
                onClick={() => addNode(type)}
                className={`
                  w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-left
                  hover:shadow-sm transition-all text-sm font-medium
                  ${meta.bg} ${meta.border} ${meta.color}
                `}
              >
                {meta.icon}
                {meta.label}
              </button>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-gray-400 leading-relaxed">
              Arraste nós para o canvas ou clique para adicionar. Conecte as saídas com as entradas.
            </p>
          </div>
        </aside>

        {/* React Flow canvas */}
        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            deleteKeyCode="Delete"
            minZoom={0.3}
            maxZoom={2}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="#cbd5e1"
            />
            <Controls />
            <MiniMap
              nodeColor={(n) => {
                const meta = NODE_META[(n.data as any)?.type];
                return meta?.border?.replace("border-", "") ?? "#94a3b8";
              }}
              className="!bg-white !border !rounded-lg"
            />
          </ReactFlow>

          {/* Empty state */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-gray-400">
                <Workflow className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Canvas vazio</p>
                <p className="text-sm mt-1">Clique em um componente à esquerda para começar</p>
              </div>
            </div>
          )}
        </div>

        {/* Properties panel */}
        {selectedNode && (
          <aside className="w-64 bg-white border-l p-4 overflow-y-auto flex-shrink-0 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Propriedades</h3>
              <div className="flex gap-1">
                <button
                  onClick={deleteSelectedNode}
                  className="p-1 rounded hover:bg-red-50 text-red-500 transition-colors"
                  title="Excluir nó"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1 rounded hover:bg-gray-100 text-gray-500 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {/* Label */}
              <div>
                <Label className="text-xs text-gray-500">Rótulo</Label>
                <Input
                  value={(selectedNode.data.label as string) || ""}
                  onChange={(e) => updateSelectedNode("label", e.target.value)}
                  className="mt-1 text-sm"
                  placeholder="Nome do nó"
                />
              </div>

              {/* Message / Question */}
              {(selectedNode.data.type === "MESSAGE" ||
                selectedNode.data.type === "QUESTION") && (
                  <div>
                    <Label className="text-xs text-gray-500">
                      {selectedNode.data.type === "QUESTION" ? "Pergunta" : "Mensagem"}
                    </Label>
                    <Textarea
                      value={(selectedNode.data.message as string) || ""}
                      onChange={(e) => updateSelectedNode("message", e.target.value)}
                      className="mt-1 text-sm"
                      rows={3}
                      placeholder="Digite aqui... Use {{variavel}} para inserir dados"
                    />
                  </div>
                )}

              {/* Variable */}
              {selectedNode.data.type === "QUESTION" && (
                <div>
                  <Label className="text-xs text-gray-500">Salvar resposta em</Label>
                  <Input
                    value={(selectedNode.data.variable as string) || ""}
                    onChange={(e) => updateSelectedNode("variable", e.target.value)}
                    className="mt-1 text-sm font-mono"
                    placeholder="nome_variavel"
                  />
                </div>
              )}

              {/* Condition */}
              {selectedNode.data.type === "CONDITION" && (
                <div>
                  <Label className="text-xs text-gray-500">Condição</Label>
                  <Input
                    value={(selectedNode.data.condition as string) || ""}
                    onChange={(e) => updateSelectedNode("condition", e.target.value)}
                    className="mt-1 text-sm font-mono"
                    placeholder="lastInput contains sim"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Ex: <code>lastInput contains sim</code> ou <code>nome == João</code>
                  </p>
                  <p className="text-xs text-orange-600 mt-2 font-medium">
                    → Saída direita: verdadeiro<br />
                    → Saída esquerda: falso
                  </p>
                </div>
              )}

              {/* Action */}
              {selectedNode.data.type === "ACTION" && (
                <>
                  <div>
                    <Label className="text-xs text-gray-500">Ação</Label>
                    <select
                      value={(selectedNode.data.action as string) || "save_variable"}
                      onChange={(e) => updateSelectedNode("action", e.target.value)}
                      className="mt-1 w-full text-sm border rounded-md px-2 py-1.5"
                    >
                      <option value="save_variable">Salvar variável</option>
                      <option value="create_quote">Criar orçamento</option>
                      <option value="create_order">Criar pedido</option>
                      <option value="update_customer">Atualizar cliente</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Variável</Label>
                    <Input
                      value={(selectedNode.data.variable as string) || ""}
                      onChange={(e) => updateSelectedNode("variable", e.target.value)}
                      className="mt-1 text-sm font-mono"
                      placeholder="nome_variavel"
                    />
                  </div>
                </>
              )}

              {/* Delay */}
              {selectedNode.data.type === "DELAY" && (
                <div>
                  <Label className="text-xs text-gray-500">Tempo (segundos)</Label>
                  <Input
                    type="number"
                    value={Number(selectedNode.data.delay ?? 2000) / 1000}
                    onChange={(e) =>
                      updateSelectedNode("delay", Number(e.target.value) * 1000)
                    }
                    className="mt-1 text-sm"
                    min={0.5}
                    step={0.5}
                  />
                </div>
              )}

              {/* Tags */}
              {selectedNode.data.type === "ASSIGN_TAG" && (
                <div>
                  <Label className="text-xs text-gray-500">Tags (separadas por vírgula)</Label>
                  <Input
                    value={(selectedNode.data.tags as string) || ""}
                    onChange={(e) => updateSelectedNode("tags", e.target.value)}
                    className="mt-1 text-sm"
                    placeholder="lead, cliente, vip"
                  />
                </div>
              )}

              {/* API Call */}
              {selectedNode.data.type === "API_CALL" && (
                <>
                  <div>
                    <Label className="text-xs text-gray-500">URL</Label>
                    <Input
                      value={(selectedNode.data.apiUrl as string) || ""}
                      onChange={(e) => updateSelectedNode("apiUrl", e.target.value)}
                      className="mt-1 text-sm"
                      placeholder="https://api.example.com/endpoint"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Método</Label>
                    <select
                      value={(selectedNode.data.apiMethod as string) || "GET"}
                      onChange={(e) => updateSelectedNode("apiMethod", e.target.value)}
                      className="mt-1 w-full text-sm border rounded-md px-2 py-1.5"
                    >
                      <option>GET</option>
                      <option>POST</option>
                      <option>PUT</option>
                      <option>DELETE</option>
                    </select>
                  </div>
                </>
              )}

              {/* Node ID */}
              <div className="pt-2 border-t">
                <p className="text-xs text-gray-400 font-mono">{selectedNode.id}</p>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Chatbot Page
// ─────────────────────────────────────────────
export default function ChatbotPage() {
  const [view, setView] = useState<"list" | "editor" | "settings">("list");
  const [flows, setFlows] = useState<Flow[]>([]);
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null);
  const [flowNodes, setFlowNodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newFlowName, setNewFlowName] = useState("");
  const [newFlowDescription, setNewFlowDescription] = useState("");
  const [newFlowTriggers, setNewFlowTriggers] = useState("");
  const [settings, setSettings] = useState<ChatbotSettings>(DEFAULT_SETTINGS);
  const [settingsSection, setSettingsSection] = useState<"identity" | "personality" | "tone" | "messages" | "hours" | "handoff" | "behavior" | "openai" | "voice">("identity");
  const [savingSettings, setSavingSettings] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (view === "list") loadFlows();
    if (view === "settings") loadSettings();
  }, [view]);

  const loadFlows = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/chatbot/flows");
      const data = await res.json();
      setFlows(data.flows || []);
    } catch {
      showToast("Erro ao carregar fluxos", "error");
    }
    setLoading(false);
  };

  const loadSettings = async () => {
    try {
      const res = await fetch("/api/chatbot/settings");
      const data = await res.json();
      if (data.settings) {
        setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
      }
    } catch {
      showToast("Erro ao carregar configurações", "error");
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch("/api/chatbot/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        showToast("Configurações salvas!", "success");
      } else {
        showToast("Erro ao salvar configurações", "error");
      }
    } catch {
      showToast("Erro ao salvar configurações", "error");
    }
    setSavingSettings(false);
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
          description: newFlowDescription.trim() || undefined,
          triggers: newFlowTriggers
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          priority: 0,
        }),
      });
      if (res.ok) {
        showToast("Fluxo criado!", "success");
        setShowCreateDialog(false);
        setNewFlowName("");
        setNewFlowDescription("");
        setNewFlowTriggers("");
        await loadFlows();
      } else {
        const err = await res.json();
        showToast(err.message || "Erro ao criar fluxo", "error");
      }
    } catch {
      showToast("Erro ao criar fluxo", "error");
    }
    setLoading(false);
  };

  const deleteFlow = async (id: string) => {
    if (!confirm("Confirmar exclusão?")) return;
    setLoading(true);
    try {
      await fetch(`/api/chatbot/flows/${id}`, { method: "DELETE" });
      showToast("Fluxo excluído", "success");
      await loadFlows();
    } catch {
      showToast("Erro ao excluir", "error");
    }
    setLoading(false);
  };

  const toggleStatus = async (flow: Flow) => {
    const newStatus = flow.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      await fetch(`/api/chatbot/flows/${flow.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...flow, status: newStatus }),
      });
      await loadFlows();
    } catch {
      showToast("Erro ao atualizar status", "error");
    }
  };

  const openEditor = async (flow: Flow) => {
    setSelectedFlow(flow);
    try {
      const res = await fetch(`/api/chatbot/flows/${flow.id}`);
      const data = await res.json();
      setFlowNodes(data.flow?.nodes || []);
      setView("editor");
    } catch {
      showToast("Erro ao abrir editor", "error");
    }
  };

  const saveFlow = async (nodes: Node[], edges: Edge[]) => {
    if (!selectedFlow) return;

    // Convert React Flow nodes + edges → DB nodes with connections
    const dbNodes = nodes.map((n, idx) => {
      const outgoingEdges = edges.filter((e) => e.source === n.id);
      const connections = outgoingEdges.map((e) => ({
        targetNodeId: e.target,
        condition: e.sourceHandle || undefined,
        label: typeof e.label === "string" ? e.label : undefined,
      }));

      const { type: _t, label: _l, ...dataWithoutMeta } = n.data as any;

      return {
        id: n.id,
        type: (n.data as any).type,
        position: n.position,
        data: dataWithoutMeta,
        connections,
        order: idx,
      };
    });

    const res = await fetch(`/api/chatbot/flows/${selectedFlow.id}/nodes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nodes: dbNodes }),
    });

    if (!res.ok) throw new Error("Save failed");
  };

  // ── STATS ──
  const activeFlows = flows.filter((f) => f.status === "ACTIVE").length;
  const totalExecutions = flows.reduce((a, f) => a + (f._count?.executions || 0), 0);
  const totalTriggers = flows.reduce((a, f) => a + f.triggers.length, 0);

  // ── EDITOR VIEW ──
  if (view === "editor" && selectedFlow) {
    return (
      <FlowEditor
        flow={selectedFlow}
        initialNodes={flowNodes}
        onSave={saveFlow}
        onBack={() => setView("list")}
      />
    );
  }

  // ── SETTINGS VIEW ──
  const DAYS = [
    { key: "MON", label: "Seg" },
    { key: "TUE", label: "Ter" },
    { key: "WED", label: "Qua" },
    { key: "THU", label: "Qui" },
    { key: "FRI", label: "Sex" },
    { key: "SAT", label: "Sáb" },
    { key: "SUN", label: "Dom" },
  ];

  const TONES = [
    { key: "formal", label: "Formal", desc: "Linguagem profissional e respeitosa. Trata o cliente por senhor/senhora", emoji: "👔" },
    { key: "informal", label: "Informal", desc: "Casual e descontraído, como um amigo. Pode usar gírias leves", emoji: "😎" },
    { key: "friendly", label: "Amigável", desc: "Caloroso, acolhedor e empático. Emojis com moderação", emoji: "😊" },
    { key: "professional", label: "Profissional", desc: "Direto, objetivo e eficiente. Sem rodeios", emoji: "💼" },
    { key: "fun", label: "Divertido", desc: "Leve, com emojis e energia positiva. Pode fazer trocadilhos", emoji: "🎉" },
    { key: "empathetic", label: "Empático", desc: "Valida sentimentos antes de oferecer soluções. Muito acolhedor", emoji: "🤝" },
    { key: "assertive", label: "Assertivo", desc: "Firme e confiante. Apresenta informações com convicção", emoji: "🎯" },
    { key: "minimalist", label: "Minimalista", desc: "Extremamente conciso. Uma frase quando possível", emoji: "✂️" },
  ];

  const TONE_EXAMPLES: Record<string, string> = {
    formal: "Bom dia! Como posso assistí-lo hoje? Ficamos à disposição.",
    informal: "Oi! Que bom que mandou mensagem 😋 O que tá precisando?",
    friendly: "Olá! Que ótimo ter sua mensagem aqui! Me conta o que posso fazer por você 😊",
    professional: "Olá. Em que posso ajudá-lo?",
    fun: "E aí!! 🎉🎉 Chegou a hora de resolver tudo! Pode falar!",
    empathetic: "Oi! Entendo como isso pode ser importante para você. Me conta melhor o que aconteceu 🤝",
    assertive: "Olá! Estou aqui e pronto para resolver sua demanda agora. Pode começar!",
    minimalist: "Olá! Como posso ajudar?",
  };

  const LANGS = [
    { key: "pt-BR", label: "🇧🇷 Português (Brasil)" },
    { key: "pt-PT", label: "🇵🇹 Português (Portugal)" },
    { key: "en-US", label: "🇺🇸 English (US)" },
    { key: "es-ES", label: "🇪🇸 Español" },
  ];

  const SECTIONS = [
    { key: "identity", label: "Identidade", icon: <Smile className="h-4 w-4" /> },
    { key: "personality", label: "Personalidade", icon: <Brain className="h-4 w-4" /> },
    { key: "tone", label: "Tonalidade", icon: <Palette className="h-4 w-4" /> },
    { key: "messages", label: "Mensagens", icon: <MessageSquare className="h-4 w-4" /> },
    { key: "hours", label: "Horários", icon: <Clock className="h-4 w-4" /> },
    { key: "handoff", label: "Atendente", icon: <UserCheck className="h-4 w-4" /> },
    { key: "behavior", label: "Comportamento", icon: <SlidersHorizontal className="h-4 w-4" /> },
    { key: "openai", label: "OpenAI / GPT", icon: <Sparkles className="h-4 w-4" /> },
    { key: "voice", label: "Voz (ElevenLabs)", icon: <Volume2 className="h-4 w-4" /> },
  ] as const;

  if (view === "settings") {
    return (
      <div className="space-y-4 p-3 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button variant="outline" size="sm" onClick={() => setView("list")}>
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Voltar</span>
            </Button>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold flex items-center gap-2">
                <div className="p-1.5 sm:p-2 bg-purple-100 rounded-xl">
                  <SlidersHorizontal className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                </div>
                <span className="hidden sm:inline">Personalização do Chatbot</span>
                <span className="sm:hidden">Personalizar</span>
              </h1>
              <p className="text-gray-500 text-xs sm:text-sm mt-0.5 hidden sm:block">
                Configure como seu assistente se comporta e se comunica
              </p>
            </div>
          </div>
          <Button onClick={saveSettings} disabled={savingSettings} className="w-full sm:w-auto" size="sm">
            <Save className="h-4 w-4 mr-2" />
            {savingSettings ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>

        {/* Mobile section select */}
        <div className="sm:hidden">
          <select
            value={settingsSection}
            onChange={(e) => setSettingsSection(e.target.value as typeof settingsSection)}
            className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
          >
            {SECTIONS.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          {/* Sidebar nav - desktop only */}
          <nav className="hidden sm:block w-48 shrink-0 space-y-1">
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                onClick={() => setSettingsSection(s.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${settingsSection === s.key
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
                  }`}
              >
                {s.icon}
                {s.label}
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0">

            {/* ── IDENTITY ── */}
            {settingsSection === "identity" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smile className="h-5 w-5 text-purple-500" />
                    Identidade do Bot
                  </CardTitle>
                  <CardDescription>Como seu chatbot se apresenta aos clientes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <Label>Nome do Bot</Label>
                      <Input
                        className="mt-1"
                        placeholder="Ex: Assistente, Lia, Max..."
                        value={settings.botName}
                        onChange={(e) => setSettings({ ...settings, botName: e.target.value })}
                      />
                    </div>
                    <div className="w-32">
                      <Label>Emoji</Label>
                      <Input
                        className="mt-1 text-center text-xl"
                        placeholder="🤖"
                        value={settings.botEmoji}
                        onChange={(e) => setSettings({ ...settings, botEmoji: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                    <p className="text-sm text-purple-700 font-medium mb-1">Prévia</p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{settings.botEmoji || "🤖"}</span>
                      <span className="font-semibold text-gray-800">{settings.botName || "Assistente"}</span>
                      <Badge variant="outline" className="text-purple-600 border-purple-300 ml-auto">
                        {LANGS.find(l => l.key === settings.language)?.label.split(" ")[0]}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <Label>Idioma</Label>
                    <select
                      className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-white"
                      value={settings.language}
                      onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                    >
                      {LANGS.map((l) => (
                        <option key={l.key} value={l.key}>{l.label}</option>
                      ))}
                    </select>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── PERSONALITY ── */}
            {settingsSection === "personality" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-violet-500" />
                      Personalidade do Agente
                    </CardTitle>
                    <CardDescription>Defina traços de personalidade adicionais e o contexto do seu negócio</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div>
                      <Label>Traços de personalidade</Label>
                      <p className="text-xs text-gray-400 mb-1">
                        Descreva características que o agente deve ter. Ex: "Extrovertida, usa humor leve, curiosa, sempre celebra as conquistas do cliente"
                      </p>
                      <Textarea
                        rows={3}
                        className="mt-1 text-sm"
                        placeholder="Ex: Otimista, paciente, usa emojis com moderação, nunca usa sarcasmo"
                        value={settings.agentPersonality ?? ''}
                        onChange={(e) => setSettings({ ...settings, agentPersonality: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label>Contexto do negócio</Label>
                      <p className="text-xs text-gray-400 mb-1">
                        Informe sobre sua empresa, serviços, produtos, horários e regras importantes. Isso é injetado no prompt do sistema.
                      </p>
                      <Textarea
                        rows={5}
                        className="mt-1 text-sm"
                        placeholder={`Ex:\nSomos a Empresa XYZ, especializada em atendimento via WhatsApp.\nNossos serviços: plano básico (R$ 97) e profissional (R$ 197).\nNunca forneça preços sem confirmar com a equipe.\nHorário de atendimento humano: seg-sex das 9h às 18h.`}
                        value={settings.agentContext ?? ''}
                        onChange={(e) => setSettings({ ...settings, agentContext: e.target.value })}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlignLeft className="h-5 w-5 text-violet-500" />
                      Tamanho das Respostas
                    </CardTitle>
                    <CardDescription>Controle o quanto o agente fala em cada mensagem</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { key: "brief", label: "Conciso", desc: "Máximo 1–2 frases. Ideal para respostas rápidas e FAQs", emoji: "✂️" },
                        { key: "normal", label: "Normal", desc: "Até 3 frases. Equilibrado entre clareza e velocidade", emoji: "⚖️" },
                        { key: "detailed", label: "Detalhado", desc: "Responde de forma completa e explanatória quando necessário", emoji: "📖" },
                      ].map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => setSettings({ ...settings, responseLength: opt.key })}
                          className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${settings.responseLength === opt.key
                            ? "border-violet-400 bg-violet-50 shadow-sm"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                        >
                          <span className="text-2xl">{opt.emoji}</span>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{opt.label}</p>
                            <p className="text-sm text-gray-500">{opt.desc}</p>
                          </div>
                          {settings.responseLength === opt.key && (
                            <CheckCircle2 className="h-5 w-5 text-violet-500" />
                          )}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ── TONE ── */}
            {settingsSection === "tone" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-pink-500" />
                    Tonalidade de Comunicação
                  </CardTitle>
                  <CardDescription>Escolha como o chatbot se comunica com os clientes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-3">
                    {TONES.map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setSettings({ ...settings, tone: t.key })}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${settings.tone === t.key
                          ? "border-pink-400 bg-pink-50 shadow-sm"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                      >
                        <span className="text-2xl">{t.emoji}</span>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{t.label}</p>
                          <p className="text-sm text-gray-500">{t.desc}</p>
                        </div>
                        {settings.tone === t.key && (
                          <CheckCircle2 className="h-5 w-5 text-pink-500" />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 p-4 bg-pink-50 border border-pink-200 rounded-xl">
                    <p className="text-xs text-pink-600 font-semibold uppercase tracking-wide mb-1">Exemplo de saudação</p>
                    <p className="text-sm text-gray-700 italic">
                      &quot;{TONE_EXAMPLES[settings.tone] || TONE_EXAMPLES.friendly}&quot;
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── MESSAGES ── */}
            {settingsSection === "messages" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                    Mensagens Automáticas
                  </CardTitle>
                  <CardDescription>Textos enviados automaticamente pelo chatbot</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <Label>Resposta automática</Label>
                    <div className="flex items-center gap-3 mt-1">
                      <Switch
                        checked={settings.autoReplyEnabled}
                        onCheckedChange={(v) => setSettings({ ...settings, autoReplyEnabled: v })}
                      />
                      <span className="text-sm text-gray-600">
                        {settings.autoReplyEnabled ? "Ativada" : "Desativada"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label>Mensagem de boas-vindas</Label>
                    <p className="text-xs text-gray-400 mb-1">Enviada quando um novo contato inicia conversa</p>
                    <Textarea
                      rows={2}
                      value={settings.welcomeMessage ?? ''}
                      onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })}
                      placeholder="Olá! Como posso ajudar?"
                    />
                  </div>

                  <div>
                    <Label>Mensagem de encerramento</Label>
                    <p className="text-xs text-gray-400 mb-1">Enviada ao finalizar o atendimento</p>
                    <Textarea
                      rows={2}
                      value={settings.farewellMessage ?? ''}
                      onChange={(e) => setSettings({ ...settings, farewellMessage: e.target.value })}
                      placeholder="Obrigado pelo contato! Até logo!"
                    />
                  </div>

                  <div>
                    <Label>Mensagem para comando desconhecido</Label>
                    <p className="text-xs text-gray-400 mb-1">Quando o bot não entende a mensagem</p>
                    <Textarea
                      rows={2}
                      value={settings.unknownCommandMessage ?? ''}
                      onChange={(e) => setSettings({ ...settings, unknownCommandMessage: e.target.value })}
                      placeholder="Desculpe, não entendi..."
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── HOURS ── */}
            {settingsSection === "hours" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-500" />
                    Horário de Atendimento
                  </CardTitle>
                  <CardDescription>Configure quando o bot responde automaticamente</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-800">Mensagem fora do horário</p>
                      <p className="text-sm text-gray-500">Responde quando fora do horário configurado</p>
                    </div>
                    <Switch
                      checked={settings.offHoursEnabled}
                      onCheckedChange={(v) => setSettings({ ...settings, offHoursEnabled: v })}
                    />
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label>Abertura</Label>
                      <Input
                        type="time"
                        className="mt-1"
                        value={settings.businessHoursStart}
                        onChange={(e) => setSettings({ ...settings, businessHoursStart: e.target.value })}
                      />
                    </div>
                    <div className="flex-1">
                      <Label>Encerramento</Label>
                      <Input
                        type="time"
                        className="mt-1"
                        value={settings.businessHoursEnd}
                        onChange={(e) => setSettings({ ...settings, businessHoursEnd: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Dias da semana</Label>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {DAYS.map((d) => (
                        <button
                          key={d.key}
                          type="button"
                          onClick={() => {
                            const days = settings.businessDays.includes(d.key)
                              ? settings.businessDays.filter((x) => x !== d.key)
                              : [...settings.businessDays, d.key];
                            setSettings({ ...settings, businessDays: days });
                          }}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${settings.businessDays.includes(d.key)
                            ? "bg-orange-500 text-white border-orange-500"
                            : "bg-white text-gray-600 border-gray-300 hover:border-orange-300"
                            }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={settings.offHoursEnabled ? "" : "opacity-50 pointer-events-none"}>
                    <Label>Mensagem fora do horário</Label>
                    <Textarea
                      rows={2}
                      className="mt-1"
                      value={settings.offHoursMessage ?? ''}
                      onChange={(e) => setSettings({ ...settings, offHoursMessage: e.target.value })}
                      placeholder="Estamos fora do horário de atendimento..."
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── HANDOFF ── */}
            {settingsSection === "handoff" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-teal-500" />
                    Transferência para Atendente
                  </CardTitle>
                  <CardDescription>Configure quando e como o bot transfere para um humano</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-center justify-between p-4 bg-teal-50 border border-teal-200 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-800">Transferência automática</p>
                      <p className="text-sm text-gray-500">Permite que o cliente solicite atendente humano</p>
                    </div>
                    <Switch
                      checked={settings.handoffEnabled}
                      onCheckedChange={(v) => setSettings({ ...settings, handoffEnabled: v })}
                    />
                  </div>

                  <div className={settings.handoffEnabled ? "space-y-4" : "space-y-4 opacity-50 pointer-events-none"}>
                    <div>
                      <Label>Palavra-chave para transferência</Label>
                      <p className="text-xs text-gray-400 mb-1">Cliente envia esta palavra para ser transferido</p>
                      <Input
                        value={settings.handoffKeyword}
                        onChange={(e) => setSettings({ ...settings, handoffKeyword: e.target.value })}
                        placeholder="humano, atendente, ajuda..."
                      />
                    </div>

                    <div>
                      <Label>Mensagem ao transferir</Label>
                      <Textarea
                        rows={2}
                        value={settings.handoffMessage ?? ''}
                        onChange={(e) => setSettings({ ...settings, handoffMessage: e.target.value })}
                        placeholder="Transferindo para um atendente..."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── BEHAVIOR ── */}
            {settingsSection === "behavior" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <SlidersHorizontal className="h-5 w-5 text-gray-600" />
                    Comportamento
                  </CardTitle>
                  <CardDescription>Ajuste fino do comportamento automático do bot</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>Delay de digitando (“escrevendo...”)</Label>
                    <p className="text-xs text-gray-400 mb-2">Tempo que o bot "fica digitando" antes de enviar resposta</p>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        min={0}
                        max={10000}
                        step={500}
                        className="w-28"
                        value={settings.typingDelay}
                        onChange={(e) => setSettings({ ...settings, typingDelay: Number(e.target.value) })}
                      />
                      <span className="text-sm text-gray-500">ms ({(settings.typingDelay / 1000).toFixed(1)}s)</span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      {[0, 1000, 1500, 2000, 3000].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setSettings({ ...settings, typingDelay: v })}
                          className={`px-2.5 py-1 text-xs rounded border transition-colors ${settings.typingDelay === v
                            ? "bg-gray-800 text-white border-gray-800"
                            : "border-gray-300 text-gray-600 hover:border-gray-500"
                            }`}
                        >
                          {v === 0 ? "Instant" : `${v / 1000}s`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Timeout de sessão (minutos)</Label>
                    <p className="text-xs text-gray-400 mb-2">Inativa a conversa após este período sem resposta</p>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        min={5}
                        max={1440}
                        step={5}
                        className="w-28"
                        value={settings.sessionTimeoutMinutes}
                        onChange={(e) => setSettings({ ...settings, sessionTimeoutMinutes: Number(e.target.value) })}
                      />
                      <span className="text-sm text-gray-500">minutos</span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      {[15, 30, 60, 120, 1440].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setSettings({ ...settings, sessionTimeoutMinutes: v })}
                          className={`px-2.5 py-1 text-xs rounded border transition-colors ${settings.sessionTimeoutMinutes === v
                            ? "bg-gray-800 text-white border-gray-800"
                            : "border-gray-300 text-gray-600 hover:border-gray-500"
                            }`}
                        >
                          {v < 60 ? `${v}min` : v === 1440 ? "24h" : `${v / 60}h`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Máximo de mensagens por sessão</Label>
                    <p className="text-xs text-gray-400 mb-2">Encerra a conversa após este número de trocas</p>
                    <Input
                      type="number"
                      min={5}
                      max={200}
                      step={5}
                      className="w-28"
                      value={settings.maxMessagesPerSession}
                      onChange={(e) => setSettings({ ...settings, maxMessagesPerSession: Number(e.target.value) })}
                    />
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl border space-y-2">
                    <p className="text-sm font-semibold text-gray-700">⚡ Resumo da configuração</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Delay: <strong>{settings.typingDelay}ms</strong></li>
                      <li>• Timeout: <strong>{settings.sessionTimeoutMinutes} minutos</strong></li>
                      <li>• Máx mensagens: <strong>{settings.maxMessagesPerSession}</strong></li>
                      <li>• Resposta auto: <strong>{settings.autoReplyEnabled ? "Sim" : "Não"}</strong></li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── OPENAI ── */}
            {settingsSection === "openai" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-green-600" />
                      OpenAI / GPT
                    </CardTitle>
                    <CardDescription>
                      Quando nenhum fluxo corresponde à mensagem, o GPT responde automaticamente.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
                      <div>
                        <p className="font-medium text-green-800">Respostas automáticas com IA</p>
                        <p className="text-sm text-green-600">Usa GPT quando nenhum fluxo for encontrado</p>
                      </div>
                      <Switch
                        checked={settings.openAIEnabled}
                        onCheckedChange={(v) => setSettings({ ...settings, openAIEnabled: v })}
                      />
                    </div>

                    <div>
                      <Label>Modelo GPT</Label>
                      <select
                        className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-white"
                        value={settings.openAIModel}
                        onChange={(e) => setSettings({ ...settings, openAIModel: e.target.value })}
                        disabled={!settings.openAIEnabled}
                      >
                        <option value="gpt-4o-mini">GPT-4o Mini — rápido e econômico ✦ recomendado</option>
                        <option value="gpt-4o">GPT-4o — mais inteligente e preciso</option>
                        <option value="gpt-4-turbo">GPT-4 Turbo — alta performance</option>
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo — mais barato</option>
                      </select>
                    </div>

                    {/* Temperature slider */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label>Criatividade (Temperature)</Label>
                        <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                          {settings.openAITemperature.toFixed(1)}
                        </span>
                      </div>
                      <input
                        type="range" min={0} max={1} step={0.1}
                        value={settings.openAITemperature}
                        onChange={(e) => setSettings({ ...settings, openAITemperature: parseFloat(e.target.value) })}
                        disabled={!settings.openAIEnabled}
                        className="w-full accent-green-600"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                        <span>0.0 — Determinístico, sempre consistente</span>
                        <span>1.0 — Criativo, mais variado</span>
                      </div>
                    </div>

                    {/* Max tokens */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label>Tamanho máximo da resposta (tokens)</Label>
                        <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                          {settings.openAIMaxTokens}
                        </span>
                      </div>
                      <input
                        type="range" min={64} max={2048} step={64}
                        value={settings.openAIMaxTokens}
                        onChange={(e) => setSettings({ ...settings, openAIMaxTokens: parseInt(e.target.value) })}
                        disabled={!settings.openAIEnabled}
                        className="w-full accent-green-600"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                        <span>64 — muito curto</span>
                        <span>2048 — resposta longa</span>
                      </div>
                    </div>

                    {/* Context window */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label>Memória de conversa (mensagens anteriores)</Label>
                        <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                          {settings.openAIContextMessages === 0 ? "Sem memória" : `${settings.openAIContextMessages} msgs`}
                        </span>
                      </div>
                      <input
                        type="range" min={0} max={30} step={2}
                        value={settings.openAIContextMessages}
                        onChange={(e) => setSettings({ ...settings, openAIContextMessages: parseInt(e.target.value) })}
                        disabled={!settings.openAIEnabled}
                        className="w-full accent-green-600"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                        <span>0 — cada mensagem é independente</span>
                        <span>30 — lembra bastante do contexto</span>
                      </div>
                    </div>

                    <div>
                      <Label>Prompt do sistema completo (opcional)</Label>
                      <p className="text-xs text-gray-400 mb-1">
                        Substitui completamente o prompt gerado automaticamente. Deixe vazio para usar identidade + personalidade + contexto configurados nas outras abas.
                      </p>
                      <Textarea
                        className="mt-1 min-h-[120px] text-sm font-mono"
                        placeholder={`Deixe vazio para gerar prompt automaticamente.\n\nOu escreva seu prompt completo aqui para ter controle total.`}
                        value={settings.openAISystemPrompt ?? ''}
                        onChange={(e) => setSettings({ ...settings, openAISystemPrompt: e.target.value })}
                        disabled={!settings.openAIEnabled}
                      />
                      {settings.openAISystemPrompt && (
                        <p className="text-xs text-orange-500 mt-1">⚠️ Prompt manual ativo — configurações de identidade/personalidade/tonalidade são ignoradas.</p>
                      )}
                    </div>

                    {/* Transcription info */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                      <p className="text-sm font-medium text-blue-800 flex items-center gap-2">
                        <Mic className="h-4 w-4" /> Transcrição de áudios (Whisper)
                      </p>
                      <p className="text-sm text-blue-700">
                        Áudios recebidos dos clientes são transcritos automaticamente via Whisper e processados pelo GPT.
                      </p>
                    </div>

                    {settings.openAIEnabled && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                        ⚠️ Certifique-se que <code className="font-mono bg-yellow-100 px-1 rounded">OPENAI_API_KEY</code> está configurada no servidor.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ── VOICE (ElevenLabs) ── */}
            {settingsSection === "voice" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Volume2 className="h-5 w-5 text-purple-600" />
                      Respostas em Voz — ElevenLabs
                    </CardTitle>
                    <CardDescription>
                      As respostas do GPT serão convertidas em áudio e enviadas como mensagens de voz no WhatsApp.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-xl">
                      <div>
                        <p className="font-medium text-purple-800">Responder com voz (TTS)</p>
                        <p className="text-sm text-purple-600">Ativa quando OpenAI também estiver habilitado</p>
                      </div>
                      <Switch
                        checked={settings.elevenLabsEnabled}
                        onCheckedChange={(v) => setSettings({ ...settings, elevenLabsEnabled: v })}
                        disabled={!settings.openAIEnabled}
                      />
                    </div>

                    {!settings.openAIEnabled && (
                      <p className="text-sm text-orange-500 bg-orange-50 border border-orange-200 rounded-lg p-3">
                        ⚠️ Habilite o OpenAI/GPT primeiro para poder usar respostas em voz.
                      </p>
                    )}

                    <div>
                      <Label>Voice ID</Label>
                      <p className="text-xs text-gray-400 mb-1">
                        ID da voz no ElevenLabs. Encontre em <strong>elevenlabs.io → Voices</strong>. Vazio = Sarah (voz padrão).
                      </p>
                      <Input
                        className="mt-1 font-mono text-sm"
                        placeholder="EXAVITQu4vr4xnSDxMaL"
                        value={settings.elevenLabsVoiceId}
                        onChange={(e) => setSettings({ ...settings, elevenLabsVoiceId: e.target.value })}
                        disabled={!settings.elevenLabsEnabled}
                      />
                    </div>

                    <div>
                      <Label>Modelo de síntese</Label>
                      <select
                        className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-white"
                        value={settings.elevenLabsModel}
                        onChange={(e) => setSettings({ ...settings, elevenLabsModel: e.target.value })}
                        disabled={!settings.elevenLabsEnabled}
                      >
                        <option value="eleven_multilingual_v2">Multilingual v2 — melhor qualidade, multilíngue ✦ recomendado</option>
                        <option value="eleven_turbo_v2_5">Turbo v2.5 — mais rápido, baixa latência</option>
                        <option value="eleven_turbo_v2">Turbo v2 — equilíbrio entre velocidade e qualidade</option>
                        <option value="eleven_monolingual_v1">Monolingual v1 — somente inglês</option>
                      </select>
                    </div>

                    {/* Stability */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label>Estabilidade da voz</Label>
                        <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                          {settings.elevenLabsStability.toFixed(2)}
                        </span>
                      </div>
                      <input
                        type="range" min={0} max={1} step={0.05}
                        value={settings.elevenLabsStability}
                        onChange={(e) => setSettings({ ...settings, elevenLabsStability: parseFloat(e.target.value) })}
                        disabled={!settings.elevenLabsEnabled}
                        className="w-full accent-purple-600"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                        <span>0 — mais expressivo e variado</span>
                        <span>1 — mais estável e consistente</span>
                      </div>
                    </div>

                    {/* Similarity boost */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label>Fidelidade à voz original (Similarity Boost)</Label>
                        <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                          {settings.elevenLabsSimilarity.toFixed(2)}
                        </span>
                      </div>
                      <input
                        type="range" min={0} max={1} step={0.05}
                        value={settings.elevenLabsSimilarity}
                        onChange={(e) => setSettings({ ...settings, elevenLabsSimilarity: parseFloat(e.target.value) })}
                        disabled={!settings.elevenLabsEnabled}
                        className="w-full accent-purple-600"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                        <span>0 — mais variação no timbre</span>
                        <span>1 — muito fiel ao clone de voz</span>
                      </div>
                    </div>

                    {/* Style */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label>Estilo / Exageração</Label>
                        <span className="text-sm font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                          {settings.elevenLabsStyle.toFixed(2)}
                        </span>
                      </div>
                      <input
                        type="range" min={0} max={1} step={0.05}
                        value={settings.elevenLabsStyle}
                        onChange={(e) => setSettings({ ...settings, elevenLabsStyle: parseFloat(e.target.value) })}
                        disabled={!settings.elevenLabsEnabled}
                        className="w-full accent-purple-600"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                        <span>0 — neutro, natural</span>
                        <span>1 — dramático, pronunciado</span>
                      </div>
                    </div>

                    {settings.elevenLabsEnabled && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                        ⚠️ Certifique-se que <code className="font-mono bg-yellow-100 px-1 rounded">ELEVENLABS_API_KEY</code> está configurada no servidor.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

          </div>
        </div>
      </div>
    );
  }

  // ── LIST VIEW ──
  return (
    <div className="space-y-5 p-3 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 rounded-xl flex-shrink-0">
              <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            Chatbot & Automação
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Crie fluxos visuais para responder automaticamente via WhatsApp
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={() => setView("settings")}>
            <SlidersHorizontal className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Personalizar</span>
          </Button>
          <Button size="sm" onClick={() => setShowCreateDialog(true)} disabled={loading}>
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Novo Fluxo</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Fluxos Ativos",
            value: activeFlows,
            icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
            color: "text-green-600",
          },
          {
            label: "Total Execuções",
            value: totalExecutions,
            icon: <TrendingUp className="h-5 w-5 text-blue-500" />,
            color: "text-blue-600",
          },
          {
            label: "Palavras-chave",
            value: totalTriggers,
            icon: <Zap className="h-5 w-5 text-orange-500" />,
            color: "text-orange-600",
          },
          {
            label: "Taxa de Sucesso",
            value: "—",
            icon: <BarChart3 className="h-5 w-5 text-purple-500" />,
            color: "text-purple-600",
          },
        ].map((stat) => (
          <Card key={stat.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">{stat.label}</span>
                {stat.icon}
              </div>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Flow list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5 text-gray-500" />
            Fluxos de Conversa
          </CardTitle>
          <CardDescription>
            Clique em <strong>Editar</strong> para abrir o editor visual drag-and-drop
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-gray-400">
              <RefreshCw className="h-8 w-8 mx-auto mb-3 animate-spin opacity-50" />
              Carregando fluxos...
            </div>
          ) : flows.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="p-4 bg-gray-50 rounded-full w-fit mx-auto mb-4">
                <Bot className="h-10 w-10 opacity-40" />
              </div>
              <p className="font-medium text-gray-600">Nenhum fluxo criado</p>
              <p className="text-sm mt-1">
                Clique em "Novo Fluxo" para começar a automatizar seu atendimento via WhatsApp
              </p>
              <Button
                className="mt-4"
                onClick={() => setShowCreateDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar primeiro fluxo
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {flows.map((flow) => (
                <div
                  key={flow.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 rounded-xl border bg-white hover:shadow-sm transition-all gap-2 sm:gap-0"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-1.5 rounded-lg ${flow.status === "ACTIVE"
                          ? "bg-green-100"
                          : "bg-gray-100"
                          }`}
                      >
                        <Workflow
                          className={`h-4 w-4 ${flow.status === "ACTIVE"
                            ? "text-green-600"
                            : "text-gray-400"
                            }`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">
                            {flow.name}
                          </span>
                          <Badge
                            variant={
                              flow.status === "ACTIVE" ? "default" : "outline"
                            }
                            className="text-xs"
                          >
                            {flow.status === "ACTIVE"
                              ? "● Ativo"
                              : flow.status === "DRAFT"
                                ? "○ Rascunho"
                                : "◐ Pausado"}
                          </Badge>
                        </div>
                        {flow.description && (
                          <p className="text-sm text-gray-500 mt-0.5">
                            {flow.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {flow._count?.executions || 0} execuções
                          </span>
                          {flow.triggers.length > 0 && (
                            <span className="flex items-center gap-1.5">
                              <Zap className="h-3 w-3" />
                              {flow.triggers.map((t) => (
                                <span
                                  key={t}
                                  className="bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded text-xs"
                                >
                                  {t}
                                </span>
                              ))}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 sm:ml-4 border-t sm:border-t-0 pt-2 sm:pt-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleStatus(flow)}
                      title={flow.status === "ACTIVE" ? "Pausar" : "Ativar"}
                      className="flex-1 sm:flex-none text-gray-500 hover:text-gray-900"
                    >
                      {flow.status === "ACTIVE" ? (
                        <><Pause className="h-4 w-4 sm:mr-0 mr-1" /><span className="sm:hidden text-xs">Pausar</span></>
                      ) : (
                        <><Play className="h-4 w-4 sm:mr-0 mr-1" /><span className="sm:hidden text-xs">Ativar</span></>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditor(flow)}
                      className="flex-1 sm:flex-none text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="h-4 w-4 sm:mr-0 mr-1" /><span className="sm:hidden text-xs">Editar</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteFlow(flow.id)}
                      className="flex-1 sm:flex-none text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 sm:mr-0 mr-1" /><span className="sm:hidden text-xs">Excluir</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-600" />
              Criar Novo Fluxo
            </DialogTitle>
            <DialogDescription>
              Configure as informações básicas do fluxo. Você poderá adicionar e
              editar os nós no editor visual.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="flow-name">
                Nome do Fluxo <span className="text-red-500">*</span>
              </Label>
              <Input
                id="flow-name"
                placeholder="Ex: Atendimento Inicial"
                value={newFlowName}
                onChange={(e) => setNewFlowName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loading) createFlow();
                }}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="flow-desc">Descrição</Label>
              <Textarea
                id="flow-desc"
                placeholder="Descreva o propósito deste fluxo"
                value={newFlowDescription}
                onChange={(e) => setNewFlowDescription(e.target.value)}
                rows={2}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="flow-triggers">
                Palavras-chave <span className="text-gray-400 text-xs">(separadas por vírgula)</span>
              </Label>
              <Input
                id="flow-triggers"
                placeholder="olá, oi, bom dia, quero comprar"
                value={newFlowTriggers}
                onChange={(e) => setNewFlowTriggers(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-gray-400 mt-1">
                O chatbot responderá quando receber uma dessas palavras no WhatsApp
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setNewFlowName("");
                setNewFlowDescription("");
                setNewFlowTriggers("");
              }}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={createFlow}
              disabled={loading || !newFlowName.trim()}
            >
              {loading ? "Criando..." : "Criar e Editar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

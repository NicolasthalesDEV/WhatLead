"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { 
  Bot,
  Settings,
  MessageSquare,
  Zap,
  Clock,
  Save,
  Play,
  Pause,
  Plus,
  Trash2,
  Edit,
  ChevronRight
} from "lucide-react";

export default function ChatbotPage() {
  const [botEnabled, setBotEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  // Configurações do bot
  const [config, setConfig] = useState({
    welcomeMessage: "Olá! 👋 Bem-vindo ao nosso hotel. Como posso ajudá-lo hoje?",
    businessHours: {
      start: "08:00",
      end: "22:00"
    },
    responseDelay: "2",
    language: "pt-BR"
  });

  // Fluxos de conversa
  const [flows, setFlows] = useState([
    {
      id: 1,
      name: "Fazer Reserva",
      trigger: "reserva, quarto, disponibilidade",
      status: "active",
      responses: 45
    },
    {
      id: 2,
      name: "Informações do Hotel",
      trigger: "informações, horário, endereço, localização",
      status: "active",
      responses: 128
    },
    {
      id: 3,
      name: "Check-in/Check-out",
      trigger: "check-in, check-out, entrada, saída",
      status: "active",
      responses: 67
    },
    {
      id: 4,
      name: "Serviços Extras",
      trigger: "café, restaurante, spa, piscina, academia",
      status: "active",
      responses: 34
    },
    {
      id: 5,
      name: "Cancelamento",
      trigger: "cancelar, cancelamento, devolver",
      status: "paused",
      responses: 12
    }
  ]);

  // Respostas rápidas
  const quickResponses = [
    { id: 1, text: "Obrigado por entrar em contato! Um atendente irá responder em breve." },
    { id: 2, text: "Nosso horário de check-in é às 14h e check-out às 12h." },
    { id: 3, text: "Temos quartos disponíveis! Gostaria de fazer uma reserva?" },
    { id: 4, text: "O café da manhã está incluso e é servido das 6h às 10h." }
  ];

  const handleSaveConfig = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const toggleBotStatus = () => {
    setBotEnabled(!botEnabled);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chatbot IA</h1>
          <p className="text-muted-foreground">
            Configure seu assistente virtual para atendimento automático
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={botEnabled ? "default" : "secondary"} className="px-3 py-1">
            {botEnabled ? "Ativo" : "Pausado"}
          </Badge>
          <Button 
            variant={botEnabled ? "outline" : "default"}
            onClick={toggleBotStatus}
          >
            {botEnabled ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pausar Bot
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Ativar Bot
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversas Hoje</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">127</div>
            <p className="text-xs text-muted-foreground">+15% desde ontem</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Resolução</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <p className="text-xs text-muted-foreground">Resolvidos pelo bot</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2s</div>
            <p className="text-xs text-muted-foreground">Tempo de resposta</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reservas via Bot</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">Este mês</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Configurações Gerais */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>Configure o comportamento básico do chatbot</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="welcomeMessage">Mensagem de Boas-Vindas</Label>
                <textarea
                  id="welcomeMessage"
                  value={config.welcomeMessage}
                  onChange={(e) => setConfig({...config, welcomeMessage: e.target.value})}
                  placeholder="Digite a mensagem inicial do bot"
                  rows={3}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Horário de Funcionamento</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="time"
                      value={config.businessHours.start}
                      onChange={(e) => setConfig({
                        ...config, 
                        businessHours: {...config.businessHours, start: e.target.value}
                      })}
                    />
                    <span>até</span>
                    <Input
                      type="time"
                      value={config.businessHours.end}
                      onChange={(e) => setConfig({
                        ...config, 
                        businessHours: {...config.businessHours, end: e.target.value}
                      })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delay">Delay de Resposta (segundos)</Label>
                  <Input
                    id="delay"
                    type="number"
                    value={config.responseDelay}
                    onChange={(e) => setConfig({...config, responseDelay: e.target.value})}
                    min="0"
                    max="10"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveConfig} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Fluxos de Conversa */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Fluxos de Conversa</CardTitle>
                  <CardDescription>Gerencie os fluxos automáticos do chatbot</CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Fluxo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {flows.map((flow) => (
                  <div 
                    key={flow.id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-2 h-2 rounded-full ${flow.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                      <div>
                        <h4 className="font-semibold">{flow.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Triggers: {flow.trigger}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right text-sm">
                        <div className="font-semibold">{flow.responses}</div>
                        <div className="text-muted-foreground">respostas</div>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Respostas Rápidas */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Respostas Rápidas</CardTitle>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickResponses.map((response) => (
                <div 
                  key={response.id}
                  className="p-3 border rounded-lg text-sm hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <p className="text-muted-foreground line-clamp-2">{response.text}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Integrações IA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Bot className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">OpenAI GPT</p>
                    <p className="text-xs text-muted-foreground">Conectado</p>
                  </div>
                </div>
                <Badge variant="default">Ativo</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">WhatsApp API</p>
                    <p className="text-xs text-muted-foreground">Conectado</p>
                  </div>
                </div>
                <Badge variant="default">Ativo</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg opacity-60">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Zap className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Dialogflow</p>
                    <p className="text-xs text-muted-foreground">Não configurado</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">Conectar</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>💡 Use palavras-chave específicas nos triggers para melhor precisão.</p>
              <p>🎯 Respostas curtas têm melhor engajamento.</p>
              <p>⏰ Configure horários para mensagens fora do expediente.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
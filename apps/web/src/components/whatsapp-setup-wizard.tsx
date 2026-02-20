"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  ExternalLink,
  Copy,
  CheckCheck,
  Phone,
  Key,
  Webhook,
  MessageSquare,
  ArrowRight,
  X
} from "lucide-react";

interface WhatsAppSetupWizardProps {
  onClose?: () => void;
  onComplete?: () => void;
}

export function WhatsAppSetupWizard({ onClose, onComplete }: WhatsAppSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const steps = [
    {
      title: "📱 Bem-vindo ao Setup do WhatsApp",
      description: "Configure sua integração em 5 passos simples",
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">O que você vai conseguir fazer:</h4>
            <ul className="space-y-2 text-sm text-green-800">
              <li className="flex items-start">
                <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>Enviar e receber mensagens do WhatsApp direto no sistema</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>Centralizar todas as conversas com clientes em um só lugar</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>Automatizar respostas com o chatbot inteligente</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>Enviar notificações e confirmações automáticas</span>
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>⏱️ Tempo estimado:</strong> 15-20 minutos
            </p>
            <p className="text-xs text-blue-700 mt-2">
              Você vai precisar criar uma conta no Meta for Developers (é grátis!)
            </p>
          </div>
        </div>
      )
    },
    {
      title: "🔑 Passo 1: Criar App no Meta for Developers",
      icon: <Key className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <ol className="space-y-3 text-sm">
            <li className="flex items-start">
              <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0 mt-0.5">1</span>
              <div className="flex-1">
                <p className="font-medium">Acesse o Meta for Developers</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => window.open('https://developers.facebook.com/apps', '_blank')}
                >
                  Abrir Meta for Developers
                  <ExternalLink className="ml-2 h-3 w-3" />
                </Button>
              </div>
            </li>

            <li className="flex items-start">
              <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0 mt-0.5">2</span>
              <div className="flex-1">
                <p className="font-medium">Clique em "Create App" (Criar Aplicativo)</p>
                <p className="text-xs text-muted-foreground mt-1">Se não tiver conta, crie uma usando seu Facebook pessoal</p>
              </div>
            </li>

            <li className="flex items-start">
              <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0 mt-0.5">3</span>
              <div className="flex-1">
                <p className="font-medium">Escolha o tipo "Business"</p>
              </div>
            </li>

            <li className="flex items-start">
              <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0 mt-0.5">4</span>
              <div className="flex-1">
                <p className="font-medium">Preencha os dados:</p>
                <ul className="list-disc list-inside ml-4 mt-1 text-xs space-y-1">
                  <li>Nome do app: "WhatLead CRM" (ou nome da sua empresa)</li>
                  <li>Email de contato: seu@email.com</li>
                  <li>Business Account: selecione ou crie uma</li>
                </ul>
              </div>
            </li>

            <li className="flex items-start">
              <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0 mt-0.5">5</span>
              <div className="flex-1">
                <p className="font-medium">Clique em "Create App" e aguarde a criação</p>
              </div>
            </li>
          </ol>
        </div>
      )
    },
    {
      title: "📱 Passo 2: Adicionar WhatsApp ao App",
      icon: <Phone className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <ol className="space-y-3 text-sm">
            <li className="flex items-start">
              <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0 mt-0.5">1</span>
              <div className="flex-1">
                <p className="font-medium">No dashboard do seu app, procure por "WhatsApp"</p>
                <p className="text-xs text-muted-foreground mt-1">Está na seção "Add Products to Your App"</p>
              </div>
            </li>

            <li className="flex items-start">
              <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0 mt-0.5">2</span>
              <div className="flex-1">
                <p className="font-medium">Clique em "Set Up" no card do WhatsApp</p>
              </div>
            </li>

            <li className="flex items-start">
              <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0 mt-0.5">3</span>
              <div className="flex-1">
                <p className="font-medium">Na barra lateral, clique em "API Setup"</p>
              </div>
            </li>

            <li className="flex items-start">
              <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0 mt-0.5">4</span>
              <div className="flex-1">
                <p className="font-medium">Você verá um número de teste. Vamos configurá-lo!</p>
                <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-2">
                  <p className="text-xs text-yellow-800">
                    <strong>⚠️ Importante:</strong> Inicialmente você terá um número de teste.
                    Depois pode adicionar seu próprio número business.
                  </p>
                </div>
              </div>
            </li>
          </ol>
        </div>
      )
    },
    {
      title: "🔐 Passo 3: Copiar Credenciais",
      icon: <Key className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            Na página "API Setup", você verá três informações importantes. Copie cada uma delas:
          </p>

          <div className="space-y-3">
            <div className="border rounded-lg p-3 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="secondary">Phone Number ID</Badge>
                <span className="text-xs text-muted-foreground">WA_PHONE_NUMBER_ID</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                Encontre em "Phone number ID" na seção "Test number"
              </p>
              <div className="bg-white rounded border p-2 font-mono text-xs break-all">
                123456789012345
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                👆 Copie o número que aparece no seu painel
              </p>
            </div>

            <div className="border rounded-lg p-3 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="secondary">Access Token</Badge>
                <span className="text-xs text-muted-foreground">WA_ACCESS_TOKEN</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                Role a página até "Temporary access token" e clique em "Copy"
              </p>
              <div className="bg-white rounded border p-2 font-mono text-xs break-all">
                EAABsbCS1234567890abcdef...
              </div>
              <div className="bg-red-50 border border-red-200 rounded p-2 mt-2">
                <p className="text-xs text-red-800">
                  <strong>⚠️ Importante:</strong> Este token expira em 24h.
                  Depois você precisará gerar um token permanente (vamos ensinar no próximo passo).
                </p>
              </div>
            </div>

            <div className="border rounded-lg p-3 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="secondary">Business Account ID</Badge>
                <span className="text-xs text-muted-foreground">WA_BUSINESS_ACCOUNT_ID</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                Encontre em "WhatsApp Business Account ID"
              </p>
              <div className="bg-white rounded border p-2 font-mono text-xs break-all">
                987654321098765
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-900 font-medium mb-2">🔐 Para gerar token permanente:</p>
            <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
              <li>Vá em "App Settings" → "Basic"</li>
              <li>Role até "System Users"</li>
              <li>Crie um System User</li>
              <li>Gere um token permanente com permissões de WhatsApp</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      title: "⚙️ Passo 4: Configurar no Sistema",
      icon: <MessageSquare className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Agora vamos adicionar as credenciais que você copiou no sistema:
          </p>

          <div className="space-y-3">
            <div className="border rounded-lg p-3">
              <p className="font-medium text-sm mb-2">Opção 1: Via Interface (Recomendado)</p>
              <ol className="text-xs space-y-1 list-decimal list-inside ml-2">
                <li>Vá em <strong>Configurações → Integrações</strong></li>
                <li>Na seção "WhatsApp Cloud API", cole as credenciais</li>
                <li>Clique em "Salvar Configurações"</li>
                <li>Teste enviando uma mensagem</li>
              </ol>
            </div>

            <div className="border rounded-lg p-3 bg-gray-50">
              <p className="font-medium text-sm mb-2">Opção 2: Via Variáveis de Ambiente</p>
              <p className="text-xs text-muted-foreground mb-2">
                Se estiver rodando localmente ou em servidor próprio, adicione no arquivo <code className="bg-white px-1 rounded">.env</code>:
              </p>
              <div className="bg-gray-900 text-green-400 rounded p-3 font-mono text-xs space-y-1">
                <div>WA_PHONE_NUMBER_ID=<span className="text-yellow-300">seu_phone_number_id</span></div>
                <div>WA_ACCESS_TOKEN=<span className="text-yellow-300">seu_access_token</span></div>
                <div>WA_BUSINESS_ACCOUNT_ID=<span className="text-yellow-300">seu_business_account_id</span></div>
                <div>WA_VERIFY_TOKEN=<span className="text-yellow-300">qualquer_senha_segura</span></div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-900 font-medium flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Pronto! Agora vamos testar
            </p>
          </div>
        </div>
      )
    },
    {
      title: "🚀 Passo 5: Envie sua Primeira Mensagem!",
      icon: <MessageSquare className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-3 flex items-center">
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Parabéns! Setup concluído
            </h4>
            <p className="text-sm text-green-800">
              Agora vamos testar o envio da sua primeira mensagem pelo sistema.
            </p>
          </div>

          <div className="space-y-3">
            <div className="border rounded-lg p-3">
              <p className="font-medium text-sm mb-2">📱 Teste Rápido:</p>
              <ol className="text-sm space-y-2 list-decimal list-inside ml-2">
                <li>
                  <strong>Adicione um número de teste</strong>
                  <p className="text-xs text-muted-foreground ml-5 mt-1">
                    No painel do Meta, vá em "To" e adicione o seu número de celular.
                    Você receberá um código via WhatsApp para confirmar.
                  </p>
                </li>
                <li>
                  <strong>Vá para WhatsApp no menu</strong>
                  <p className="text-xs text-muted-foreground ml-5 mt-1">
                    Clique em "WhatsApp" na barra lateral
                  </p>
                </li>
                <li>
                  <strong>Crie um novo contato</strong>
                  <p className="text-xs text-muted-foreground ml-5 mt-1">
                    Adicione o número que você registrou como teste
                  </p>
                </li>
                <li>
                  <strong>Envie uma mensagem!</strong>
                  <p className="text-xs text-muted-foreground ml-5 mt-1">
                    Digite "Olá! Testando minha integração 🚀" e envie
                  </p>
                </li>
              </ol>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900 font-medium mb-2">📚 Próximos Passos:</p>
              <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside ml-2">
                <li>Configure respostas automáticas em <strong>Chatbot</strong></li>
                <li>Adicione respostas rápidas para agilizar o atendimento</li>
                <li>Configure o webhook para receber mensagens dos clientes</li>
                <li>Adicione seu número business real (após aprovação)</li>
              </ul>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-sm text-purple-900 font-medium mb-2">🎓 Documentação Completa:</p>
              <p className="text-xs text-purple-800">
                Para instruções detalhadas, webhooks e troubleshooting,
                consulte o arquivo <code className="bg-white px-1 rounded">STATUS_INTEGRACOES.md</code>
                na raiz do projeto.
              </p>
            </div>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete?.();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-3xl w-full max-h-[90vh] flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {currentStepData.icon && (
                  <div className="bg-purple-100 text-purple-700 rounded-full p-2">
                    {currentStepData.icon}
                  </div>
                )}
                <Badge variant="outline">
                  Passo {currentStep + 1} de {steps.length}
                </Badge>
              </div>
              <CardTitle className="text-xl">{currentStepData.title}</CardTitle>
              {currentStepData.description && (
                <CardDescription className="mt-1">
                  {currentStepData.description}
                </CardDescription>
              )}
            </div>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-6">
          {currentStepData.content}
        </CardContent>

        <div className="border-t p-4 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            ← Anterior
          </Button>

          <div className="flex items-center gap-2">
            {currentStep < steps.length - 1 ? (
              <Button onClick={handleNext}>
                Próximo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleNext} className="bg-green-600 hover:bg-green-700">
                <CheckCheck className="mr-2 h-4 w-4" />
                Concluir Setup
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

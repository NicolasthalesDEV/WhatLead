/**
 * Configuração do tour de onboarding para novos usuários
 * Utiliza driver.js para criar um tour interativo
 */

import { driver, DriveStep, Config } from "driver.js";
import "driver.js/dist/driver.css";

// Configuração padrão do driver
const defaultConfig: Config = {
  showProgress: true,
  showButtons: ["next", "previous", "close"],
  nextBtnText: "Próximo →",
  prevBtnText: "← Anterior",
  doneBtnText: "Concluir ✓",
  progressText: "{{current}} de {{total}}",
  allowClose: true,
  smoothScroll: true,
  animate: true,
  stagePadding: 10,
  stageRadius: 5,
  popoverOffset: 10,
  onDestroyed: () => {
    // Marcar onboarding como concluído
    localStorage.setItem("onboarding-completed", "true");
  },
};

// Etapas do tour de onboarding
export const onboardingSteps: DriveStep[] = [
  {
    popover: {
      title: "🎉 Bem-vindo ao WhatLead!",
      description: `
        <div class="space-y-2">
          <p>Olá! Vamos fazer uma rápida demonstração das principais funcionalidades do seu novo CRM para WhatsApp.</p>
          <p class="text-sm text-muted-foreground">Este tour levará apenas 2 minutos e você pode pular a qualquer momento.</p>
        </div>
      `,
    },
  },
  {
    element: '[href="/dashboard/customers"]',
    popover: {
      title: "💼 Gestão de Hóspedes",
      description: `
        <p>Aqui você gerencia todos os seus hóspedes. Você pode adicionar novos clientes, visualizar histórico de reservas e todas as interações via WhatsApp.</p>
      `,
      side: "right",
      align: "start",
    },
  },
  {
    element: '[href="/dashboard/funnel"]',
    popover: {
      title: "📊 Funil de Vendas",
      description: `
        <p>Organize suas oportunidades de reserva em um funil visual tipo Kanban. Arraste e solte cartões entre as etapas do processo de venda.</p>
      `,
      side: "right",
      align: "start",
    },
  },
  {
    element: '[href="/dashboard/whatsapp"]',
    popover: {
      title: "💬 WhatsApp Business - Centro de Mensagens",
      description: `
        <div class="space-y-2">
          <p><strong>Este é o coração do sistema!</strong> Aqui você:</p>
          <ul class="list-disc list-inside space-y-1 text-sm">
            <li>Vê todas as conversas com clientes</li>
            <li>Envia mensagens de texto, imagens e documentos</li>
            <li>Usa respostas rápidas para agilizar o atendimento</li>
            <li>Acompanha status de entrega (enviado, entregue, lido)</li>
          </ul>
          <p class="text-xs text-muted-foreground mt-2">💡 Dica: Configure seu número do WhatsApp nas Configurações primeiro!</p>
        </div>
      `,
      side: "right",
      align: "start",
    },
  },
  {
    element: '[href="/dashboard/products"]',
    popover: {
      title: "🏨 Quartos e Serviços",
      description: `
        <p>Cadastre seus quartos, pacotes e serviços adicionais. Defina preços, disponibilidade e descrições detalhadas.</p>
      `,
      side: "right",
      align: "start",
    },
  },
  {
    element: '[href="/dashboard/orders"]',
    popover: {
      title: "📅 Reservas",
      description: `
        <p>Gerencie todas as reservas dos seus hóspedes. Controle check-in, check-out, pagamentos e status de cada reserva.</p>
      `,
      side: "right",
      align: "start",
    },
  },
  {
    element: '[href="/dashboard/reports"]',
    popover: {
      title: "📈 Relatórios",
      description: `
        <p>Acompanhe métricas importantes como taxa de conversão, receita, ocupação e desempenho de vendas com gráficos interativos.</p>
      `,
      side: "right",
      align: "start",
    },
  },
  {
    element: '[href="/dashboard/chatbot"]',
    popover: {
      title: "🤖 Chatbot Inteligente",
      description: `
        <p>Configure respostas automáticas, fluxos de atendimento e gatilhos para automatizar seu atendimento no WhatsApp.</p>
      `,
      side: "right",
      align: "start",
    },
  },
  {
    element: ".notification-bell",
    popover: {
      title: "🔔 Notificações",
      description: `
        <p>Receba alertas em tempo real sobre novas mensagens, reservas confirmadas, pagamentos recebidos e muito mais.</p>
      `,
      side: "bottom",
      align: "end",
    },
  },
  {
    element: ".subscription-info",
    popover: {
      title: "⭐ Período de Teste",
      description: `
        <div class="space-y-2">
          <p>Você está no período de teste de 14 dias com acesso completo ao plano Professional!</p>
          <p class="text-sm text-muted-foreground">Aproveite para explorar todas as funcionalidades sem compromisso.</p>
        </div>
      `,
      side: "right",
      align: "start",
    },
  },
  {
    element: '[href="/dashboard/settings"]',
    popover: {
      title: "⚙️ Configurações - Conecte seu WhatsApp",
      description: `
        <div class="space-y-2">
          <p><strong>IMPORTANTE:</strong> Configure suas integrações aqui!</p>
          <ul class="list-disc list-inside space-y-1 text-sm">
            <li><strong>WhatsApp:</strong> Conecte seu número business</li>
            <li><strong>Mercado Pago:</strong> Para receber pagamentos</li>
            <li>Personalize dados da empresa</li>
            <li>Gerencie equipe e usuários</li>
          </ul>
          <p class="text-xs text-muted-foreground mt-2">📖 Veja o guia completo em STATUS_INTEGRACOES.md</p>
        </div>
      `,
      side: "right",
      align: "start",
    },
  },
  {
    popover: {
      title: "✅ Tudo Pronto!",
      description: `
        <div class="space-y-3">
          <p><strong>Você está pronto para começar!</strong></p>
          <p><strong>🚀 Primeiros Passos Recomendados:</strong></p>
          <ol class="list-decimal list-inside space-y-2 text-sm">
            <li><strong>Configure o WhatsApp</strong>
              <ul class="list-disc list-inside ml-4 mt-1 space-y-1 text-xs">
                <li>Vá em Configurações → Integrações</li>
                <li>Siga o guia de configuração do WhatsApp Cloud API</li>
                <li>Teste enviando sua primeira mensagem</li>
              </ul>
            </li>
            <li><strong>Cadastre seus produtos/serviços</strong>
              <ul class="list-disc list-inside ml-4 mt-1 space-y-1 text-xs">
                <li>Adicione quartos, pacotes ou produtos</li>
                <li>Defina preços e descrições</li>
              </ul>
            </li>
            <li><strong>Configure o Mercado Pago</strong> (opcional)
              <ul class="list-disc list-inside ml-4 mt-1 space-y-1 text-xs">
                <li>Para receber pagamentos via PIX e cartão</li>
                <li>Configure assinaturas recorrentes</li>
              </ul>
            </li>
            <li><strong>Adicione seus primeiros clientes</strong>
              <ul class="list-disc list-inside ml-4 mt-1 space-y-1 text-xs">
                <li>Importe ou cadastre manualmente</li>
                <li>Comece a conversar via WhatsApp</li>
              </ul>
            </li>
          </ol>
          <div class="bg-blue-50 border border-blue-200 rounded p-2 mt-3">
            <p class="text-xs text-blue-900">
              <strong>📖 Guia Completo:</strong> Consulte o arquivo <code class="bg-white px-1 rounded">STATUS_INTEGRACOES.md</code> 
              na raiz do projeto para instruções detalhadas de configuração do WhatsApp e Mercado Pago.
            </p>
          </div>
          <p class="text-xs text-muted-foreground mt-3">💡 Para rever este tutorial: Menu do usuário → "Ver Tutorial Novamente"</p>
        </div>
      `,
    },
  },
];

// Criar instância do driver
export function createOnboardingDriver() {
  return driver({
    ...defaultConfig,
    steps: onboardingSteps,
  });
}

// Verificar se o usuário já completou o onboarding
export function hasCompletedOnboarding(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem("onboarding-completed") === "true";
}

// Resetar onboarding (para permitir que o usuário veja novamente)
export function resetOnboarding(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("onboarding-completed");
}

// Marcar onboarding como concluído
export function markOnboardingCompleted(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("onboarding-completed", "true");
}

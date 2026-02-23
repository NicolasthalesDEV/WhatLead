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
          <p>Olá! Vamos fazer uma rápida apresentação das três seções principais da plataforma.</p>
          <p class="text-sm text-muted-foreground">Este tour levará apenas 1 minuto e você pode pular a qualquer momento.</p>
        </div>
      `,
    },
  },
  {
    element: '[href="/dashboard/whatsapp"]',
    popover: {
      title: "💬 WhatsApp — Central de Conversas",
      description: `
        <div class="space-y-2">
          <p><strong>Este é o coração do sistema.</strong> Aqui você:</p>
          <ul class="list-disc list-inside space-y-1 text-sm">
            <li>Visualiza todas as conversas recebidas</li>
            <li>Envia mensagens de texto e áudio</li>
            <li>Acompanha o status de entrega em tempo real</li>
            <li>Inicia novas conversas com qualquer número</li>
          </ul>
          <p class="text-xs text-muted-foreground mt-2">💡 Configure seu número nas Configurações antes de começar.</p>
        </div>
      `,
      side: "right",
      align: "start",
    },
  },
  {
    element: '[href="/dashboard/chatbot"]',
    popover: {
      title: "🤖 Chatbot IA — Atendimento Automático",
      description: `
        <div class="space-y-2">
          <p>Configure seu chatbot para responder automaticamente:</p>
          <ul class="list-disc list-inside space-y-1 text-sm">
            <li>Monte fluxos visuais de atendimento</li>
            <li>Ative respostas com GPT (OpenAI)</li>
            <li>Envie áudios gerados pelo ElevenLabs</li>
            <li>Transcreva áudios recebidos automaticamente</li>
          </ul>
        </div>
      `,
      side: "right",
      align: "start",
    },
  },
  {
    element: '[href="/dashboard/settings"]',
    popover: {
      title: "⚙️ Configurações — Conecte tudo aqui",
      description: `
        <div class="space-y-2">
          <p><strong>Configure suas integrações:</strong></p>
          <ul class="list-disc list-inside space-y-1 text-sm">
            <li><strong>WhatsApp:</strong> Adicione seu número Business API</li>
            <li><strong>OpenAI:</strong> Informe sua chave de API para o chatbot GPT</li>
            <li><strong>ElevenLabs:</strong> Ative respostas em voz</li>
          </ul>
          <p class="text-xs text-muted-foreground mt-2">Comece por aqui antes de qualquer outra coisa.</p>
        </div>
      `,
      side: "right",
      align: "start",
    },
  },
  {
    popover: {
      title: "✅ Tudo certo!",
      description: `
        <div class="space-y-3">
          <p><strong>Você está pronto para começar.</strong></p>
          <p class="text-sm"><strong>🚀 Primeiros passos recomendados:</strong></p>
          <ol class="list-decimal list-inside space-y-1 text-sm">
            <li>Vá em <strong>Configurações</strong> e adicione seu número WhatsApp</li>
            <li>Informe sua chave OpenAI para ativar o chatbot com IA</li>
            <li>Configure o chatbot na seção <strong>Chatbot IA</strong></li>
            <li>Receba sua primeira mensagem no <strong>WhatsApp</strong></li>
          </ol>
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

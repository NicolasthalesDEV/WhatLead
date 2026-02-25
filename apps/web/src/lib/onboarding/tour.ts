/**
 * Configuração do tour de onboarding para novos usuários
 * Utiliza driver.js para criar um tour interativo
 */

import { driver, DriveStep, Config } from "driver.js";
import "driver.js/dist/driver.css";

const defaultConfig: Config = {
  showProgress: true,
  showButtons: ["next", "previous", "close"],
  nextBtnText: "Próximo →",
  prevBtnText: "← Anterior",
  doneBtnText: "Entendido ✓",
  progressText: "{{current}} de {{total}}",
  allowClose: true,
  smoothScroll: true,
  animate: true,
  stagePadding: 10,
  stageRadius: 5,
  popoverOffset: 10,
  onDestroyed: () => {
    localStorage.setItem("onboarding-completed", "true");
  },
};

export const onboardingSteps: DriveStep[] = [
  // ── 1. Boas-vindas
  {
    popover: {
      title: "👋 Bem-vindo ao WhatLead!",
      description: `
        <div style="line-height:1.6">
          <p>O WhatLead conecta seu <strong>WhatsApp Business</strong> a um chatbot com inteligência artificial que atende, responde e automatiza seu atendimento 24 h por dia.</p>
          <p style="margin-top:8px;font-size:13px;color:#6b7280">Este tour rápido mostra como tudo funciona. Você pode fechar a qualquer momento e rever pelo menu do usuário.</p>
        </div>
      `,
    },
  },

  // ── 2. WhatsApp
  {
    element: '[href="/dashboard/whatsapp"]',
    popover: {
      title: "💬 WhatsApp — Suas Conversas",
      description: `
        <div style="line-height:1.6">
          <p>Aqui ficam <strong>todas as mensagens</strong> recebidas no seu número WhatsApp Business.</p>
          <ul style="margin-top:8px;padding-left:16px;font-size:13px">
            <li>Veja cada conversa em tempo real</li>
            <li>Responda manualmente quando quiser</li>
            <li>O chatbot responde automaticamente enquanto você está fora</li>
          </ul>
          <p style="margin-top:8px;font-size:12px;color:#6b7280">⚠️ Antes de receber mensagens você precisa conectar seu número em <strong>Configurações</strong>.</p>
        </div>
      `,
      side: "right",
      align: "start",
    },
  },

  // ── 3. Chatbot
  {
    element: '[href="/dashboard/chatbot"]',
    popover: {
      title: "🤖 Chatbot — Atendimento Automático",
      description: `
        <div style="line-height:1.6">
          <p>Crie <strong>fluxos visuais</strong> de atendimento: arraste e conecte blocos para definir o que o chatbot faz em cada situação.</p>
          <ul style="margin-top:8px;padding-left:16px;font-size:13px">
            <li><strong>Palavras-chave (gatilhos):</strong> ex.: "oi", "preço" — ativam um fluxo</li>
            <li><strong>Nós de mensagem:</strong> enviam texto automaticamente</li>
            <li><strong>Nó IA (GPT-4o):</strong> o chatbot responde com inteligência artificial</li>
            <li><strong>Horário de atendimento:</strong> avisa quando a empresa está fechada</li>
          </ul>
        </div>
      `,
      side: "right",
      align: "start",
    },
  },

  // ── 4. Configurações
  {
    element: '[href="/dashboard/settings"]',
    popover: {
      title: "⚙️ Configurações — Comece por aqui",
      description: `
        <div style="line-height:1.6">
          <p>Antes de tudo, configure suas integrações:</p>
          <ul style="margin-top:8px;padding-left:16px;font-size:13px">
            <li><strong>WhatsApp Business API:</strong> cole seu token e ID de número</li>
            <li><strong>OpenAI (opcional):</strong> chave para ativar respostas com IA</li>
            <li><strong>ElevenLabs (opcional):</strong> ativa respostas em voz geradas por IA</li>
          </ul>
          <p style="margin-top:8px;font-size:12px;color:#6b7280">Você também gerencia perfil, senha e plano de assinatura aqui.</p>
        </div>
      `,
      side: "right",
      align: "start",
    },
  },

  // ── 5. Como tudo se conecta
  {
    popover: {
      title: "🔄 Como tudo se conecta",
      description: `
        <div style="line-height:1.6">
          <p style="font-size:13px"><strong>O ciclo de atendimento automático é simples:</strong></p>
          <ol style="margin-top:8px;padding-left:16px;font-size:13px;line-height:2">
            <li>Cliente envia mensagem no WhatsApp</li>
            <li>O sistema verifica se existe um fluxo com aquela <strong>palavra-chave</strong></li>
            <li>Se sim, executa o fluxo — envia textos, aguarda respostas, aciona IA</li>
            <li>Se não houver fluxo, a mensagem chega no painel para você responder</li>
          </ol>
          <p style="margin-top:8px;font-size:12px;color:#6b7280">💡 Fora do horário configurado, o chatbot envia automaticamente a mensagem de "empresa fechada".</p>
        </div>
      `,
    },
  },

  // ── 6. Pronto
  {
    popover: {
      title: "✅ Pronto para começar!",
      description: `
        <div style="line-height:1.6">
          <p><strong>Siga estes 3 passos para ativar seu atendimento automático:</strong></p>
          <ol style="margin-top:8px;padding-left:16px;font-size:13px;line-height:2.2">
            <li>📱 <strong>Configurações → WhatsApp:</strong> conecte seu número</li>
            <li>🤖 <strong>Chatbot:</strong> crie um fluxo com palavra-chave "oi"</li>
            <li>💬 <strong>WhatsApp:</strong> envie "oi" para seu número e veja a mágica!</li>
          </ol>
          <p style="margin-top:10px;font-size:12px;color:#6b7280">🔁 Para rever este tutorial: menu do usuário → <strong>"Ver Tutorial Novamente"</strong></p>
        </div>
      `,
    },
  },
];

export function createOnboardingDriver() {
  return driver({
    ...defaultConfig,
    steps: onboardingSteps,
  });
}

export function hasCompletedOnboarding(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem("onboarding-completed") === "true";
}

export function resetOnboarding(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("onboarding-completed");
}

export function markOnboardingCompleted(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("onboarding-completed", "true");
}

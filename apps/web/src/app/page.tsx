"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MessageSquare,
  Bot,
  Zap,
  CheckCircle2,
  ArrowRight,
  Mic,
  Volume2,
  Sparkles,
  Clock,
  Shield,
} from "lucide-react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (response.ok) {
          router.push("/dashboard");
        } else {
          localStorage.removeItem("token");
        }
      } catch {
        localStorage.removeItem("token");
      }
    };

    validateToken();
  }, [router]);

  const features = [
    {
      icon: MessageSquare,
      title: "WhatsApp Business API",
      description:
        "Conecte seu número ao WhatsApp oficial e gerencie todas as conversas em um único lugar, com histórico completo.",
    },
    {
      icon: Bot,
      title: "Chatbot com Inteligência Artificial",
      description:
        "Configure fluxos automáticos de atendimento ou use GPT para responder mensagens de forma inteligente, 24 horas por dia.",
    },
    {
      icon: Volume2,
      title: "Respostas em Áudio",
      description:
        "Envie mensagens de voz geradas automaticamente via ElevenLabs — seu chatbot fala com a voz que você escolher.",
    },
    {
      icon: Mic,
      title: "Transcrição de Áudios",
      description:
        "Áudios recebidos dos clientes são transcritos automaticamente via Whisper e processados pelo chatbot.",
    },
    {
      icon: Clock,
      title: "Atendimento 24/7",
      description:
        "Defina horários de funcionamento, mensagens de fora do expediente e transfira para um atendente humano quando necessário.",
    },
    {
      icon: Shield,
      title: "Multi-tenant Seguro",
      description:
        "Cada empresa tem seus próprios dados, credenciais e número de WhatsApp — totalmente isolados e seguros.",
    },
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Conecte seu WhatsApp",
      description:
        "Adicione seu número WhatsApp Business API nas configurações e comece a receber mensagens em minutos.",
    },
    {
      step: "2",
      title: "Configure o Chatbot",
      description:
        "Monte fluxos de atendimento com o editor visual ou ative o modo IA para respostas automáticas com GPT.",
    },
    {
      step: "3",
      title: "Ative a Voz (opcional)",
      description:
        "Conecte sua chave ElevenLabs e escolha uma voz — o chatbot passa a responder também com mensagens de áudio.",
    },
    {
      step: "4",
      title: "Acompanhe as conversas",
      description:
        "Visualize todas as conversas em tempo real e assuma o atendimento manualmente quando quiser.",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg p-2">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                WhatLead
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => {
                  document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Preços
              </Button>
              <Button onClick={() => router.push("/login")}>Entrar</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-blue-50 to-white">
        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-purple-900 to-blue-900 bg-clip-text text-transparent leading-tight">
              Atendimento automático no WhatsApp com IA
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Configure um chatbot inteligente com GPT, respostas em voz via ElevenLabs e
              transcrição de áudios — tudo integrado ao WhatsApp Business API.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button
                size="lg"
                className="text-lg px-8 py-6"
                onClick={() => router.push("/register")}
              >
                Criar Conta
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6"
                onClick={() => router.push("/login")}
              >
                Fazer Login
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              ✓ Sem cartão de crédito ✓ Configuração em minutos ✓ Suporte em português
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">O que o WhatLead oferece</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Uma plataforma focada em automação de atendimento no WhatsApp com recursos de IA
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-2 hover:border-purple-200 transition-all hover:shadow-lg"
              >
                <CardHeader>
                  <div className="mb-4 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl p-4 w-14 h-14 flex items-center justify-center">
                    <feature.icon className="h-7 w-7 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Como funciona</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Em poucos passos seu atendimento automático no WhatsApp já está funcionando
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="grid gap-8 md:grid-cols-2">
              {howItWorks.map((item, index) => (
                <Card key={index} className="relative border-2 hover:shadow-xl transition-all">
                  <div className="absolute -top-5 -left-5 bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold shadow-lg">
                    {item.step}
                  </div>
                  <CardHeader className="pt-6">
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Planos</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Escolha o plano que melhor se encaixa no seu negócio
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            {/* Starter */}
            <Card className="border-2 border-gray-200 hover:shadow-xl transition-all">
              <CardHeader className="text-center pb-6 pt-8">
                <CardTitle className="text-2xl mb-2">Starter</CardTitle>
                <div className="mb-3">
                  <span className="text-4xl font-bold">R$ 97</span>
                  <span className="text-gray-600">/mês</span>
                </div>
                <CardDescription>Para começar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3 mb-6">
                  {[
                    "1 número WhatsApp",
                    "Chatbot com fluxos",
                    "Até 1.000 conversas/mês",
                    "Histórico de mensagens",
                    "Suporte por email",
                  ].map((f, i) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full py-6"
                  variant="outline"
                  onClick={() => router.push("/register?plan=starter")}
                >
                  Começar
                </Button>
              </CardContent>
            </Card>

            {/* Professional */}
            <Card className="border-2 border-purple-600 shadow-xl scale-105 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-semibold px-4 py-1 rounded-full flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Mais Popular
                </div>
              </div>
              <CardHeader className="text-center pb-6 pt-8">
                <CardTitle className="text-2xl mb-2">Professional</CardTitle>
                <div className="mb-3">
                  <span className="text-4xl font-bold">R$ 197</span>
                  <span className="text-gray-600">/mês</span>
                </div>
                <CardDescription>Para negócios em crescimento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3 mb-6">
                  {[
                    "1 número WhatsApp",
                    "Chatbot com IA (GPT)",
                    "Respostas em voz (ElevenLabs)",
                    "Transcrição de áudios",
                    "Conversas ilimitadas",
                    "Suporte prioritário",
                  ].map((f, i) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full py-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  onClick={() => router.push("/register?plan=professional")}
                >
                  Começar Agora
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise */}
            <Card className="border-2 border-gray-200 hover:shadow-xl transition-all">
              <CardHeader className="text-center pb-6 pt-8">
                <CardTitle className="text-2xl mb-2">Enterprise</CardTitle>
                <div className="mb-3">
                  <span className="text-4xl font-bold">R$ 497</span>
                  <span className="text-gray-600">/mês</span>
                </div>
                <CardDescription>Para grandes operações</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3 mb-6">
                  {[
                    "Múltiplos números WhatsApp",
                    "Chatbot com IA avançada",
                    "Respostas em voz",
                    "Conversas ilimitadas",
                    "API dedicada",
                    "Suporte dedicado",
                  ].map((f, i) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full py-6"
                  variant="outline"
                  onClick={() => router.push("/register?plan=enterprise")}
                >
                  Falar com a Equipe
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-purple-600 to-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Pronto para automatizar seu atendimento?
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
            Crie sua conta e configure seu chatbot no WhatsApp em minutos.
          </p>
          <Button
            size="lg"
            className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-6"
            onClick={() => router.push("/register")}
          >
            Criar Conta
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm opacity-90 mt-6">
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Sem cartão de crédito
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Configuração simples
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Cancele quando quiser
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-900 text-gray-400">
        <div className="container mx-auto px-4 py-12">
          <div className="grid gap-8 md:grid-cols-4 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg p-2">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">WhatLead</span>
              </div>
              <p className="text-sm">
                Automação de atendimento no WhatsApp com inteligência artificial.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-3">Produto</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#how-it-works" className="hover:text-white transition">
                    Como funciona
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-white transition">
                    Preços
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-3">Empresa</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Sobre
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Contato
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-3">Suporte</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Central de Ajuda
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Documentação
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2026 WhatLead. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

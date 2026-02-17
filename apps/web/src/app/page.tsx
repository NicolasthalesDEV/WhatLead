"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Users,
  ShoppingCart,
  TrendingUp,
  Bot,
  Zap,
  Shield,
  BarChart3,
  Clock,
  CheckCircle2,
  ArrowRight,
  Star,
  Hotel,
  CalendarCheck,
  CreditCard,
  Sparkles
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
      } catch (error) {
        localStorage.removeItem("token");
      }
    };

    validateToken();
  }, [router]);

  const features = [
    {
      icon: MessageSquare,
      title: "WhatsApp Business API",
      description: "Conecte sua empresa ao WhatsApp oficial e atenda milhares de clientes simultaneamente"
    },
    {
      icon: Bot,
      title: "Chatbot com IA",
      description: "Atendimento automático 24/7 que aprende com suas conversas e resolve 80% das dúvidas"
    },
    {
      icon: Users,
      title: "CRM Completo",
      description: "Gestão completa de clientes, histórico de conversas e segmentação avançada"
    },
    {
      icon: ShoppingCart,
      title: "Vendas no WhatsApp",
      description: "Catálogo de produtos, carrinho, checkout e pagamento PIX direto no chat"
    },
    {
      icon: BarChart3,
      title: "Relatórios em Tempo Real",
      description: "Métricas de vendas, conversão, atendimento e ROI atualizadas automaticamente"
    },
    {
      icon: Zap,
      title: "Automações Inteligentes",
      description: "Fluxos de atendimento, follow-up automático e recuperação de carrinhos"
    }
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Conecte seu WhatsApp",
      description: "Em 5 minutos você conecta seu número ao WhatsApp Business API oficial"
    },
    {
      step: "2",
      title: "Configure o Chatbot",
      description: "Use nossos templates prontos ou crie fluxos personalizados de atendimento"
    },
    {
      step: "3",
      title: "Adicione seus Produtos",
      description: "Importe seu catálogo ou adicione produtos manualmente com fotos e preços"
    },
    {
      step: "4",
      title: "Comece a Vender",
      description: "Seus clientes compram direto no WhatsApp e pagam com PIX instantâneo"
    }
  ];

  const pricing = [
    {
      id: "starter",
      name: "Starter",
      price: "R$ 97",
      period: "/mês",
      description: "Ideal para pequenos negócios",
      features: [
        "Até 1.000 conversas/mês",
        "1 atendente",
        "Chatbot básico",
        "Catálogo de produtos",
        "Pagamentos PIX",
        "Relatórios básicos",
        "Suporte por email"
      ],
      recommended: false,
      cta: "Começar Grátis"
    },
    {
      id: "professional",
      name: "Professional",
      price: "R$ 297",
      period: "/mês",
      description: "Para empresas em crescimento",
      features: [
        "Até 5.000 conversas/mês",
        "5 atendentes",
        "Chatbot com IA avançada",
        "Automações ilimitadas",
        "Múltiplos produtos",
        "Relatórios completos",
        "Integrações (Zapier, etc)",
        "Suporte prioritário 24/7"
      ],
      recommended: true,
      cta: "Teste Grátis por 14 Dias"
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "R$ 897",
      period: "/mês",
      description: "Solução completa para grandes operações",
      features: [
        "Conversas ilimitadas",
        "Atendentes ilimitados",
        "IA personalizada para seu negócio",
        "White label (sua marca)",
        "API dedicada",
        "Gerente de sucesso dedicado",
        "Onboarding personalizado",
        "SLA de 99.9% uptime"
      ],
      recommended: false,
      cta: "Falar com Consultor"
    }
  ];

  const testimonials = [
    {
      name: "Maria Silva",
      role: "Dona da boutique Elegância",
      content: "Aumentei minhas vendas em 340% no primeiro mês usando o WACRM. O chatbot responde na hora e os clientes adoram comprar direto no WhatsApp!",
      stars: 5
    },
    {
      name: "João Santos",
      role: "Gerente de hotel",
      content: "Automatizamos 90% do atendimento. O sistema gerencia reservas, confirmações e check-in sozinho. Economizamos 3 funcionários.",
      stars: 5
    },
    {
      name: "Ana Costa",
      role: "E-commerce de cosméticos",
      content: "O melhor investimento que fiz. Recupero carrinhos abandonados automaticamente e converto 60% deles em vendas.",
      stars: 5
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg p-2">
                <Hotel className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                HotelCRM
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => {
                document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
              }}>
                Preços
              </Button>
              <Button onClick={() => router.push("/login")}>
                Entrar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-blue-50 to-white">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 px-4 py-1" variant="outline">
              <Sparkles className="h-3 w-3 mr-1" />
              Mais de 5.000 empresas já utilizam
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-purple-900 to-blue-900 bg-clip-text text-transparent">
              Venda Mais no WhatsApp com Automação Total
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Transforme seu WhatsApp em uma máquina de vendas com chatbot IA,
              atendimento automático 24/7 e checkout completo.
              <span className="font-semibold text-purple-600"> Aumente suas vendas em até 340%</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button size="lg" className="text-lg px-8 py-6" onClick={() => router.push("/register")}>
                Testar Grátis por 14 Dias
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6" onClick={() => {
                document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
              }}>
                Ver Planos e Preços
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              ✓ Sem cartão de crédito ✓ Cancele quando quiser ✓ Suporte em português
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Tudo que você precisa para vender no WhatsApp
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Uma plataforma completa com todas as ferramentas para gerenciar vendas,
              atendimento e relacionamento com clientes
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 hover:border-purple-200 transition-all hover:shadow-lg">
                <CardHeader>
                  <div className="mb-4 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl p-4 w-16 h-16 flex items-center justify-center">
                    <feature.icon className="h-8 w-8 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
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
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Como funciona? É simples
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Em menos de 30 minutos você está vendendo no WhatsApp
            </p>
          </div>
          <div className="max-w-5xl mx-auto">
            <div className="grid gap-8 md:grid-cols-2">
              {howItWorks.map((item, index) => (
                <Card key={index} className="relative border-2 hover:shadow-xl transition-all">
                  <div className="absolute -top-6 -left-6 bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-2xl font-bold shadow-lg">
                    {item.step}
                  </div>
                  <CardHeader className="pt-8">
                    <CardTitle className="text-2xl">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg text-gray-600">{item.description}</p>
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
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Escolha o plano ideal para seu negócio
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Todos os planos incluem 14 dias grátis. Sem compromisso, cancele quando quiser
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3 max-w-7xl mx-auto">
            {pricing.map((plan, index) => (
              <Card
                key={index}
                className={`relative border-2 hover:shadow-2xl transition-all ${plan.recommended
                    ? 'border-purple-600 shadow-xl scale-105'
                    : 'border-gray-200'
                  }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1">
                      <Star className="h-3 w-3 mr-1" />
                      Mais Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-8 pt-8">
                  <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                  <div className="mb-4">
                    <span className="text-5xl font-bold">{plan.price}</span>
                    <span className="text-xl text-gray-600">{plan.period}</span>
                  </div>
                  <CardDescription className="text-base">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full text-lg py-6 ${plan.recommended
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                        : ''
                      }`}
                    variant={plan.recommended ? 'default' : 'outline'}
                    onClick={() => router.push(`/checkout?plan=${plan.id}`)}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              O que nossos clientes dizem
            </h2>
            <p className="text-xl text-gray-600">
              Resultados reais de quem já transformou o negócio com o HotelCRM
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3 max-w-7xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-2 hover:shadow-xl transition-all">
                <CardHeader>
                  <div className="flex mb-2">
                    {[...Array(testimonial.stars)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <CardDescription className="text-base text-gray-700 italic">
                    "{testimonial.content}"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-purple-600 to-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Pronto para transformar suas vendas no WhatsApp?
          </h2>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
            Junte-se a mais de 5.000 empresas que já vendem mais usando nossa plataforma
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button
              size="lg"
              className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-6"
              onClick={() => router.push("/register")}
            >
              Testar Grátis por 14 Dias
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6"
              onClick={() => {
                router.push("/");
                setTimeout(() => {
                  document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
            >
              Ver Planos Pagos
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm opacity-90">
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 mr-2" />
              14 dias grátis
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Sem cartão de crédito
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
                  <Hotel className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">HotelCRM</span>
              </div>
              <p className="text-sm">
                A plataforma completa para gerenciar seu negócio no WhatsApp
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-3">Produto</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Funcionalidades</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Preços</a></li>
                <li><a href="#" className="hover:text-white transition">Integrações</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-3">Empresa</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Sobre</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Contato</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-3">Suporte</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-white transition">Documentação</a></li>
                <li><a href="#" className="hover:text-white transition">Status</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2026 HotelCRM. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

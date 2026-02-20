"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Lock,
  CheckCircle2,
  ArrowLeft,
  Hotel,
  Loader2
} from "lucide-react";

const plans = {
  starter: {
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
      "Relatórios básicos"
    ]
  },
  professional: {
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
    ]
  },
  enterprise: {
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
    ]
  }
};

export default function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan") || "professional";
  const plan = plans[planId as keyof typeof plans] || plans.professional;

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    billingCycle: "monthly" as "monthly" | "yearly",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError("");

    try {
      // Primeiro, tentar criar assinatura (requer autenticação)
      // Se não estiver logado, redirecionar para registro com dados do plano
      const response = await fetch('/api/billing/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          planId,
          billingCycle: formData.billingCycle,
          payerEmail: formData.email,
        }),
      });

      if (response.status === 401) {
        // Não autenticado - redirecionar para registro primeiro
        router.push(`/register?plan=${planId}&email=${encodeURIComponent(formData.email)}&billing_cycle=${formData.billingCycle}`);
        return;
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar assinatura');
      }

      const data = await response.json();

      // Redirecionar para página de pagamento do Mercado Pago
      if (data.initPoint) {
        window.location.href = data.initPoint;
      } else {
        throw new Error('Link de pagamento não disponível');
      }

    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Erro ao processar checkout. Tente novamente.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg p-3">
              <Hotel className="h-8 w-8 text-white" />
            </div>
            <span className="ml-3 text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              HotelCRM
            </span>
          </div>
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Resumo do Pedido */}
          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
                <CardDescription>Você escolheu o plano {plan.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-xl text-gray-600">{plan.period}</span>
                  </div>
                  <p className="text-gray-600">{plan.description}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">O que está incluído:</h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t pt-4">
                  <Badge variant="outline" className="mb-3">
                    <Lock className="h-3 w-3 mr-1" />
                    14 dias grátis
                  </Badge>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>✓ Teste grátis por 14 dias</p>
                    <p>✓ Cancele quando quiser</p>
                    <p>✓ Cobrança apenas após o período de teste</p>
                    <p>✓ Suporte completo durante o teste</p>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-purple-900 mb-2">
                    Total hoje: R$ 0,00
                  </p>
                  <p className="text-xs text-purple-700">
                    Você só será cobrado após 14 dias de teste gratuito
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Formulário de Pagamento */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Dados de Pagamento
                </CardTitle>
                <CardDescription>
                  Preencha seus dados para iniciar o período de teste gratuito
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Usaremos este email para enviar detalhes da assinatura
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Ciclo de Cobrança *</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        className={`p-4 border-2 rounded-lg text-left transition-all ${formData.billingCycle === 'monthly'
                            ? 'border-purple-600 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                          }`}
                        onClick={() => setFormData(prev => ({ ...prev, billingCycle: 'monthly' }))}
                      >
                        <div className="font-semibold">Mensal</div>
                        <div className="text-sm text-gray-600 mt-1">{plan.price}</div>
                      </button>
                      <button
                        type="button"
                        className={`p-4 border-2 rounded-lg text-left transition-all ${formData.billingCycle === 'yearly'
                            ? 'border-purple-600 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                          }`}
                        onClick={() => setFormData(prev => ({ ...prev, billingCycle: 'yearly' }))}
                      >
                        <div className="font-semibold">Anual</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {planId === 'starter' ? 'R$ 970' : planId === 'professional' ? 'R$ 1970' : 'R$ 4970'}
                        </div>
                        <Badge className="mt-2" variant="secondary">2 meses grátis</Badge>
                      </button>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm">
                    <div className="flex items-start gap-2">
                      <CreditCard className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-blue-900">
                        <p className="font-semibold mb-1">Pagamento via Mercado Pago</p>
                        <p className="text-xs text-blue-700">
                          Na próxima etapa, você será redirecionado para o Mercado Pago para
                          finalizar o pagamento de forma segura. Aceita cartão de crédito e PIX.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
                    <div className="flex items-start gap-2">
                      <Lock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold mb-1">Pagamento 100% seguro</p>
                        <p className="text-xs">
                          Processado pelo Mercado Pago com criptografia de ponta a ponta.
                          Seus dados estão protegidos.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full text-lg py-6"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        Continuar para Pagamento
                        <ArrowLeft className="ml-2 h-5 w-5 rotate-180" />
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-gray-500">
                    Ao continuar, você concorda com nossos{" "}
                    <a href="#" className="text-purple-600 hover:underline">Termos de Serviço</a>
                    {" "}e{" "}
                    <a href="#" className="text-purple-600 hover:underline">Política de Privacidade</a>
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

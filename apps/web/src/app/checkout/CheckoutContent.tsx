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
  const [formData, setFormData] = useState({
    cardNumber: "",
    cardName: "",
    expiryDate: "",
    cvv: "",
    cpf: "",
    email: "",
    phone: ""
  });

  const handleInputChange = (field: string, value: string) => {
    let maskedValue = value;
    
    if (field === "cardNumber") {
      // Remove não-dígitos, limita a 16 dígitos, adiciona espaços a cada 4 dígitos
      const digitsOnly = value.replace(/\D/g, "").slice(0, 16);
      maskedValue = digitsOnly.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
    } else if (field === "expiryDate") {
      maskedValue = value.replace(/\D/g, "").replace(/(\d{2})(\d)/, "$1/$2").slice(0, 5);
    } else if (field === "cvv") {
      maskedValue = value.replace(/\D/g, "").slice(0, 4);
    } else if (field === "cpf") {
      maskedValue = value.replace(/\D/g, "").replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4").slice(0, 14);
    } else if (field === "phone") {
      maskedValue = value.replace(/\D/g, "").replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3").slice(0, 15);
    }

    setFormData(prev => ({ ...prev, [field]: maskedValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simular processamento de pagamento
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Redirecionar para página de registro com dados do plano
    router.push(`/register?plan=${planId}&email=${encodeURIComponent(formData.email)}&success=true`);
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
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone/WhatsApp *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input
                      id="cpf"
                      type="text"
                      placeholder="000.000.000-00"
                      value={formData.cpf}
                      onChange={(e) => handleInputChange("cpf", e.target.value)}
                      required
                    />
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-4">Dados do Cartão</h4>
                    
                    <div className="space-y-2 mb-4">
                      <Label htmlFor="cardNumber">Número do Cartão *</Label>
                      <Input
                        id="cardNumber"
                        type="text"
                        placeholder="0000 0000 0000 0000"
                        value={formData.cardNumber}
                        onChange={(e) => handleInputChange("cardNumber", e.target.value)}
                        maxLength={19}
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">16 dígitos</p>
                    </div>

                    <div className="space-y-2 mb-4">
                      <Label htmlFor="cardName">Nome no Cartão *</Label>
                      <Input
                        id="cardName"
                        type="text"
                        placeholder="Nome como está no cartão"
                        value={formData.cardName}
                        onChange={(e) => handleInputChange("cardName", e.target.value)}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiryDate">Validade *</Label>
                        <Input
                          id="expiryDate"
                          type="text"
                          placeholder="MM/AA"
                          value={formData.expiryDate}
                          onChange={(e) => handleInputChange("expiryDate", e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cvv">CVV *</Label>
                        <Input
                          id="cvv"
                          type="text"
                          placeholder="123"
                          value={formData.cvv}
                          onChange={(e) => handleInputChange("cvv", e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
                    <div className="flex items-start gap-2">
                      <Lock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold mb-1">Pagamento 100% seguro</p>
                        <p className="text-xs">
                          Seus dados são criptografados e protegidos. Não armazenamos 
                          informações do cartão em nossos servidores.
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
                        Iniciar Teste Gratuito
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

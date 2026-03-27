"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Loader2, CheckCircle2, Sparkles, ArrowLeft } from "lucide-react";

const plans = {
  starter: { name: "Starter", price: "R$ 97/mês" },
  professional: { name: "Professional", price: "R$ 197/mês" },
  enterprise: { name: "Enterprise", price: "R$ 497/mês" }
};

export default function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan") || "professional";
  const emailFromCheckout = searchParams.get("email") || "";
  const isFromCheckout = searchParams.get("success") === "true";
  const billingCycle = searchParams.get("billing_cycle") || "monthly";
  const hasNoPlanSelected = !searchParams.get("plan");

  const plan = plans[planId as keyof typeof plans] || plans.professional;

  const [formData, setFormData] = useState({
    email: emailFromCheckout,
    password: "",
    confirmPassword: "",
    name: "",
    company: "",
    phone: ""
  });
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    if (formData.password !== formData.confirmPassword) {
      setMessage("As senhas não coincidem");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setMessage("A senha deve ter pelo menos 6 caracteres");
      setIsLoading(false);
      return;
    }

    try {
      const payload = JSON.stringify({
        email: formData.email,
        password: formData.password,
        company: formData.company || `${formData.name}'s Business`,
        slug: formData.company.toLowerCase().replace(/[^a-z0-9]/g, "-") || `user-${Date.now()}`,
        name: formData.name,
        phone: formData.phone,
        plan: hasNoPlanSelected ? "free_trial" : planId
      });

      const candidates = [
        "/api/auth/register",
        "/api/auth/register/",
        "/api/public/register",
        "/api/public/register/",
      ];
      if (typeof window !== "undefined") {
        candidates.push(`${window.location.origin}/api/auth/register`);
        candidates.push(`${window.location.origin}/api/public/register`);
      }

      let res: Response | null = null;
      const attempts: Array<{ url: string; status: number; allow: string | null }> = [];
      for (let i = 0; i < candidates.length; i++) {
        const current = await fetchApi(candidates[i], {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
        });

        attempts.push({
          url: candidates[i],
          status: current.status,
          allow: current.headers.get("allow"),
        });

        res = current;
        if (current.status !== 405) {
          break;
        }
      }

      if (!res) {
        throw new Error("No response from register endpoint");
      }

      const raw = await res.text();
      let data: any = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        data = null;
      }

      if (res.ok) {
        if (!hasNoPlanSelected) {
          router.push(`/login?registered=true&plan=${planId}&billing_cycle=${billingCycle}&email=${encodeURIComponent(formData.email)}`);
        } else {
          router.push("/login?registered=true");
        }
      } else {
        const requestId = data?.meta?.requestId || res.headers.get("x-request-id");
        const errorCode = data?.error?.code;

        if (res.status === 405) {
          const lastAttempt = attempts[attempts.length - 1];
          console.error("Register endpoint returned 405", {
            attempts,
            responseAllow: res.headers.get("allow"),
            requestId,
            errorCode,
            responseBody: data,
            finalAttemptedUrl: lastAttempt?.url,
          });

          const diag = requestId ? ` (ID: ${requestId})` : "";
          const code = errorCode ? ` [${errorCode}]` : "";
          const attempted = lastAttempt?.url ? ` URL: ${lastAttempt.url}` : "";
          setMessage(`Cadastro bloqueado por método inválido (HTTP 405)${code}${diag}${attempted}`);
          return;
        }

        const message = data?.error?.message || `Erro ao criar conta (HTTP ${res.status})`;
        const code = errorCode ? ` [${errorCode}]` : "";
        const diag = requestId ? ` (ID: ${requestId})` : "";
        setMessage(`${message}${code}${diag}`);
      }
    } catch (error) {
      setMessage("Erro de conexão. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white">
      {/* Header/Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => router.push("/")}>
              <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg p-2">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                WhatLead
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Voltar</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push("/login")}>
                <span className="hidden sm:inline">Fazer Login</span>
                <span className="sm:hidden">Login</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center p-4 py-6 sm:py-12">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg p-3">
                <Zap className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-blue-900 bg-clip-text text-transparent">
              {hasNoPlanSelected ? "Teste Grátis por 14 Dias" : "Criar sua Conta"}
            </h1>
            <p className="text-gray-600 mt-2">
              {hasNoPlanSelected
                ? "Experimente todas as funcionalidades gratuitamente"
                : "Complete seu cadastro para começar"}
            </p>
          </div>

          {hasNoPlanSelected && (
            <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-900 mb-1">✨ Teste Grátis - Sem Cartão de Crédito</p>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• <strong>14 dias grátis</strong> com acesso completo</li>
                    <li>• Após 14 dias, você pode escolher um plano ou sua conta será pausada</li>
                    <li>• Cancele a qualquer momento, sem compromisso</li>
                  </ul>
                  <p className="text-xs text-green-700 mt-2">
                    💡 Dica: Quer ainda mais recursos?{" "}
                    <button
                      onClick={() => {
                        router.push("/");
                        setTimeout(() => {
                          document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                      }}
                      className="text-green-600 hover:underline font-semibold"
                    >
                      Veja nossos planos pagos
                    </button>
                  </p>
                </div>
              </div>
            </div>
          )}

          {isFromCheckout && (
            <div className="mb-6">
              <Badge className="w-full justify-center py-2 bg-green-100 text-green-800 hover:bg-green-100">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Pagamento confirmado! Plano {plan.name} - {plan.price}
              </Badge>
            </div>
          )}

          <Card className="shadow-lg border-2">
            <CardHeader>
              <CardTitle className="text-2xl">Seus Dados</CardTitle>
              <CardDescription>
                Preencha as informações abaixo para acessar sua conta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome completo"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                    disabled={!!emailFromCheckout}
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
                  <Label htmlFor="company">Nome da Empresa *</Label>
                  <Input
                    id="company"
                    type="text"
                    placeholder="Sua empresa"
                    value={formData.company}
                    onChange={(e) => handleInputChange("company", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Digite a senha novamente"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    required
                  />
                </div>

                {message && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {message}
                  </div>
                )}

                <div className="bg-purple-50 p-4 rounded-lg space-y-2 text-sm">
                  <p className="font-semibold text-purple-900 flex items-center">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Ao criar sua conta você recebe:
                  </p>
                  <ul className="space-y-1 text-purple-800 ml-6">
                    <li>✓ 14 dias de teste grátis</li>
                    <li>✓ Acesso completo a todas as funcionalidades</li>
                    <li>✓ Suporte dedicado em português</li>
                    <li>✓ Sem cobrança durante o período de teste</li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg py-6"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    "Criar Minha Conta"
                  )}
                </Button>

                <p className="text-center text-sm text-gray-600">
                  Já tem uma conta?{" "}
                  <button
                    type="button"
                    onClick={() => router.push("/login")}
                    className="text-purple-600 hover:underline font-medium"
                  >
                    Fazer login
                  </button>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-gray-900 text-gray-400 mt-16">
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
                A plataforma completa para gerenciar seu negócio no WhatsApp
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-3">Produto</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Funcionalidades</a></li>
                <li><a href="/#pricing" className="hover:text-white transition">Preços</a></li>
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
            <p>&copy; 2026 WhatLead. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

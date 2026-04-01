"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";

function LoginPageContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRegistered = searchParams.get("registered") === "true";
  const pendingPlan = searchParams.get("plan");
  const pendingBillingCycle = searchParams.get("billing_cycle");
  const pendingEmail = searchParams.get("email");

  useEffect(() => {
    if (pendingEmail) setEmail(pendingEmail);
  }, [pendingEmail]);

  useEffect(() => {
    // Se já estiver autenticado, redirecionar para dashboard
    // Não redirecionar se vier de um logout (localStorage vazio)
    const checkAuth = async () => {
      try {
        const cached = typeof window !== "undefined" ? localStorage.getItem("user-data") : null;
        if (!cached) return; // veio de logout ou sessão nova — não redirecionar

        const response = await fetch("/api/user/profile", {
          credentials: "include",
        });

        if (response.ok) {
          router.push("/dashboard");
        }
      } catch (error) {
        // Ignorar erros
      }
    };

    checkAuth();
  }, [router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const res = await fetchApi("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Importante para cookies
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        // Login bem-sucedido - cookies já foram configurados pelo servidor
        // Se veio do checkout, voltar para lá; senão, dashboard
        setTimeout(() => {
          if (pendingPlan) {
            router.push(`/checkout?plan=${pendingPlan}&billing_cycle=${pendingBillingCycle || 'monthly'}`);
          } else {
            router.push("/dashboard");
          }
        }, 100);
      } else {
        setMessage(data?.error?.message || "Erro no login");
      }
    } catch (error) {
      setMessage("Erro de conexão");
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
              <Button variant="outline" size="sm" onClick={() => router.push("/register")}>
                <span className="hidden sm:inline">Teste Grátis</span>
                <span className="sm:hidden">Cadastrar</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center p-4 py-8 sm:py-16">
        <div className="w-full max-w-md">
          {/* Logo e título */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg p-3">
                <Zap className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-blue-900 bg-clip-text text-transparent">
              Entrar no WhatLead
            </h1>
            <p className="text-gray-600 mt-2">Acesse sua conta para continuar</p>
          </div>

          {/* Card de login */}
          <Card className="shadow-lg border-2">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Bem-vindo de volta</CardTitle>
              <CardDescription className="text-center">
                Digite suas credenciais para acessar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isRegistered && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-800">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Conta criada com sucesso! 🎉</p>
                    <p className="text-sm">Faça login para acessar sua conta</p>
                  </div>
                </div>
              )}
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                {message && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {message}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg py-6"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Não tem uma conta?{" "}
                    <button
                      type="button"
                      onClick={() => router.push("/register")}
                      className="text-purple-600 hover:underline font-semibold"
                    >
                      Testar 14 dias grátis
                    </button>
                    {" "}ou{" "}
                    <button
                      type="button"
                      onClick={() => {
                        router.push("/");
                        setTimeout(() => {
                          document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                      }}
                      className="text-purple-600 hover:underline font-medium"
                    >
                      ver planos pagos
                    </button>
                  </p>
                </div>
              </form>

              <div className="mt-6 pt-6 border-t text-center text-sm text-gray-600">
                <p className="mb-1 font-medium">Credenciais de demonstração:</p>
                <p className="text-xs bg-gray-50 p-3 rounded border">
                  <strong>Email:</strong> owner@pixelcode.dev<br />
                  <strong>Senha:</strong> admin123
                </p>
              </div>
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white" />}>
      <LoginPageContent />
    </Suspense>
  );
}

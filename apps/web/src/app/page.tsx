"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Users, ShoppingCart, TrendingUp } from "lucide-react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Verificar se existe token e redirecionar para dashboard
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/dashboard");
    }
  }, [router]);

  const features = [
    {
      icon: MessageSquare,
      title: "WhatsApp Integration",
      description: "Conecte-se diretamente com seus clientes via WhatsApp"
    },
    {
      icon: Users,
      title: "Gestão de Clientes",
      description: "Mantenha um relacionamento próximo com seus clientes"
    },
    {
      icon: ShoppingCart,
      title: "E-commerce Integrado",
      description: "Gerencie produtos, pedidos e pagamentos em um só lugar"
    },
    {
      icon: TrendingUp,
      title: "Analytics Avançados",
      description: "Acompanhe o crescimento do seu negócio com métricas detalhadas"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-primary rounded-full p-2">
              <MessageSquare className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-gray-900">WACRM</span>
          </div>
          <Button onClick={() => router.push("/login")}>
            Entrar
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            WhatsApp Commerce CRM
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            A plataforma completa para gerenciar seu negócio no WhatsApp. 
            Vendas, atendimento e relacionamento em um só lugar.
          </p>
          <div className="space-x-4">
            <Button size="lg" onClick={() => router.push("/login")}>
              Começar Agora
            </Button>
            <Button variant="outline" size="lg">
              Saber Mais
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="text-center">
              <CardHeader>
                <div className="mx-auto bg-primary/10 rounded-full p-3 w-16 h-16 flex items-center justify-center">
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Demo Section */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Experimente a Demo</CardTitle>
            <CardDescription>
              Acesse uma versão de demonstração completa do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Credenciais de acesso:</p>
              <div className="space-y-1 text-sm">
                <p><strong>Email:</strong> owner@pixelcode.dev</p>
                <p><strong>Senha:</strong> admin123</p>
              </div>
            </div>
            <Button size="lg" onClick={() => router.push("/login")}>
              Acessar Demo
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2025 WACRM. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

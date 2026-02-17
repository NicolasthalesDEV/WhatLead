"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Settings,
  User,
  Building2,
  Bell,
  Shield,
  Palette,
  MessageSquare,
  CreditCard,
  Globe,
  Save,
  Eye,
  EyeOff,
  Plus,
  Trash2
} from "lucide-react";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  const { user, loading, updateUser, refresh } = useAuth();

  // Profile state
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  // Company state
  const [company, setCompany] = useState({
    name: "",
    cnpj: "",
    ie: "",
    address: "",
  });

  // Carregar dados do usuário quando disponível
  useEffect(() => {
    if (user && !loading) {
      const [firstName = "", lastName = ""] = (user.name || "").split(" ", 2);
      setProfile({
        firstName,
        lastName,
        email: user.email || "",
        phone: "",
      });

      if (user.company) {
        setCompany({
          name: user.company.name || "",
          cnpj: "",
          ie: "",
          address: "",
        });
      }
    }
  }, [user, loading]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Salvar perfil do usuário
      const fullName = `${profile.firstName} ${profile.lastName}`.trim();
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName,
          email: profile.email,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao salvar configurações");
      }

      const data = await response.json();
      
      // Atualizar contexto de autenticação
      updateUser({
        name: data.user.name,
        email: data.user.email,
      });

      // Salvar configurações da empresa (se houver endpoint)
      // await fetch('/api/company/settings', {
      //   method: 'PUT',
      //   body: JSON.stringify(company)
      // });
      
      showToast("Configurações salvas com sucesso!", "success");
      
      // Recarregar dados do usuário para garantir sincronização
      await refresh();
    } catch (error: any) {
      console.error("Failed to save settings:", error);
      showToast(error.message || "Erro ao salvar configurações", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie suas preferências e configurações do sistema
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Navigation */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Seções</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <nav className="space-y-1">
              <button
                onClick={() => scrollToSection("profile")}
                className="w-full flex items-center px-4 py-3 text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20"
              >
                <User className="mr-3 h-4 w-4" />
                Perfil
              </button>
              <button
                onClick={() => scrollToSection("company")}
                className="w-full flex items-center px-4 py-3 text-sm font-medium hover:bg-gray-50"
              >
                <Building2 className="mr-3 h-4 w-4" />
                Empresa
              </button>
              <button
                onClick={() => scrollToSection("notifications")}
                className="w-full flex items-center px-4 py-3 text-sm font-medium hover:bg-gray-50"
              >
                <Bell className="mr-3 h-4 w-4" />
                Notificações
              </button>
              <button
                onClick={() => scrollToSection("security")}
                className="w-full flex items-center px-4 py-3 text-sm font-medium hover:bg-gray-50"
              >
                <Shield className="mr-3 h-4 w-4" />
                Segurança
              </button>
              <button
                onClick={() => scrollToSection("appearance")}
                className="w-full flex items-center px-4 py-3 text-sm font-medium hover:bg-gray-50"
              >
                <Palette className="mr-3 h-4 w-4" />
                Aparência
              </button>
              <button
                onClick={() => scrollToSection("whatsapp")}
                className="w-full flex items-center px-4 py-3 text-sm font-medium hover:bg-gray-50"
              >
                <MessageSquare className="mr-3 h-4 w-4" />
                WhatsApp
              </button>
              <button
                onClick={() => scrollToSection("billing")}
                className="w-full flex items-center px-4 py-3 text-sm font-medium hover:bg-gray-50"
              >
                <CreditCard className="mr-3 h-4 w-4" />
                Plano e Faturamento
              </button>
              <button
                onClick={() => scrollToSection("integrations")}
                className="w-full flex items-center px-4 py-3 text-sm font-medium hover:bg-gray-50"
              >
                <Globe className="mr-3 h-4 w-4" />
                Integrações
              </button>
            </nav>
          </CardContent>
        </Card>

        {/* Settings Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Settings */}
          <Card id="profile">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Perfil
              </CardTitle>
              <CardDescription>Gerencie suas informações pessoais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nome</Label>
                  <Input
                    id="firstName"
                    value={profile.firstName}
                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Sobrenome</Label>
                  <Input
                    id="lastName"
                    value={profile.lastName}
                    onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Company Settings */}
          <Card id="company">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="mr-2 h-5 w-5" />
                Empresa
              </CardTitle>
              <CardDescription>Informações da sua empresa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Nome da Empresa</Label>
                <Input
                  id="companyName"
                  value={company.name}
                  onChange={(e) => setCompany({ ...company, name: e.target.value })}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={company.cnpj}
                    onChange={(e) => setCompany({ ...company, cnpj: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ie">Inscrição Estadual</Label>
                  <Input
                    id="ie"
                    value={company.ie}
                    onChange={(e) => setCompany({ ...company, ie: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={company.address}
                  onChange={(e) => setCompany({ ...company, address: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card id="notifications">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5" />
                Notificações
              </CardTitle>
              <CardDescription>Configure como você recebe notificações</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Novos pedidos</div>
                  <div className="text-sm text-muted-foreground">Receber notificação quando houver novos pedidos</div>
                </div>
                <Button variant="outline" size="sm">Ativo</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Mensagens WhatsApp</div>
                  <div className="text-sm text-muted-foreground">Notificações de novas mensagens no WhatsApp</div>
                </div>
                <Button variant="outline" size="sm">Ativo</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Relatórios semanais</div>
                  <div className="text-sm text-muted-foreground">Resumo semanal das vendas por email</div>
                </div>
                <Button variant="secondary" size="sm">Inativo</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Estoque baixo</div>
                  <div className="text-sm text-muted-foreground">Alerta quando produtos estiverem com estoque baixo</div>
                </div>
                <Button variant="outline" size="sm">Ativo</Button>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card id="security">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Segurança
              </CardTitle>
              <CardDescription>Gerencie a segurança da sua conta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Senha Atual</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha atual"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input id="newPassword" type="password" placeholder="Digite nova senha" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <Input id="confirmPassword" type="password" placeholder="Confirme a nova senha" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <div className="font-medium text-green-800">Autenticação de 2 fatores</div>
                  <div className="text-sm text-green-600">Adicione uma camada extra de segurança</div>
                </div>
                <Badge className="bg-green-100 text-green-800">Ativo</Badge>
              </div>
            </CardContent>
          </Card>

          {/* WhatsApp Configuration */}
          <Card id="whatsapp">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="mr-2 h-5 w-5" />
                WhatsApp
              </CardTitle>
              <CardDescription>Configure a integração com WhatsApp</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <div className="font-medium text-green-800">Status da Conexão</div>
                  <div className="text-sm text-green-600">WhatsApp conectado e funcionando</div>
                </div>
                <Badge className="bg-green-100 text-green-800">Conectado</Badge>
              </div>
              <div className="space-y-2">
                <Label>Mensagens Automáticas</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">Mensagem de boas-vindas</span>
                    <Button variant="outline" size="sm">Editar</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">Mensagem fora do horário</span>
                    <Button variant="outline" size="sm">Editar</Button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessHours">Horário de Atendimento</Label>
                <div className="grid gap-2 md:grid-cols-2">
                  <Input placeholder="08:00" />
                  <Input placeholder="18:00" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Billing */}
          <Card id="billing">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                Plano e Faturamento
              </CardTitle>
              <CardDescription>Gerencie seu plano e informações de pagamento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <div className="font-medium text-blue-800">Plano Atual: Professional</div>
                  <div className="text-sm text-blue-600">R$ 197/mês - Renovação em 15 dias</div>
                </div>
                <Button variant="outline" size="sm">Alterar Plano</Button>
              </div>
              <div className="space-y-2">
                <Label>Forma de Pagamento</Label>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center">
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span className="text-sm">**** **** **** 1234</span>
                  </div>
                  <Button variant="outline" size="sm">Alterar</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Histórico de Faturas</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="text-sm font-medium">Janeiro 2024</div>
                      <div className="text-xs text-muted-foreground">R$ 197,00</div>
                    </div>
                    <Button variant="ghost" size="sm">Download</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="text-sm font-medium">Dezembro 2023</div>
                      <div className="text-xs text-muted-foreground">R$ 197,00</div>
                    </div>
                    <Button variant="ghost" size="sm">Download</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Integrations */}
          <Card id="integrations">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="mr-2 h-5 w-5" />
                Integrações
              </CardTitle>
              <CardDescription>Conecte com outras ferramentas e serviços</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Google Analytics</h3>
                    <Badge className="bg-green-100 text-green-800">Conectado</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Acompanhe o desempenho do seu site
                  </p>
                  <Button variant="outline" size="sm">Configurar</Button>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Correios</h3>
                    <Badge variant="secondary">Desconectado</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Calcule fretes automaticamente
                  </p>
                  <Button variant="outline" size="sm">Conectar</Button>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">PagSeguro</h3>
                    <Badge className="bg-green-100 text-green-800">Conectado</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Receba pagamentos via PIX e cartão
                  </p>
                  <Button variant="outline" size="sm">Configurar</Button>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Mercado Livre</h3>
                    <Badge variant="secondary">Desconectado</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Sincronize produtos e pedidos
                  </p>
                  <Button variant="outline" size="sm">Conectar</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
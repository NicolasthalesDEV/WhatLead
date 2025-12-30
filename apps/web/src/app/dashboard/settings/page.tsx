"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { useState } from "react";

export default function SettingsPage() {
  const [showPassword, setShowPassword] = useState(false);

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
        <Button>
          <Save className="mr-2 h-4 w-4" />
          Salvar Alterações
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
              <a href="#profile" className="flex items-center px-4 py-3 text-sm font-medium bg-primary/10 text-primary">
                <User className="mr-3 h-4 w-4" />
                Perfil
              </a>
              <a href="#company" className="flex items-center px-4 py-3 text-sm font-medium hover:bg-gray-50">
                <Building2 className="mr-3 h-4 w-4" />
                Empresa
              </a>
              <a href="#notifications" className="flex items-center px-4 py-3 text-sm font-medium hover:bg-gray-50">
                <Bell className="mr-3 h-4 w-4" />
                Notificações
              </a>
              <a href="#security" className="flex items-center px-4 py-3 text-sm font-medium hover:bg-gray-50">
                <Shield className="mr-3 h-4 w-4" />
                Segurança
              </a>
              <a href="#appearance" className="flex items-center px-4 py-3 text-sm font-medium hover:bg-gray-50">
                <Palette className="mr-3 h-4 w-4" />
                Aparência
              </a>
              <a href="#whatsapp" className="flex items-center px-4 py-3 text-sm font-medium hover:bg-gray-50">
                <MessageSquare className="mr-3 h-4 w-4" />
                WhatsApp
              </a>
              <a href="#billing" className="flex items-center px-4 py-3 text-sm font-medium hover:bg-gray-50">
                <CreditCard className="mr-3 h-4 w-4" />
                Plano e Faturamento
              </a>
              <a href="#integrations" className="flex items-center px-4 py-3 text-sm font-medium hover:bg-gray-50">
                <Globe className="mr-3 h-4 w-4" />
                Integrações
              </a>
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
                  <Input id="firstName" defaultValue="João" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Sobrenome</Label>
                  <Input id="lastName" defaultValue="Silva" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" defaultValue="joao@empresa.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" defaultValue="(11) 99999-9999" />
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
                <Input id="companyName" defaultValue="Empresa Exemplo LTDA" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input id="cnpj" defaultValue="12.345.678/0001-90" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ie">Inscrição Estadual</Label>
                  <Input id="ie" defaultValue="123.456.789.012" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input id="address" defaultValue="Rua Exemplo, 123 - Centro - São Paulo/SP" />
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
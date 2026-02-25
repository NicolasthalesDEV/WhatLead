"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/hooks/useAuth";
import { WhatsAppSetupWizard } from "@/components/whatsapp-setup-wizard";
import { WhatsAppChannelManager } from "@/components/whatsapp-channel-manager";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Bell,
  Shield,
  MessageSquare,
  Save,
  Eye,
  EyeOff,
  Bot,
  Volume2,
  Key,
  CheckCircle2,
  XCircle,
  CreditCard,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Calendar,
} from "lucide-react";
import { useState, useEffect } from "react";

interface BillingInfo {
  plan: string;
  planStatus: string;
  daysRemaining: number | null;
  expiresIn: string | null;
  billingCycle: string | null;
  mercadopagoSubscriptionId: string | null;
}

export default function SettingsPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showWhatsAppWizard, setShowWhatsAppWizard] = useState(false);
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [billingLoading, setBillingLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelConfirmText, setCancelConfirmText] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const { showToast } = useToast();
  const { user, loading, updateUser, refresh } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [notifications, setNotifications] = useState({ whatsapp: true, chatbot: true });
  const [password, setPassword] = useState({ current: "", new: "", confirm: "" });
  const [changingPassword, setChangingPassword] = useState(false);
  const [apiStatus, setApiStatus] = useState({ openai: false, elevenlabs: false, whatsapp: false, loadingStatus: true });
  const [apiKeys, setApiKeys] = useState({ openai: "", elevenlabs: "" });
  const [savingApiKeys, setSavingApiKeys] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      const [firstName = "", lastName = ""] = (user.name || "").split(" ", 2);
      setProfile({ firstName, lastName, email: user.email || "", phone: "" });
      // Also fetch phone (not in auth token) from profile API
      fetch("/api/user/profile", { credentials: "include" })
        .then((r) => r.ok ? r.json() : null)
        .then((d) => { if (d?.user?.phone) setProfile((p) => ({ ...p, phone: d.user.phone })); })
        .catch(() => { });
    }
  }, [user, loading]);

  useEffect(() => {
    async function fetchPreferences() {
      try {
        const res = await fetch("/api/user/preferences", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data.preferences?.notifications) {
            setNotifications((p) => ({ ...p, ...data.preferences.notifications }));
          }
        }
      } catch { /* silent */ }
    }
    if (!loading) fetchPreferences();
  }, [loading]);

  useEffect(() => {
    async function fetchBilling() {
      try {
        const res = await fetch("/api/billing/subscription", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setBilling({
            plan: data.plan || "free",
            planStatus: data.planStatus || "active",
            daysRemaining: data.daysRemaining ?? null,
            expiresIn: data.expiresIn ?? null,
            billingCycle: data.billingCycle ?? null,
            mercadopagoSubscriptionId: data.mercadopagoSubscriptionId ?? null,
          });
        }
      } catch { /* silent */ } finally {
        setBillingLoading(false);
      }
    }
    fetchBilling();
  }, []);

  const handleDeleteAccount = async () => {
    if (cancelConfirmText !== "EXCLUIR") return;
    setCancelling(true);
    try {
      const res = await fetch("/api/billing/delete-account", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro ao excluir conta");
      router.push("/?cancelled=true");
    } catch (error: any) {
      showToast(error.message || "Erro ao excluir conta", "error");
      setCancelling(false);
    }
  };

  const PLAN_LABELS: Record<string, string> = {
    free: "14 Dias Grátis",
    free_trial: "14 Dias Grátis",
    starter: "Starter",
    professional: "Professional",
    enterprise: "Enterprise",
  };

  const PLAN_COLORS: Record<string, string> = {
    free: "bg-blue-100 text-blue-700",
    free_trial: "bg-blue-100 text-blue-700",
    starter: "bg-green-100 text-green-700",
    professional: "bg-purple-100 text-purple-700",
    enterprise: "bg-orange-100 text-orange-700",
  };

  const STATUS_LABEL: Record<string, string> = {
    active: "Ativo",
    pending: "Pendente",
    cancelled: "Cancelado",
    canceled: "Cancelado",
    expired: "Expirado",
    trial: "Trial",
    payment_failed: "Pagamento falhou",
  };

  useEffect(() => {
    async function fetchChatbotSettingsKeys() {
      try {
        const res = await fetch("/api/chatbot/settings", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setApiKeys({
            openai: data.settings?.openaiApiKey || "",
            elevenlabs: data.settings?.elevenLabsApiKey || "",
          });
        }
      } catch { /* silent */ }
    }
    fetchChatbotSettingsKeys();
  }, []);

  const handleSaveApiKeys = async () => {
    setSavingApiKeys(true);
    try {
      const body: Record<string, string | null> = {};
      // Only send openaiApiKey when user typed a new value or explicitly cleared it
      if (!apiKeys.openai.includes("...")) {
        body.openaiApiKey = apiKeys.openai.trim() || null;
      }
      // Only send elevenLabsApiKey when changed
      if (!apiKeys.elevenlabs.includes("...")) {
        body.elevenLabsApiKey = apiKeys.elevenlabs.trim() || null;
      }
      if (Object.keys(body).length === 0) {
        showToast("Nenhuma alteração para salvar", "warning");
        return;
      }
      const res = await fetch("/api/chatbot/settings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Erro ao salvar chaves");
      const data = await res.json();
      setApiKeys({
        openai: data.settings?.openaiApiKey || "",
        elevenlabs: data.settings?.elevenLabsApiKey || "",
      });
      showToast("Chaves de API salvas com sucesso", "success");
    } catch (error: any) {
      showToast(error.message || "Erro ao salvar chaves", "error");
    } finally {
      setSavingApiKeys(false);
    }
  };

  useEffect(() => {
    async function fetchApiStatus() {
      try {
        const res = await fetch("/api/health", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setApiStatus({
            openai: Boolean(data.openai ?? data.openAI),
            elevenlabs: Boolean(data.elevenlabs ?? data.elevenLabs),
            whatsapp: Boolean(data.whatsapp),
            loadingStatus: false,
          });
        } else {
          setApiStatus((p) => ({ ...p, loadingStatus: false }));
        }
      } catch {
        setApiStatus((p) => ({ ...p, loadingStatus: false }));
      }
    }
    fetchApiStatus();
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fullName = `${profile.firstName} ${profile.lastName}`.trim();
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: fullName, email: profile.email, phone: profile.phone || null }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao salvar");
      }
      const data = await res.json();
      updateUser({ name: data.user.name, email: data.user.email });
      showToast("Configurações salvas!", "success");
      await refresh();
    } catch (error: any) {
      showToast(error.message || "Erro ao salvar configurações", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationToggle = async (key: keyof typeof notifications) => {
    const newValue = !notifications[key];
    setNotifications((p) => ({ ...p, [key]: newValue }));
    try {
      const res = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ notifications: { [key]: newValue } }),
      });
      if (!res.ok) throw new Error();
      showToast("Preferência atualizada", "success");
    } catch {
      setNotifications((p) => ({ ...p, [key]: !newValue }));
      showToast("Erro ao salvar preferência", "error");
    }
  };

  const handlePasswordChange = async () => {
    if (!password.current || !password.new || !password.confirm) {
      showToast("Preencha todos os campos de senha", "error");
      return;
    }
    if (password.new.length < 8) {
      showToast("A nova senha deve ter no mínimo 8 caracteres", "error");
      return;
    }
    if (password.new !== password.confirm) {
      showToast("As senhas não coincidem", "error");
      return;
    }
    setChangingPassword(true);
    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword: password.current, newPassword: password.new }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao alterar senha");
      }
      showToast("Senha alterada com sucesso!", "success");
      setPassword({ current: "", new: "", confirm: "" });
    } catch (error: any) {
      showToast(error.message || "Erro ao alterar senha", "error");
    } finally {
      setChangingPassword(false);
    }
  };

  const ApiStatusBadge = ({ ok, loading: ld }: { ok: boolean; loading: boolean }) => {
    if (ld) return <Badge variant="secondary">Verificando...</Badge>;
    return ok ? (
      <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
        <CheckCircle2 className="h-4 w-4" /> Configurada
      </span>
    ) : (
      <span className="flex items-center gap-1 text-red-500 text-sm font-medium">
        <XCircle className="h-4 w-4" /> Não configurada
      </span>
    );
  };

  const NAV = [
    { id: "profile", icon: User, label: "Perfil" },
    { id: "billing", icon: CreditCard, label: "Plano & Faturamento" },
    { id: "whatsapp", icon: MessageSquare, label: "WhatsApp" },
    { id: "api-keys", icon: Key, label: "Chaves de API" },
    { id: "notifications", icon: Bell, label: "Notificações" },
    { id: "security", icon: Shield, label: "Segurança" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">Gerencie seu perfil, integrações e preferências</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      {/* Mobile nav: horizontal scrollable tabs */}
      <div className="lg:hidden">
        <div className="flex overflow-x-auto gap-1 pb-1 scrollbar-hide border rounded-lg bg-white p-1">
          {NAV.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => scrollToSection(id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap hover:bg-gray-100 transition-colors shrink-0"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Desktop sidebar nav */}
        <Card className="hidden lg:block lg:col-span-1 h-fit sticky top-4">
          <CardHeader><CardTitle>Seções</CardTitle></CardHeader>
          <CardContent className="p-0">
            <nav className="space-y-1">
              {NAV.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => scrollToSection(id)}
                  className="w-full flex items-center px-4 py-3 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  <Icon className="mr-3 h-4 w-4" />
                  {label}
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card id="profile">
            <CardHeader>
              <CardTitle className="flex items-center"><User className="mr-2 h-5 w-5" />Perfil</CardTitle>
              <CardDescription>Gerencie suas informações pessoais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nome</Label>
                  <Input id="firstName" value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Sobrenome</Label>
                  <Input id="lastName" value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
              </div>
            </CardContent>
          </Card>

          {/* ── BILLING ── */}
          <Card id="billing">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                Plano & Faturamento
              </CardTitle>
              <CardDescription>Gerencie sua assinatura e dados de pagamento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {billingLoading ? (
                <div className="flex items-center gap-2 text-gray-400 py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando informações do plano...
                </div>
              ) : (
                <>
                  {/* Plano atual */}
                  <div className="flex items-start justify-between p-4 bg-gray-50 border rounded-xl">
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Plano atual</p>
                      <div className="flex items-center gap-2">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${PLAN_COLORS[billing?.plan || "free"] || "bg-gray-100 text-gray-700"
                          }`}>
                          {PLAN_LABELS[billing?.plan || "free"] || billing?.plan}
                        </span>
                        <Badge variant="outline" className={
                          billing?.planStatus === "active" ? "border-green-300 text-green-700" :
                            billing?.planStatus === "trial" ? "border-blue-300 text-blue-700" :
                              "border-red-300 text-red-600"
                        }>
                          {STATUS_LABEL[billing?.planStatus || "active"] || billing?.planStatus}
                        </Badge>
                      </div>
                      {billing?.billingCycle && (
                        <p className="text-xs text-gray-500">
                          Ciclo {billing.billingCycle === "yearly" ? "anual" : "mensal"}
                        </p>
                      )}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => router.push("/checkout?plan=professional")}>
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Mudar plano
                    </Button>
                  </div>

                  {/* Dias restantes / Trial */}
                  {billing?.expiresIn && (
                    <div className={`flex items-center gap-3 p-4 rounded-xl border ${(billing.daysRemaining ?? 999) <= 3
                      ? "bg-red-50 border-red-200"
                      : (billing.daysRemaining ?? 999) <= 7
                        ? "bg-orange-50 border-orange-200"
                        : (billing.daysRemaining ?? 999) <= 30
                          ? "bg-yellow-50 border-yellow-200"
                          : "bg-blue-50 border-blue-200"
                      }`}>
                      <Calendar className={`h-5 w-5 flex-shrink-0 ${(billing.daysRemaining ?? 999) <= 3 ? "text-red-500" :
                        (billing.daysRemaining ?? 999) <= 7 ? "text-orange-500" :
                          (billing.daysRemaining ?? 999) <= 30 ? "text-yellow-600" : "text-blue-500"
                        }`} />
                      <div>
                        <p className="font-medium text-gray-800">{billing.expiresIn}</p>
                        {(billing.daysRemaining ?? 999) <= 3 && (
                          <p className="text-xs text-red-600 mt-0.5">Assine um plano para não perder o acesso</p>
                        )}
                        {(billing.daysRemaining ?? 999) > 3 && (billing.daysRemaining ?? 999) <= 7 && (
                          <p className="text-xs text-orange-700 mt-0.5">Seu período de avaliação está acabando</p>
                        )}
                      </div>
                      <Button size="sm" className="ml-auto" onClick={() => router.push("/checkout?plan=professional")}>
                        {billing?.planStatus === "trial" || billing?.plan === "free" ? "Assinar" : "Renovar"}
                      </Button>
                    </div>
                  )}

                  {/* Cancelar */}
                  <div className="border border-red-200 rounded-xl p-4 bg-red-50">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-red-800">Zona de Perigo</p>
                        <p className="text-sm text-red-700 mt-1">
                          O cancelamento do plano apaga permanentemente todos os dados da sua conta.
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => { setCancelConfirmText(""); setShowCancelModal(true); }}
                      >
                        Cancelar plano
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div id="whatsapp" className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Configuração do WhatsApp Business
                  </h4>
                  <p className="text-sm text-blue-800 mb-3">
                    Use nosso guia interativo para conectar o WhatsApp Business API.
                  </p>
                  <Button onClick={() => setShowWhatsAppWizard(true)} className="bg-green-600 hover:bg-green-700" size="sm">
                    Abrir Guia de Configuração
                  </Button>
                </div>
              </CardContent>
            </Card>
            <WhatsAppChannelManager />
          </div>

          <Card id="api-keys">
            <CardHeader>
              <CardTitle className="flex items-center"><Key className="mr-2 h-5 w-5" />Chaves de API</CardTitle>
              <CardDescription>Adicione suas chaves para habilitar IA e voz. As chaves ficam armazenadas de forma segura e substituem as variáveis de ambiente globais.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* OpenAI */}
              <div className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg"><Bot className="h-5 w-5 text-green-700" /></div>
                  <div className="flex-1">
                    <p className="font-medium">OpenAI (GPT + Whisper)</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Respostas automáticas e transcrição de áudios</p>
                  </div>
                  <ApiStatusBadge ok={apiStatus.openai || apiKeys.openai.includes("...")} loading={apiStatus.loadingStatus} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="openai-key" className="text-sm">Chave OpenAI</Label>
                  <div className="flex gap-2">
                    <Input
                      id="openai-key"
                      type="password"
                      placeholder={apiKeys.openai.includes("...") ? `Chave atual: ${apiKeys.openai}` : "sk-proj-..."}
                      value={apiKeys.openai.includes("...") ? "" : apiKeys.openai}
                      onChange={(e) => setApiKeys((p) => ({ ...p, openai: e.target.value }))}
                      className="font-mono text-sm"
                    />
                    {apiKeys.openai && (
                      <Button variant="outline" size="sm" onClick={() => setApiKeys((p) => ({ ...p, openai: "" }))}>
                        Remover
                      </Button>
                    )}
                  </div>
                  {apiKeys.openai.includes("...") && (
                    <p className="text-xs text-muted-foreground">Chave armazenada. Deixe em branco para manter ou clique em Remover para apagar.</p>
                  )}
                </div>
              </div>

              {/* ElevenLabs */}
              <div className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg"><Volume2 className="h-5 w-5 text-purple-700" /></div>
                  <div className="flex-1">
                    <p className="font-medium">ElevenLabs (Text-to-Speech)</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Converte respostas em mensagens de voz</p>
                  </div>
                  <ApiStatusBadge ok={apiStatus.elevenlabs || apiKeys.elevenlabs.includes("...")} loading={apiStatus.loadingStatus} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="elevenlabs-key" className="text-sm">Chave ElevenLabs</Label>
                  <div className="flex gap-2">
                    <Input
                      id="elevenlabs-key"
                      type="password"
                      placeholder={apiKeys.elevenlabs.includes("...") ? `Chave atual: ${apiKeys.elevenlabs}` : "sk_..."}
                      value={apiKeys.elevenlabs.includes("...") ? "" : apiKeys.elevenlabs}
                      onChange={(e) => setApiKeys((p) => ({ ...p, elevenlabs: e.target.value }))}
                      className="font-mono text-sm"
                    />
                    {apiKeys.elevenlabs && (
                      <Button variant="outline" size="sm" onClick={() => setApiKeys((p) => ({ ...p, elevenlabs: "" }))}>
                        Remover
                      </Button>
                    )}
                  </div>
                  {apiKeys.elevenlabs.includes("...") && (
                    <p className="text-xs text-muted-foreground">Chave armazenada. Deixe em branco para manter ou clique em Remover para apagar.</p>
                  )}
                </div>
              </div>

              {/* WhatsApp */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg"><MessageSquare className="h-5 w-5 text-green-700" /></div>
                  <div>
                    <p className="font-medium">WhatsApp Business API</p>
                    <p className="text-xs text-muted-foreground font-mono">WA_PHONE_NUMBER_ID · WA_ACCESS_TOKEN</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Configurado na seção WhatsApp acima</p>
                  </div>
                </div>
                <ApiStatusBadge ok={apiStatus.whatsapp} loading={apiStatus.loadingStatus} />
              </div>

              <Button onClick={handleSaveApiKeys} disabled={savingApiKeys}>
                {savingApiKeys
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</>
                  : <><Save className="mr-2 h-4 w-4" />Salvar Chaves de API</>}
              </Button>
            </CardContent>
          </Card>

          <Card id="notifications">
            <CardHeader>
              <CardTitle className="flex items-center"><Bell className="mr-2 h-5 w-5" />Notificações</CardTitle>
              <CardDescription>Configure como você recebe notificações</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Mensagens WhatsApp</div>
                  <div className="text-sm text-muted-foreground">Novas mensagens recebidas no WhatsApp</div>
                </div>
                <Switch checked={notifications.whatsapp} onCheckedChange={() => handleNotificationToggle("whatsapp")} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Atividade do Chatbot</div>
                  <div className="text-sm text-muted-foreground">Alertas quando o chatbot precisar de atenção</div>
                </div>
                <Switch checked={notifications.chatbot} onCheckedChange={() => handleNotificationToggle("chatbot")} />
              </div>
            </CardContent>
          </Card>

          <Card id="security">
            <CardHeader>
              <CardTitle className="flex items-center"><Shield className="mr-2 h-5 w-5" />Segurança</CardTitle>
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
                    value={password.current}
                    onChange={(e) => setPassword({ ...password, current: e.target.value })}
                  />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input id="newPassword" type="password" placeholder="Mínimo 8 caracteres" value={password.new} onChange={(e) => setPassword({ ...password, new: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <Input id="confirmPassword" type="password" placeholder="Confirme a nova senha" value={password.confirm} onChange={(e) => setPassword({ ...password, confirm: e.target.value })} />
                </div>
              </div>
              <Button onClick={handlePasswordChange} disabled={changingPassword} className="w-full md:w-auto">
                {changingPassword ? "Alterando..." : "Alterar Senha"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {showWhatsAppWizard && (
        <WhatsAppSetupWizard onClose={() => setShowWhatsAppWizard(false)} onComplete={() => setShowWhatsAppWizard(false)} />
      )}

      {/* ── Modal de cancelamento destrutivo ── */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 rounded-full p-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Cancelar plano e excluir conta</h2>
                <p className="text-sm text-gray-500">Esta ação é irreversível</p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2 text-sm text-red-800">
              <p className="font-semibold">⚠️ Ao confirmar, serão excluídos permanentemente:</p>
              <ul className="list-disc list-inside space-y-1 ml-1">
                <li>Todas as conversas e mensagens do WhatsApp</li>
                <li>Histórico completo de contatos</li>
                <li>Configurações do chatbot e da IA</li>
                <li>Canais WhatsApp conectados</li>
                <li>Todos os usuários e dados de login</li>
                <li>Sua empresa e todos os registros associados</li>
              </ul>
              <p className="font-semibold mt-2">Não há como recuperar esses dados após a exclusão.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">
                Para confirmar, digite <strong className="text-red-600">EXCLUIR</strong> abaixo:
              </Label>
              <Input
                value={cancelConfirmText}
                onChange={(e) => setCancelConfirmText(e.target.value)}
                placeholder="EXCLUIR"
                className="border-red-300 focus:ring-red-500"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
              >
                Voltar
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={cancelConfirmText !== "EXCLUIR" || cancelling}
                onClick={handleDeleteAccount}
              >
                {cancelling ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Excluindo...</>
                ) : (
                  "Excluir tudo e cancelar"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

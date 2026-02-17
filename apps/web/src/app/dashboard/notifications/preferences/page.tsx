"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { ArrowLeft, Save, Bell } from "lucide-react";
import Link from "next/link";

type Preferences = {
  orderCreated: boolean;
  orderPaid: boolean;
  orderCancelled: boolean;
  messageReceived: boolean;
  paymentReceived: boolean;
  quoteCreated: boolean;
  quoteAccepted: boolean;
  customerCreated: boolean;
  lowStock: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
};

export default function NotificationPreferencesPage() {
  const [preferences, setPreferences] = useState<Preferences>({
    orderCreated: true,
    orderPaid: true,
    orderCancelled: true,
    messageReceived: true,
    paymentReceived: true,
    quoteCreated: true,
    quoteAccepted: true,
    customerCreated: false,
    lowStock: true,
    emailEnabled: true,
    pushEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications/preferences");
      const data = await res.json();

      if (data.preferences) {
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error("Failed to load preferences:", error);
    }
    setLoading(false);
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });

      alert("Preferências salvas com sucesso!");
    } catch (error) {
      console.error("Failed to save preferences:", error);
      alert("Erro ao salvar preferências");
    }
    setSaving(false);
  };

  const togglePreference = (key: keyof Preferences) => {
    setPreferences({ ...preferences, [key]: !preferences[key] });
  };

  if (loading) {
    return <div className="text-center py-12">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/notifications">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="h-7 w-7" />
              Preferências de Notificações
            </h1>
            <p className="text-gray-600">Configure quais notificações deseja receber</p>
          </div>
        </div>
        <Button onClick={savePreferences} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Notificação</CardTitle>
          <CardDescription>
            Escolha quais eventos você quer ser notificado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Pedido Criado</Label>
              <p className="text-sm text-gray-500">Quando um novo pedido é criado</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.orderCreated}
              onChange={() => togglePreference("orderCreated")}
              className="w-4 h-4"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Pedido Pago</Label>
              <p className="text-sm text-gray-500">Quando um pedido é marcado como pago</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.orderPaid}
              onChange={() => togglePreference("orderPaid")}
              className="w-4 h-4"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Pedido Cancelado</Label>
              <p className="text-sm text-gray-500">Quando um pedido é cancelado</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.orderCancelled}
              onChange={() => togglePreference("orderCancelled")}
              className="w-4 h-4"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Mensagem Recebida</Label>
              <p className="text-sm text-gray-500">Quando receber uma nova mensagem</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.messageReceived}
              onChange={() => togglePreference("messageReceived")}
              className="w-4 h-4"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Pagamento Recebido</Label>
              <p className="text-sm text-gray-500">Quando um pagamento é confirmado</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.paymentReceived}
              onChange={() => togglePreference("paymentReceived")}
              className="w-4 h-4"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Cotação Criada</Label>
              <p className="text-sm text-gray-500">Quando uma nova cotação é criada</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.quoteCreated}
              onChange={() => togglePreference("quoteCreated")}
              className="w-4 h-4"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Cotação Aceita</Label>
              <p className="text-sm text-gray-500">Quando uma cotação é aceita</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.quoteAccepted}
              onChange={() => togglePreference("quoteAccepted")}
              className="w-4 h-4"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Cliente Criado</Label>
              <p className="text-sm text-gray-500">Quando um novo cliente é cadastrado</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.customerCreated}
              onChange={() => togglePreference("customerCreated")}
              className="w-4 h-4"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Estoque Baixo</Label>
              <p className="text-sm text-gray-500">Quando um produto está com estoque baixo</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.lowStock}
              onChange={() => togglePreference("lowStock")}
              className="w-4 h-4"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Channels */}
      <Card>
        <CardHeader>
          <CardTitle>Canais de Notificação</CardTitle>
          <CardDescription>
            Escolha como deseja receber as notificações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Notificações por E-mail</Label>
              <p className="text-sm text-gray-500">Receber notificações por e-mail</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.emailEnabled}
              onChange={() => togglePreference("emailEnabled")}
              className="w-4 h-4"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Notificações Push</Label>
              <p className="text-sm text-gray-500">Receber notificações push no navegador</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.pushEnabled}
              onChange={() => togglePreference("pushEnabled")}
              className="w-4 h-4"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

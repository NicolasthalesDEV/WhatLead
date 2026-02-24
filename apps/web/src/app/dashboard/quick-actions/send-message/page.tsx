"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, MessageSquare } from "lucide-react";
import Link from "next/link";

interface Customer {
  id: string;
  name: string;
  phoneE164: string;
}

export default function SendMessagePage() {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    customerId: "",
    message: "",
  });

  const quickMessages = [
    "Olá! Como posso ajudar você hoje?",
    "Obrigado pelo seu contato! Vou verificar e retorno em breve.",
    "Seu pedido foi processado com sucesso!",
    "Temos uma promoção especial para você! Gostaria de saber mais?",
    "Agradecemos sua compra! Se precisar de algo, estamos aqui.",
  ];

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/customers?limit=100");
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
      }
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      // Note: This would need a WhatsApp API endpoint to actually send
      // For now, we'll just redirect to WhatsApp page with the customer
      const customer = customers.find((c) => c.id === formData.customerId);
      if (customer) {
        router.push(
          `/dashboard/whatsapp?contact=${encodeURIComponent(customer.name)}`
        );
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      alert("Erro ao enviar mensagem");
    } finally {
      setSending(false);
    }
  };

  const useQuickMessage = (msg: string) => {
    setFormData({ ...formData, message: msg });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/whatsapp">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-xl sm:text-3xl font-bold">Enviar Mensagem</h1>
          <p className="text-muted-foreground">Envie uma mensagem rápida via WhatsApp</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Nova Mensagem
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="customer">
                Destinatário <span className="text-destructive">*</span>
              </Label>
              <select
                id="customer"
                value={formData.customerId}
                onChange={(e) =>
                  setFormData({ ...formData, customerId: e.target.value })
                }
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Selecione um cliente</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} ({customer.phoneE164})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Mensagens Rápidas</Label>
              <div className="grid grid-cols-1 gap-2">
                {quickMessages.map((msg, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="justify-start text-left h-auto py-3"
                    onClick={() => useQuickMessage(msg)}
                  >
                    {msg}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">
                Mensagem <span className="text-destructive">*</span>
              </Label>
              <textarea
                id="message"
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                required
                className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Digite sua mensagem..."
              />
              <p className="text-xs text-muted-foreground">
                {formData.message.length} caracteres
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={sending}>
                <Send className="h-4 w-4 mr-2" />
                {sending ? "Enviando..." : "Enviar Mensagem"}
              </Button>
              <Link href="/dashboard/whatsapp">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

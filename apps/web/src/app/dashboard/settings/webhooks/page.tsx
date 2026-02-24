"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  Check as CheckIcon,
  X,
} from "lucide-react";

interface WebhookEndpoint {
  id: string;
  url: string;
  active: boolean;
  events: string[];
  secret?: string;
  createdAt: Date;
}

const AVAILABLE_EVENTS = [
  { id: 'customer.created', label: 'Cliente Criado' },
  { id: 'customer.updated', label: 'Cliente Atualizado' },
  { id: 'order.created', label: 'Pedido Criado' },
  { id: 'order.updated', label: 'Pedido Atualizado' },
  { id: 'order.paid', label: 'Pedido Pago' },
  { id: 'message.received', label: 'Mensagem Recebida' },
  { id: 'message.sent', label: 'Mensagem Enviada' },
  { id: 'payment.success', label: 'Pagamento Confirmado' },
  { id: 'nps.response', label: 'Resposta NPS' },
];

export default function WebhooksPage() {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState<string | null>(null);

  // Form state
  const [newUrl, setNewUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  // Fetch endpoints
  const fetchEndpoints = async () => {
    try {
      const response = await fetch('/api/webhooks/endpoints');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setEndpoints(data.endpoints);
    } catch (error) {
      console.error('Error fetching endpoints:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEndpoints();
  }, []);

  // Create endpoint
  const handleCreate = async () => {
    if (!newUrl || selectedEvents.length === 0) {
      alert('Preencha a URL e selecione pelo menos um evento');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/webhooks/endpoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: newUrl,
          events: selectedEvents,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar webhook');
      }

      const data = await response.json();

      // Mostrar secret gerado
      alert(`Webhook criado! Secret: ${data.endpoint.secret}\n\nGuarde este secret em local seguro!`);

      // Reset form
      setNewUrl("");
      setSelectedEvents([]);
      setShowForm(false);

      // Refresh list
      fetchEndpoints();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setCreating(false);
    }
  };

  // Toggle endpoint active/inactive
  const toggleEndpoint = async (id: string, currentActive: boolean) => {
    try {
      const response = await fetch(`/api/webhooks/endpoints/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      });

      if (!response.ok) throw new Error('Failed to update');

      fetchEndpoints();
    } catch (error) {
      console.error('Error toggling endpoint:', error);
      alert('Erro ao atualizar webhook');
    }
  };

  // Delete endpoint
  const deleteEndpoint = async (id: string) => {
    if (!confirm('Deseja realmente deletar este webhook?')) return;

    try {
      const response = await fetch(`/api/webhooks/endpoints/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      fetchEndpoints();
    } catch (error) {
      console.error('Error deleting endpoint:', error);
      alert('Erro ao deletar webhook');
    }
  };

  // Copy secret
  const copySecret = async (id: string) => {
    try {
      const response = await fetch(`/api/webhooks/endpoints/${id}`);
      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      await navigator.clipboard.writeText(data.endpoint.secret);

      setCopiedSecret(id);
      setTimeout(() => setCopiedSecret(null), 2000);
    } catch (error) {
      console.error('Error copying secret:', error);
      alert('Erro ao copiar secret');
    }
  };

  // Toggle event selection
  const toggleEvent = (eventId: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId)
        ? prev.filter((e) => e !== eventId)
        : [...prev, eventId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Webhooks</h1>
          <p className="text-muted-foreground">
            Configure webhooks para integrar com sistemas externos
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="w-full sm:w-auto">
          {showForm ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          {showForm ? 'Cancelar' : 'Novo Webhook'}
        </Button>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm">
              <p className="font-medium text-blue-900">Como funcionam os webhooks?</p>
              <p className="text-blue-700">
                Quando um evento selecionado ocorrer, o sistema enviará automaticamente uma requisição POST para sua URL com os dados do evento.
                A requisição incluirá um header <code className="bg-blue-100 px-1 rounded">X-Webhook-Signature</code> com assinatura HMAC-SHA256 para validação.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Criar Novo Webhook</CardTitle>
            <CardDescription>
              Configure uma URL para receber eventos em tempo real
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">URL do Endpoint</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://seu-dominio.com/webhook"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                A URL deve ser HTTPS e aceitar requisições POST
              </p>
            </div>

            <div className="space-y-2">
              <Label>Eventos</Label>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_EVENTS.map((event) => (
                  <div
                    key={event.id}
                    className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${selectedEvents.includes(event.id)
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-gray-50'
                      }`}
                    onClick={() => toggleEvent(event.id)}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedEvents.includes(event.id)
                      ? 'bg-primary border-primary'
                      : 'border-gray-300'
                      }`}>
                      {selectedEvents.includes(event.id) && (
                        <CheckIcon className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <span className="text-sm">{event.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={handleCreate} disabled={creating} className="w-full">
              {creating ? 'Criando...' : 'Criar Webhook'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Endpoints List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Webhooks Configurados</CardTitle>
              <CardDescription>
                {endpoints.length} webhook{endpoints.length !== 1 ? 's' : ''} configurado{endpoints.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchEndpoints}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          ) : endpoints.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum webhook configurado</p>
              <p className="text-sm mt-2">Clique em "Novo Webhook" para começar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {endpoints.map((endpoint) => (
                <div
                  key={endpoint.id}
                  className="flex items-start justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {endpoint.url}
                      </code>
                      <Badge variant={endpoint.active ? "default" : "secondary"}>
                        {endpoint.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {endpoint.events.map((event) => (
                        <Badge key={event} variant="outline" className="text-xs">
                          {AVAILABLE_EVENTS.find((e) => e.id === event)?.label || event}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Criado em {new Date(endpoint.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copySecret(endpoint.id)}
                      title="Copiar Secret"
                    >
                      {copiedSecret === endpoint.id ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleEndpoint(endpoint.id, endpoint.active)}
                      title={endpoint.active ? 'Desativar' : 'Ativar'}
                    >
                      {endpoint.active ? (
                        <X className="h-4 w-4 text-orange-600" />
                      ) : (
                        <CheckIcon className="h-4 w-4 text-green-600" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteEndpoint(endpoint.id)}
                      title="Deletar"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documentation Card */}
      <Card>
        <CardHeader>
          <CardTitle>Documentação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Verificação de Assinatura</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Todas as requisições incluem uma assinatura HMAC-SHA256 no header <code className="bg-gray-100 px-1 rounded">X-Webhook-Signature</code>.
            </p>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
              {`// Node.js
const crypto = require('crypto');

const signature = req.headers['x-webhook-signature'];
const secret = 'seu-webhook-secret';
const payload = JSON.stringify(req.body);

const expectedSignature = crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

const isValid = crypto.timingSafeEqual(
  Buffer.from(signature),
  Buffer.from(expectedSignature)
);`}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Formato do Payload</h3>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
              {`{
  "event": "order.created",
  "timestamp": 1708124400000,
  "companyId": "clx...",
  "data": {
    // Dados do evento
  }
}`}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Retry Automático</h3>
            <p className="text-sm text-muted-foreground">
              Se o endpoint falhar, o sistema tentará reenviar automaticamente com delays crescentes: 1s, 5s, 15s, 1m, 5m (total de 5 tentativas).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

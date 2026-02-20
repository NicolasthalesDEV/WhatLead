"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { Plus, Trash2, Eye, EyeOff, CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface WhatsAppChannel {
  id: string;
  phoneNumberId: string;
  waBusinessId: string;
  displayName: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
}

export function WhatsAppChannelManager() {
  const { showToast } = useToast();
  const [channels, setChannels] = useState<WhatsAppChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showTokens, setShowTokens] = useState<{ [key: string]: boolean }>({});
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    phoneNumberId: "",
    waAccessToken: "",
    waBusinessId: "",
    displayName: "",
  });

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/whatsapp/channels");
      if (response.ok) {
        const data = await response.json();
        setChannels(data.channels || []);
      } else {
        showToast("Erro ao carregar canais", "error");
      }
    } catch (error) {
      console.error("Error loading channels:", error);
      showToast("Erro ao carregar canais", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddChannel = async () => {
    if (!formData.phoneNumberId || !formData.waAccessToken || !formData.waBusinessId) {
      showToast("Preencha todos os campos obrigatórios", "warning");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/whatsapp/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        showToast("Canal WhatsApp adicionado com sucesso!", "success");
        setShowAddDialog(false);
        setFormData({
          phoneNumberId: "",
          waAccessToken: "",
          waBusinessId: "",
          displayName: "",
        });
        await loadChannels();
      } else {
        showToast(data.error || "Erro ao adicionar canal", "error");
      }
    } catch (error) {
      console.error("Error adding channel:", error);
      showToast("Erro ao adicionar canal", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    if (!confirm("Tem certeza que deseja remover este canal?")) {
      return;
    }

    try {
      const response = await fetch(`/api/whatsapp/channels?channelId=${channelId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        if (data.deactivated) {
          showToast("Canal desativado (possui mensagens)", "warning");
        } else {
          showToast("Canal removido com sucesso", "success");
        }
        await loadChannels();
      } else {
        showToast(data.error || "Erro ao remover canal", "error");
      }
    } catch (error) {
      console.error("Error deleting channel:", error);
      showToast("Erro ao remover canal", "error");
    }
  };

  const toggleShowToken = (channelId: string) => {
    setShowTokens((prev) => ({
      ...prev,
      [channelId]: !prev[channelId],
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Carregando canais...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Canais WhatsApp</CardTitle>
              <CardDescription>
                Gerencie os números do WhatsApp conectados à sua conta
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Canal
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {channels.length === 0 ? (
            <div className="text-center py-8">
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-muted-foreground mb-4">
                  Nenhum canal WhatsApp configurado.
                </p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Canal
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {channels.map((channel) => (
                <div
                  key={channel.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{channel.displayName}</span>
                      <Badge
                        variant={channel.status === "ACTIVE" ? "default" : "secondary"}
                      >
                        {channel.status === "ACTIVE" ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Ativo
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Inativo
                          </>
                        )}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>
                        <span className="font-medium">Phone ID:</span>{" "}
                        <code className="bg-gray-100 px-1 rounded">
                          {channel.phoneNumberId}
                        </code>
                      </div>
                      <div>
                        <span className="font-medium">Business ID:</span>{" "}
                        <code className="bg-gray-100 px-1 rounded">
                          {channel.waBusinessId}
                        </code>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Adicionado em{" "}
                        {new Date(channel.createdAt).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteChannel(channel.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info Box */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 text-sm mb-2">
              ℹ️ Sobre os Canais WhatsApp
            </h4>
            <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
              <li>Cada canal representa um número do WhatsApp Business</li>
              <li>Você pode ter múltiplos canais (para diferentes departamentos)</li>
              <li>
                As credenciais são obtidas no{" "}
                <a
                  href="https://developers.facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-900"
                >
                  Meta for Developers
                </a>
              </li>
              <li>Canais com mensagens não podem ser deletados, apenas desativados</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Add Channel Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Adicionar Canal WhatsApp</DialogTitle>
            <DialogDescription>
              Configure um novo número do WhatsApp Business para sua empresa
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumberId">
                Phone Number ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phoneNumberId"
                placeholder="123456789012345"
                value={formData.phoneNumberId}
                onChange={(e) =>
                  setFormData({ ...formData, phoneNumberId: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Encontre em: Meta for Developers → WhatsApp → API Setup
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="waAccessToken">
                Access Token <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="waAccessToken"
                  type={showTokens["new"] ? "text" : "password"}
                  placeholder="EAA..."
                  value={formData.waAccessToken}
                  onChange={(e) =>
                    setFormData({ ...formData, waAccessToken: e.target.value })
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => toggleShowToken("new")}
                >
                  {showTokens["new"] ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Token permanente (não expira). Configure no Meta for Developers.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="waBusinessId">
                WhatsApp Business Account ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="waBusinessId"
                placeholder="123456789012345"
                value={formData.waBusinessId}
                onChange={(e) =>
                  setFormData({ ...formData, waBusinessId: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                ID da conta do WhatsApp Business
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Nome de Exibição (opcional)</Label>
              <Input
                id="displayName"
                placeholder="WhatsApp - Suporte"
                value={formData.displayName}
                onChange={(e) =>
                  setFormData({ ...formData, displayName: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Nome amigável para identificar este canal
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={handleAddChannel} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Validando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Canal
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

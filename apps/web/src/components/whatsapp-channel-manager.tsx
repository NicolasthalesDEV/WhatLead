"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { Plus, Trash2, Eye, EyeOff, CheckCircle2, XCircle, Loader2, Pencil, Power } from "lucide-react";
import { fetchApi } from "@/lib/api";

/** Safe error-message extractor — prevents passing objects to showToast */
function toErrorMsg(data: any, fallback: string): string {
  if (!data) return fallback;
  if (typeof data.error === "string") return data.error;
  if (typeof data.error?.message === "string") return data.error.message;
  return fallback;
}

interface WhatsAppChannel {
  id: string;
  phoneNumberId: string;
  waBusinessId: string;
  displayName: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
}

const emptyForm = {
  phoneNumberId: "",
  waAccessToken: "",
  waBusinessId: "",
  displayName: "",
};

export function WhatsAppChannelManager() {
  const { showToast } = useToast();
  const [channels, setChannels] = useState<WhatsAppChannel[]>([]);
  const [loading, setLoading] = useState(true);

  // Add dialog
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addForm, setAddForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [showAddToken, setShowAddToken] = useState(false);

  // Edit dialog
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingChannel, setEditingChannel] = useState<WhatsAppChannel | null>(null);
  const [editForm, setEditForm] = useState({ ...emptyForm, status: "ACTIVE" as "ACTIVE" | "INACTIVE" });
  const [editing, setEditing] = useState(false);
  const [showEditToken, setShowEditToken] = useState(false);

  // Per-channel action loading
  const [actionLoading, setActionLoading] = useState<{ [id: string]: boolean }>({});

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/whatsapp/channels", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setChannels(data.channels || []);
      } else {
        showToast("Erro ao carregar canais", "error");
      }
    } catch {
      showToast("Erro ao carregar canais", "error");
    } finally {
      setLoading(false);
    }
  };

  // ── ADD ──────────────────────────────────────────────────────────────────────
  const handleAddChannel = async () => {
    if (!addForm.phoneNumberId || !addForm.waAccessToken || !addForm.waBusinessId) {
      showToast("Preencha todos os campos obrigatórios", "warning");
      return;
    }
    setSaving(true);
    try {
      const response = await fetchApi("/api/whatsapp/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(addForm),
      });
      const data = await response.json();
      if (response.ok) {
        showToast("Canal adicionado com sucesso!", "success");
        setShowAddDialog(false);
        setAddForm(emptyForm);
        await loadChannels();
      } else {
        showToast(toErrorMsg(data, "Erro ao adicionar canal"), "error");
      }
    } catch {
      showToast("Erro ao adicionar canal", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── EDIT ─────────────────────────────────────────────────────────────────────
  const openEditDialog = (channel: WhatsAppChannel) => {
    setEditingChannel(channel);
    setEditForm({
      phoneNumberId: channel.phoneNumberId,
      waAccessToken: "",
      waBusinessId: channel.waBusinessId,
      displayName: channel.displayName,
      status: channel.status,
    });
    setShowEditToken(false);
    setShowEditDialog(true);
  };

  const handleEditChannel = async () => {
    if (!editingChannel) return;
    setEditing(true);
    try {
      const payload: any = {
        channelId: editingChannel.id,
        phoneNumberId: editForm.phoneNumberId,
        waBusinessId: editForm.waBusinessId,
        displayName: editForm.displayName,
        status: editForm.status,
      };
      if (editForm.waAccessToken.trim()) {
        payload.waAccessToken = editForm.waAccessToken.trim();
      }
      const response = await fetchApi("/api/whatsapp/channels", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok) {
        showToast("Canal atualizado com sucesso!", "success");
        setShowEditDialog(false);
        setEditingChannel(null);
        await loadChannels();
      } else {
        showToast(toErrorMsg(data, "Erro ao atualizar canal"), "error");
      }
    } catch {
      showToast("Erro ao atualizar canal", "error");
    } finally {
      setEditing(false);
    }
  };

  // ── TOGGLE STATUS ─────────────────────────────────────────────────────────────
  const handleToggleStatus = async (channel: WhatsAppChannel) => {
    const newStatus = channel.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setActionLoading((p) => ({ ...p, [channel.id]: true }));
    try {
      const response = await fetchApi("/api/whatsapp/channels", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ channelId: channel.id, status: newStatus }),
      });
      const data = await response.json();
      if (response.ok) {
        showToast(
          newStatus === "ACTIVE" ? "Canal reativado!" : "Canal desativado",
          newStatus === "ACTIVE" ? "success" : "warning"
        );
        await loadChannels();
      } else {
        showToast(toErrorMsg(data, "Erro ao alterar status"), "error");
      }
    } catch {
      showToast("Erro ao alterar status", "error");
    } finally {
      setActionLoading((p) => ({ ...p, [channel.id]: false }));
    }
  };

  // ── DELETE ────────────────────────────────────────────────────────────────────
  const handleDeleteChannel = async (channel: WhatsAppChannel) => {
    if (!confirm(`Remover o canal "${channel.displayName}"?`)) return;
    setActionLoading((p) => ({ ...p, [channel.id]: true }));
    try {
      const response = await fetchApi(`/api/whatsapp/channels?channelId=${channel.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json();
      if (response.ok) {
        // Remove from local state immediately — covers both true delete and deactivation
        setChannels((prev) => prev.filter((c) => c.id !== channel.id));
        showToast("Canal removido", "success");
      } else {
        showToast(toErrorMsg(data, "Erro ao remover canal"), "error");
      }
    } catch {
      showToast("Erro ao remover canal", "error");
    } finally {
      setActionLoading((p) => ({ ...p, [channel.id]: false }));
    }
  };

  // ── RENDER ────────────────────────────────────────────────────────────────────
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
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div>
              <CardTitle>Canais WhatsApp</CardTitle>
              <CardDescription>Gerencie os números do WhatsApp conectados à sua conta</CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Canal
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {channels.length === 0 ? (
            <div className="text-center py-8">
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-muted-foreground mb-4">Nenhum canal WhatsApp configurado.</p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Canal
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {channels.map((channel) => {
                const busy = actionLoading[channel.id];
                return (
                  <div key={channel.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium">{channel.displayName}</span>
                        <Badge variant={channel.status === "ACTIVE" ? "default" : "secondary"}>
                          {channel.status === "ACTIVE" ? (
                            <><CheckCircle2 className="h-3 w-3 mr-1" />Ativo</>
                          ) : (
                            <><XCircle className="h-3 w-3 mr-1" />Inativo</>
                          )}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-0.5">
                        <div>
                          <span className="font-medium">Phone ID:</span>{" "}
                          <code className="bg-gray-100 px-1 rounded text-xs">{channel.phoneNumberId}</code>
                        </div>
                        <div>
                          <span className="font-medium">Business ID:</span>{" "}
                          <code className="bg-gray-100 px-1 rounded text-xs">{channel.waBusinessId}</code>
                        </div>
                        <div className="text-xs">
                          Adicionado em {new Date(channel.createdAt).toLocaleDateString("pt-BR")}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4 shrink-0">
                      {/* Ativar / Desativar */}
                      <Button
                        variant="outline"
                        size="sm"
                        title={channel.status === "ACTIVE" ? "Desativar canal" : "Reativar canal"}
                        disabled={busy}
                        onClick={() => handleToggleStatus(channel)}
                      >
                        {busy ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Power className={`h-4 w-4 ${channel.status === "ACTIVE" ? "text-green-600" : "text-gray-400"}`} />
                        )}
                      </Button>

                      {/* Editar */}
                      <Button
                        variant="outline"
                        size="sm"
                        title="Editar canal"
                        disabled={busy}
                        onClick={() => openEditDialog(channel)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      {/* Excluir */}
                      <Button
                        variant="outline"
                        size="sm"
                        title="Remover canal"
                        disabled={busy}
                        onClick={() => handleDeleteChannel(channel)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 text-sm mb-2">ℹ️ Sobre os Canais WhatsApp</h4>
            <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
              <li>Cada canal representa um número do WhatsApp Business</li>
              <li>Você pode ter múltiplos canais (para diferentes departamentos)</li>
              <li>
                As credenciais são obtidas no{" "}
                <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">
                  Meta for Developers
                </a>
              </li>
              <li>Canais com mensagens não podem ser deletados, apenas desativados</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* ── ADD DIALOG ──────────────────────────────────────────────────────────── */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Adicionar Canal WhatsApp</DialogTitle>
            <DialogDescription>Configure um novo número do WhatsApp Business</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Phone Number ID <span className="text-red-500">*</span></Label>
              <Input
                placeholder="123456789012345"
                value={addForm.phoneNumberId}
                onChange={(e) => setAddForm({ ...addForm, phoneNumberId: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Meta for Developers → WhatsApp → API Setup</p>
            </div>
            <div className="space-y-2">
              <Label>Access Token <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  type={showAddToken ? "text" : "password"}
                  placeholder="EAA..."
                  value={addForm.waAccessToken}
                  onChange={(e) => setAddForm({ ...addForm, waAccessToken: e.target.value })}
                />
                <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full" onClick={() => setShowAddToken((v) => !v)}>
                  {showAddToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Token permanente (não expira)</p>
            </div>
            <div className="space-y-2">
              <Label>WhatsApp Business Account ID <span className="text-red-500">*</span></Label>
              <Input
                placeholder="123456789012345"
                value={addForm.waBusinessId}
                onChange={(e) => setAddForm({ ...addForm, waBusinessId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Nome de Exibição (opcional)</Label>
              <Input
                placeholder="WhatsApp - Suporte"
                value={addForm.displayName}
                onChange={(e) => setAddForm({ ...addForm, displayName: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleAddChannel} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Validando...</> : <><Plus className="h-4 w-4 mr-2" />Adicionar Canal</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── EDIT DIALOG ─────────────────────────────────────────────────────────── */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Canal WhatsApp</DialogTitle>
            <DialogDescription>Atualize os dados do canal. Deixe o Access Token em branco para manter o atual.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Phone Number ID <span className="text-red-500">*</span></Label>
              <Input
                placeholder="123456789012345"
                value={editForm.phoneNumberId}
                onChange={(e) => setEditForm({ ...editForm, phoneNumberId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>
                Novo Access Token{" "}
                <span className="text-muted-foreground text-xs">(deixe em branco para manter o atual)</span>
              </Label>
              <div className="relative">
                <Input
                  type={showEditToken ? "text" : "password"}
                  placeholder="EAA... (opcional)"
                  value={editForm.waAccessToken}
                  onChange={(e) => setEditForm({ ...editForm, waAccessToken: e.target.value })}
                />
                <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full" onClick={() => setShowEditToken((v) => !v)}>
                  {showEditToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>WhatsApp Business Account ID <span className="text-red-500">*</span></Label>
              <Input
                placeholder="123456789012345"
                value={editForm.waBusinessId}
                onChange={(e) => setEditForm({ ...editForm, waBusinessId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Nome de Exibição</Label>
              <Input
                placeholder="WhatsApp - Suporte"
                value={editForm.displayName}
                onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={editForm.status === "ACTIVE" ? "default" : "outline"}
                  onClick={() => setEditForm({ ...editForm, status: "ACTIVE" })}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Ativo
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={editForm.status === "INACTIVE" ? "default" : "outline"}
                  onClick={() => setEditForm({ ...editForm, status: "INACTIVE" })}
                >
                  <XCircle className="h-4 w-4 mr-1" /> Inativo
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={editing}>Cancelar</Button>
            <Button onClick={handleEditChannel} disabled={editing}>
              {editing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : <><Pencil className="h-4 w-4 mr-2" />Salvar Alterações</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

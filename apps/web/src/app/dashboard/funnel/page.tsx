"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Layers, DollarSign } from "lucide-react";

interface Stage {
  id: string;
  name: string;
  order: number;
  _count: { cards: number };
}

interface Card_ {
  id: string;
  title: string;
  description: string | null;
  value: number | null;
  probability: number;
  tags: string[];
  stageId: string;
  Customer: { id: string; name: string } | null;
  AssignedTo: { id: string; name: string } | null;
}

function fmt(val: number) {
  return (val / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function FunnelPage() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [cards, setCards] = useState<Card_[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStageCreate, setShowStageCreate] = useState(false);
  const [showCardCreate, setShowCardCreate] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<string>("");
  const [stageForm, setStageForm] = useState({ name: "" });
  const [cardForm, setCardForm] = useState({ title: "", description: "", value: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const [stRes, cRes] = await Promise.all([
      fetch("/api/funnel/stages"),
      fetch("/api/funnel/cards"),
    ]);
    if (stRes.ok) { const d = await stRes.json(); setStages(d.stages ?? []); }
    if (cRes.ok) { const d = await cRes.json(); setCards(d.cards ?? []); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function createStage(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/funnel/stages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: stageForm.name }),
    });
    if (res.ok) { setShowStageCreate(false); setStageForm({ name: "" }); load(); }
    setSaving(false);
  }

  async function createCard(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/funnel/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stageId: selectedStageId,
        title: cardForm.title,
        description: cardForm.description || undefined,
        value: cardForm.value ? parseInt(cardForm.value) : undefined,
      }),
    });
    if (res.ok) { setShowCardCreate(false); setCardForm({ title: "", description: "", value: "" }); load(); }
    setSaving(false);
  }

  const totalValue = cards.reduce((s, c) => s + (c.value ?? 0), 0);
  const weightedValue = cards.reduce((s, c) => s + (c.value ?? 0) * (c.probability / 100), 0);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Funil de Vendas</h1>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Layers className="w-3 h-3" />{stages.length} etapa{stages.length !== 1 ? "s" : ""}</span>
            <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{fmt(totalValue)} total | {fmt(Math.round(weightedValue))} ponderado</span>
          </div>
        </div>
        <Button onClick={() => setShowStageCreate(true)} variant="outline" size="sm"><Plus className="w-4 h-4 mr-1" />Nova Etapa</Button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Carregando...</div>
      ) : stages.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground"><Layers className="w-12 h-12 mx-auto mb-2 opacity-30" /><p>Nenhuma etapa criada. Crie a primeira etapa do seu funil!</p></div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map(stage => {
            const stageCards = cards.filter(c => c.stageId === stage.id);
            const stageValue = stageCards.reduce((s, c) => s + (c.value ?? 0), 0);
            return (
              <div key={stage.id} className="flex-shrink-0 w-72">
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-sm">{stage.name}</h3>
                      <p className="text-xs text-muted-foreground">{stageCards.length} card{stageCards.length !== 1 ? "s" : ""} · {fmt(stageValue)}</p>
                    </div>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setSelectedStageId(stage.id); setShowCardCreate(true); }}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {stageCards.map(card => (
                      <div key={card.id} className="bg-background rounded-md p-3 shadow-sm border text-sm">
                        <p className="font-medium leading-tight">{card.title}</p>
                        {card.Customer && <p className="text-xs text-muted-foreground mt-1">{card.Customer.name}</p>}
                        <div className="flex items-center justify-between mt-2">
                          {card.value ? <span className="text-xs font-semibold text-green-700">{fmt(card.value)}</span> : <span />}
                          <Badge variant="outline" className="text-xs">{card.probability}%</Badge>
                        </div>
                        {card.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {card.tags.map(t => <Badge key={t} variant="secondary" className="text-xs px-1 py-0">{t}</Badge>)}
                          </div>
                        )}
                      </div>
                    ))}
                    {stageCards.length === 0 && (
                      <div className="text-center text-xs text-muted-foreground py-4">Arraste cards aqui</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showStageCreate} onOpenChange={setShowStageCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Etapa do Funil</DialogTitle></DialogHeader>
          <form onSubmit={createStage} className="space-y-4">
            <div className="space-y-1"><Label>Nome da etapa *</Label><Input required value={stageForm.name} onChange={e => setStageForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Prospecção, Qualificação..." /></div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setShowStageCreate(false)}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? "Criando..." : "Criar Etapa"}</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showCardCreate} onOpenChange={setShowCardCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Card</DialogTitle></DialogHeader>
          <form onSubmit={createCard} className="space-y-4">
            <div className="space-y-1"><Label>Título *</Label><Input required value={cardForm.title} onChange={e => setCardForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Descrição</Label><Input value={cardForm.description} onChange={e => setCardForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Valor (em centavos)</Label><Input type="number" min="0" value={cardForm.value} onChange={e => setCardForm(f => ({ ...f, value: e.target.value }))} placeholder="Ex: 50000 = R$500,00" /></div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setShowCardCreate(false)}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? "Criando..." : "Criar Card"}</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

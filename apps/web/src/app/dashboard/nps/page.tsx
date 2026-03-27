"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, TrendingUp, Users, ThumbsUp, ThumbsDown, Minus } from "lucide-react";

interface Survey {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  metrics: {
    totalResponses: number;
    promoters: number;
    passives: number;
    detractors: number;
    npsScore: number | null;
  };
}

function NPSGauge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-muted-foreground text-sm">Sem dados</span>;
  const color = score >= 50 ? "text-green-600" : score >= 0 ? "text-yellow-600" : "text-red-600";
  const label = score >= 50 ? "Excelente" : score >= 0 ? "Regular" : "Crítico";
  return (
    <div className="flex flex-col items-center">
      <span className={`text-3xl font-bold ${color}`}>{score}</span>
      <span className={`text-xs ${color}`}>{label}</span>
    </div>
  );
}

export default function NPSPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/nps/surveys");
    if (res.ok) {
      const data = await res.json();
      setSurveys(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function createSurvey(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/nps/surveys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      setShowCreate(false);
      setName("");
      load();
    }
    setSaving(false);
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">NPS — Net Promoter Score</h1>
          <p className="text-muted-foreground text-sm">Meça a satisfação dos seus clientes</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4 mr-2" />Nova Pesquisa</Button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Carregando...</div>
      ) : surveys.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground"><TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-30" /><p>Nenhuma pesquisa NPS criada ainda</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {surveys.map(s => (
            <Card key={s.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{s.name}</CardTitle>
                  <Badge variant={s.active ? "default" : "secondary"}>{s.active ? "Ativa" : "Inativa"}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <NPSGauge score={s.metrics.npsScore} />
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground justify-end"><Users className="w-3 h-3" />{s.metrics.totalResponses} respostas</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-green-50 rounded p-2">
                    <ThumbsUp className="w-3 h-3 text-green-600 mx-auto mb-1" />
                    <p className="font-semibold text-green-700">{s.metrics.promoters}</p>
                    <p className="text-muted-foreground">Promotores</p>
                  </div>
                  <div className="bg-yellow-50 rounded p-2">
                    <Minus className="w-3 h-3 text-yellow-600 mx-auto mb-1" />
                    <p className="font-semibold text-yellow-700">{s.metrics.passives}</p>
                    <p className="text-muted-foreground">Neutros</p>
                  </div>
                  <div className="bg-red-50 rounded p-2">
                    <ThumbsDown className="w-3 h-3 text-red-600 mx-auto mb-1" />
                    <p className="font-semibold text-red-700">{s.metrics.detractors}</p>
                    <p className="text-muted-foreground">Detratores</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Pesquisa NPS</DialogTitle></DialogHeader>
          <form onSubmit={createSurvey} className="space-y-4">
            <div className="space-y-1"><Label>Nome da pesquisa *</Label><Input required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Satisfação Geral Q1 2025" /></div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? "Criando..." : "Criar Pesquisa"}</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

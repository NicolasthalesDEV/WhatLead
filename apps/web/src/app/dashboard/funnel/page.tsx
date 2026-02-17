"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  MoreVertical,
  Settings,
  Trash2,
  Edit,
  DollarSign,
  User,
  Mail,
  Phone,
  Calendar,
  Target,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FunnelStage {
  id: string;
  name: string;
  description?: string;
  color: string;
  order: number;
  isActive: boolean;
  _count: {
    cards: number;
  };
}

interface FunnelCard {
  id: string;
  stageId: string;
  title: string;
  description?: string;
  value?: number;
  probability: number;
  email?: string;
  phone?: string;
  position: number;
  enteredStageAt: string;
  lastActivityAt: string;
  tags: string[];
  customer?: {
    id: string;
    name: string;
    phoneE164: string;
    email?: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function FunnelKanbanPage() {
  const [stages, setStages] = useState<FunnelStage[]>([]);
  const [cards, setCards] = useState<FunnelCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedCard, setDraggedCard] = useState<FunnelCard | null>(null);
  const [newStageName, setNewStageName] = useState("");
  const [showNewStageForm, setShowNewStageForm] = useState(false);
  const [showNewCardForm, setShowNewCardForm] = useState<string | null>(null);
  const [showMetrics, setShowMetrics] = useState(true);
  const [newCardData, setNewCardData] = useState({
    title: "",
    description: "",
    value: "",
    probability: 50,
    email: "",
    phone: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [stagesRes, cardsRes] = await Promise.all([
        fetch("/api/funnel/stages"),
        fetch("/api/funnel/cards"),
      ]);

      if (stagesRes.ok && cardsRes.ok) {
        const stagesData = await stagesRes.json();
        const cardsData = await cardsRes.json();
        setStages(stagesData.stages || []);
        setCards(cardsData.cards || []);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (card: FunnelCard) => {
    setDraggedCard(card);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (stageId: string) => {
    if (!draggedCard) return;

    try {
      // Encontrar a última posição no estágio de destino
      const cardsInStage = cards.filter((c) => c.stageId === stageId);
      const newPosition = cardsInStage.length;

      const res = await fetch(`/api/funnel/cards/${draggedCard.id}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId, position: newPosition }),
      });

      if (res.ok) {
        await loadData();
      }
    } catch (error) {
      console.error("Erro ao mover card:", error);
    } finally {
      setDraggedCard(null);
    }
  };

  const handleCreateStage = async () => {
    if (!newStageName.trim()) return;

    try {
      const res = await fetch("/api/funnel/stages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newStageName }),
      });

      if (res.ok) {
        setNewStageName("");
        setShowNewStageForm(false);
        await loadData();
      }
    } catch (error) {
      console.error("Erro ao criar estágio:", error);
    }
  };

  const handleDeleteStage = async (stageId: string) => {
    if (!confirm("Tem certeza que deseja deletar este estágio?")) return;

    try {
      const res = await fetch(`/api/funnel/stages/${stageId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await loadData();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao deletar estágio");
      }
    } catch (error) {
      console.error("Erro ao deletar estágio:", error);
    }
  };

  const handleCreateCard = async (stageId: string) => {
    if (!newCardData.title.trim()) return;

    try {
      const res = await fetch("/api/funnel/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stageId,
          ...newCardData,
        }),
      });

      if (res.ok) {
        setNewCardData({
          title: "",
          description: "",
          value: "",
          probability: 50,
          email: "",
          phone: "",
        });
        setShowNewCardForm(null);
        await loadData();
      }
    } catch (error) {
      console.error("Erro ao criar card:", error);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm("Tem certeza que deseja deletar este card?")) return;

    try {
      const res = await fetch(`/api/funnel/cards/${cardId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await loadData();
      }
    } catch (error) {
      console.error("Erro ao deletar card:", error);
    }
  };

  const getCardsForStage = (stageId: string) => {
    return cards.filter((c) => c.stageId === stageId).sort((a, b) => a.position - b.position);
  };

  const formatCurrency = (value?: number) => {
    if (!value) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const calculateStageValue = (stageId: string) => {
    const stageCards = getCardsForStage(stageId);
    const total = stageCards.reduce((sum, card) => {
      return sum + (card.value ? Number(card.value) : 0);
    }, 0);
    return total;
  };

  const getTotalValue = () => {
    return cards.reduce((sum, card) => sum + (card.value ? Number(card.value) : 0), 0);
  };

  const getWeightedValue = () => {
    return cards.reduce(
      (sum, card) => sum + (card.value ? Number(card.value) * (card.probability / 100) : 0),
      0
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Carregando funil...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Funil de Vendas</h1>
          <p className="text-muted-foreground">
            Gerencie seu pipeline de vendas com drag-and-drop
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowMetrics(!showMetrics)}>
            <BarChart3 className="h-4 w-4 mr-2" />
            {showMetrics ? "Ocultar" : "Mostrar"} Métricas
          </Button>
          <Button onClick={() => setShowNewStageForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Estágio
          </Button>
        </div>
      </div>

      {showMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Cards</p>
                <p className="text-2xl font-bold">{cards.length}</p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">{formatCurrency(getTotalValue())}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor Ponderado</p>
                <p className="text-2xl font-bold">{formatCurrency(getWeightedValue())}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Por probabilidade
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ticket Médio</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(cards.length > 0 ? getTotalValue() / cards.length : 0)}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-500" />
            </div>
          </Card>
        </div>
      )}

      {showNewStageForm && (
        <Card className="p-4">
          <div className="space-y-3">
            <Label>Nome do Estágio</Label>
            <div className="flex gap-2">
              <Input
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                placeholder="Ex: Qualificação"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateStage();
                  if (e.key === "Escape") setShowNewStageForm(false);
                }}
              />
              <Button onClick={handleCreateStage}>Criar</Button>
              <Button variant="outline" onClick={() => setShowNewStageForm(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <div
            key={stage.id}
            className="flex-shrink-0 w-80"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(stage.id)}
          >
            <Card>
              <div
                className="p-4 border-b"
                style={{ borderTopColor: stage.color, borderTopWidth: 3 }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold">{stage.name}</h3>
                    {stage.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {stage.description}
                      </p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDeleteStage(stage.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Deletar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{stage._count.cards} cards</span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(calculateStageValue(stage.id))}
                  </span>
                </div>
              </div>

              <div className="p-3 space-y-2 min-h-[200px] max-h-[600px] overflow-y-auto">
                {getCardsForStage(stage.id).map((card) => (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={() => handleDragStart(card)}
                    className="cursor-move"
                  >
                    <Card className="p-3 hover:shadow-md transition-shadow bg-card">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm flex-1">{card.title}</h4>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDeleteCard(card.id)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Deletar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {card.description && (
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {card.description}
                        </p>
                      )}

                      <div className="space-y-1 text-xs">
                        {card.value && (
                          <div className="flex items-center gap-1 text-green-600">
                            <DollarSign className="h-3 w-3" />
                            <span className="font-medium">{formatCurrency(card.value)}</span>
                          </div>
                        )}

                        {card.customer && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{card.customer.name}</span>
                          </div>
                        )}

                        {card.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{card.email}</span>
                          </div>
                        )}

                        {card.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>{card.phone}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-1 text-muted-foreground pt-1">
                          <Target className="h-3 w-3" />
                          <span>{card.probability}% probabilidade</span>
                        </div>
                      </div>

                      {card.tags.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {card.tags.map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </Card>
                  </div>
                ))}

                {showNewCardForm === stage.id ? (
                  <Card className="p-3 bg-muted/50">
                    <div className="space-y-2">
                      <Input
                        placeholder="Título do card"
                        value={newCardData.title}
                        onChange={(e) =>
                          setNewCardData({ ...newCardData, title: e.target.value })
                        }
                        className="h-8 text-sm"
                      />
                      <Input
                        placeholder="Email"
                        type="email"
                        value={newCardData.email}
                        onChange={(e) =>
                          setNewCardData({ ...newCardData, email: e.target.value })
                        }
                        className="h-8 text-sm"
                      />
                      <Input
                        placeholder="Valor (R$)"
                        type="number"
                        value={newCardData.value}
                        onChange={(e) =>
                          setNewCardData({ ...newCardData, value: e.target.value })
                        }
                        className="h-8 text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleCreateCard(stage.id)}
                          className="h-7 text-xs"
                        >
                          Criar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowNewCardForm(null)}
                          className="h-7 text-xs"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowNewCardForm(stage.id)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Adicionar card
                  </Button>
                )}
              </div>
            </Card>
          </div>
        ))}

        {stages.length === 0 && (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Nenhum estágio criado ainda
              </p>
              <Button onClick={() => setShowNewStageForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Estágio
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  User,
  Calendar,
  Clock,
  Edit,
  Send,
  Lock,
  Unlock,
  MessageSquare,
} from "lucide-react";

interface TicketComment {
  id: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface TicketDetails {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  firstResponseAt?: string;
  slaDeadline?: string;
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
    role: string;
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  comments: TicketComment[];
}

export default function TicketDetailsPage() {
  const router = useRouter();
  const routeParams = useParams<{ id: string }>();
  const id = routeParams?.id;
  const [ticket, setTicket] = useState<TicketDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [addingComment, setAddingComment] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadTicket();
  }, [id]);

  const loadTicket = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tickets/${id}`);
      if (res.ok) {
        const data = await res.json();
        setTicket(data.ticket);
      } else {
        router.push("/dashboard/tickets");
      }
    } catch (error) {
      console.error("Erro ao carregar ticket:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!ticket) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        await loadTicket();
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    } finally {
      setUpdating(false);
    }
  };

  const updatePriority = async (newPriority: string) => {
    if (!ticket) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority }),
      });

      if (res.ok) {
        await loadTicket();
      }
    } catch (error) {
      console.error("Erro ao atualizar prioridade:", error);
    } finally {
      setUpdating(false);
    }
  };

  const addComment = async () => {
    if (!ticket || !newComment.trim()) return;

    setAddingComment(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newComment,
          isInternal: isInternalComment,
        }),
      });

      if (res.ok) {
        setNewComment("");
        setIsInternalComment(false);
        await loadTicket();
      }
    } catch (error) {
      console.error("Erro ao adicionar comentário:", error);
    } finally {
      setAddingComment(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      OPEN: { variant: "default", label: "Aberto" },
      IN_PROGRESS: { variant: "default", label: "Em Andamento" },
      WAITING_CUSTOMER: { variant: "secondary", label: "Aguardando Cliente" },
      WAITING_INTERNAL: { variant: "secondary", label: "Aguardando Interno" },
      RESOLVED: { variant: "default", label: "Resolvido" },
      CLOSED: { variant: "outline", label: "Fechado" },
      CANCELLED: { variant: "destructive", label: "Cancelado" },
    };

    const config = variants[status] || variants.OPEN;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: "bg-gray-100 text-gray-800",
      MEDIUM: "bg-blue-100 text-blue-800",
      HIGH: "bg-orange-100 text-orange-800",
      URGENT: "bg-red-100 text-red-800",
    };

    const labels: Record<string, string> = {
      LOW: "Baixa",
      MEDIUM: "Média",
      HIGH: "Alta",
      URGENT: "Urgente",
    };

    return <Badge className={colors[priority]}>{labels[priority]}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Carregando ticket...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Ticket não encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{ticket.subject}</h1>
            <p className="text-muted-foreground">Ticket #{ticket.id.slice(-8)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {getStatusBadge(ticket.status)}
          {getPriorityBadge(ticket.priority)}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={updating}>
                <Edit className="h-4 w-4 mr-2" />
                Alterar Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => updateStatus("OPEN")}>
                Aberto
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateStatus("IN_PROGRESS")}>
                Em Andamento
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateStatus("WAITING_CUSTOMER")}>
                Aguardando Cliente
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateStatus("WAITING_INTERNAL")}>
                Aguardando Interno
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateStatus("RESOLVED")}>
                Resolvido
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateStatus("CLOSED")}>
                Fechado
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={updating}>
                <Edit className="h-4 w-4 mr-2" />
                Alterar Prioridade
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => updatePriority("LOW")}>
                Baixa
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updatePriority("MEDIUM")}>
                Média
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updatePriority("HIGH")}>
                Alta
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updatePriority("URGENT")}>
                Urgente
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Descrição</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{ticket.description}</p>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Comentários ({ticket.comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ticket.comments.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Nenhum comentário ainda
                </p>
              ) : (
                ticket.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`p-4 rounded-lg ${comment.isInternal
                        ? "bg-yellow-50 border border-yellow-200"
                        : "bg-muted"
                      }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="font-semibold">{comment.user.name}</span>
                        {comment.isInternal && (
                          <Badge variant="secondary" className="text-xs">
                            <Lock className="h-3 w-3 mr-1" />
                            Interno
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap">{comment.content}</p>
                  </div>
                ))
              )}

              {/* Add Comment Form */}
              <div className="pt-4 border-t space-y-3">
                <Label>Adicionar Comentário</Label>
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escreva seu comentário..."
                  rows={4}
                />
                <div className="flex items-center justify-between">
                  <Button
                    variant={isInternalComment ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsInternalComment(!isInternalComment)}
                  >
                    {isInternalComment ? (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Nota Interna
                      </>
                    ) : (
                      <>
                        <Unlock className="h-4 w-4 mr-2" />
                        Comentário Público
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={addComment}
                    disabled={addingComment || !newComment.trim()}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {addingComment ? "Enviando..." : "Enviar"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <div className="mt-1">{getStatusBadge(ticket.status)}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Prioridade</Label>
                <div className="mt-1">{getPriorityBadge(ticket.priority)}</div>
              </div>
              {ticket.category && (
                <div>
                  <Label className="text-xs text-muted-foreground">Categoria</Label>
                  <p className="mt-1">{ticket.category}</p>
                </div>
              )}
              {ticket.tags.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Tags</Label>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {ticket.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* People */}
          <Card>
            <CardHeader>
              <CardTitle>Pessoas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Criado por</Label>
                <div className="mt-1 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{ticket.createdBy.name}</span>
                </div>
              </div>
              {ticket.assignedTo && (
                <div>
                  <Label className="text-xs text-muted-foreground">Atribuído a</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{ticket.assignedTo.name}</span>
                  </div>
                </div>
              )}
              {ticket.customer && (
                <div>
                  <Label className="text-xs text-muted-foreground">Cliente</Label>
                  <div className="mt-1">
                    <p className="font-semibold">{ticket.customer.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {ticket.customer.phoneE164}
                    </p>
                    {ticket.customer.email && (
                      <p className="text-sm text-muted-foreground">
                        {ticket.customer.email}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => router.push(`/dashboard/customers/${ticket.customer!.id}`)}
                  >
                    Ver Perfil
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Linha do Tempo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Criado em</p>
                  <p>{formatDate(ticket.createdAt)}</p>
                </div>
              </div>
              {ticket.firstResponseAt && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Primeira resposta</p>
                    <p>{formatDate(ticket.firstResponseAt)}</p>
                  </div>
                </div>
              )}
              {ticket.resolvedAt && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Resolvido em</p>
                    <p>{formatDate(ticket.resolvedAt)}</p>
                  </div>
                </div>
              )}
              {ticket.slaDeadline && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <div>
                    <p className="text-muted-foreground">Prazo SLA</p>
                    <p className="text-orange-600">{formatDate(ticket.slaDeadline)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

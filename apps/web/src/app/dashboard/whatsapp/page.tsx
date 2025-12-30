"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import {
  MessageSquare,
  Search,
  Plus,
  Send,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile
} from "lucide-react";

function WhatsAppContent() {
  const searchParams = useSearchParams();
  const [selectedContact, setSelectedContact] = useState<string | null>(null);

  useEffect(() => {
    const contact = searchParams.get('contact');
    if (contact) {
      setSelectedContact(contact);
    }
  }, [searchParams]);
  // Dados simulados de conversas
  const conversations = [
    {
      id: 1,
      customer: "João Silva",
      lastMessage: "Gostaria de saber mais sobre o produto",
      time: "14:32",
      unread: 2,
      online: true,
      avatar: "JS"
    },
    {
      id: 2,
      customer: "Maria Santos",
      lastMessage: "Obrigada! Vou finalizar o pedido",
      time: "13:45",
      unread: 0,
      online: false,
      avatar: "MS"
    },
    {
      id: 3,
      customer: "Pedro Costa",
      lastMessage: "Qual o prazo de entrega?",
      time: "12:15",
      unread: 1,
      online: true,
      avatar: "PC"
    },
    {
      id: 4,
      customer: "Ana Silva",
      lastMessage: "Produto chegou perfeito!",
      time: "11:30",
      unread: 0,
      online: false,
      avatar: "AS"
    },
  ];

  // Mensagens da conversa ativa (João Silva)
  const messages = [
    {
      id: 1,
      sender: "customer",
      content: "Olá! Vi seus produtos no catálogo",
      time: "14:28",
      status: "read"
    },
    {
      id: 2,
      sender: "agent",
      content: "Olá João! Seja muito bem-vindo! 😊\nComo posso te ajudar hoje?",
      time: "14:29",
      status: "read"
    },
    {
      id: 3,
      sender: "customer",
      content: "Gostaria de saber mais sobre o Painel LED 20W",
      time: "14:30",
      status: "read"
    },
    {
      id: 4,
      sender: "agent",
      content: "Claro! É um excelente produto. Tem iluminação branca neutra 4000K, muito econômico e com garantia de 2 anos.",
      time: "14:31",
      status: "read"
    },
    {
      id: 5,
      sender: "customer",
      content: "Gostaria de saber mais sobre o produto",
      time: "14:32",
      status: "delivered"
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">WhatsApp</h1>
          <p className="text-muted-foreground">
            Central de atendimento e conversas
          </p>
        </div>
        <Link href="/dashboard/quick-actions/send-message">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Conversa
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversas Ativas</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-muted-foreground">+8 novas hoje</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensagens Hoje</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">187</div>
            <p className="text-xs text-muted-foreground">+15% vs ontem</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Resposta</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.5min</div>
            <p className="text-xs text-muted-foreground">Tempo médio</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Conversão</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24%</div>
            <p className="text-xs text-muted-foreground">Conversa → Venda</p>
          </CardContent>
        </Card>
      </div>

      {/* WhatsApp Interface */}
      <div className="grid gap-4 lg:grid-cols-3 h-[600px]">
        {/* Conversations List */}
        <Card>
          <CardHeader>
            <CardTitle>Conversas</CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar conversas..." className="pl-8" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-0">
              {conversations.map((conversation) => {
                const isSelected = selectedContact === conversation.customer;
                return (
                  <div
                    key={conversation.id}
                    className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b transition-colors ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                    onClick={() => setSelectedContact(conversation.customer)}
                  >
                    <div className="relative">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-semibold text-sm">
                          {conversation.avatar}
                        </span>
                      </div>
                      {conversation.online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className={`font-semibold text-sm truncate ${isSelected ? 'text-blue-700' : ''
                          }`}>{conversation.customer}</h3>
                        <span className="text-xs text-muted-foreground">{conversation.time}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage}</p>
                        {conversation.unread > 0 && (
                          <Badge className="ml-2 bg-green-500 hover:bg-green-500 text-white text-xs">
                            {conversation.unread}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2">
          <CardHeader className="border-b">
            {selectedContact ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-semibold text-sm">
                        {selectedContact.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedContact}</h3>
                    <p className="text-sm text-green-600">Online</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="ghost">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground">Selecione uma conversa</h3>
                  <p className="text-sm text-muted-foreground">Escolha um cliente para começar a conversar</p>
                </div>
              </div>
            )}
          </CardHeader>

          {selectedContact ? (
            <>
              {/* Messages */}
              <CardContent className="flex-1 p-4 space-y-4 h-[400px] overflow-y-auto">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-md px-4 py-2 rounded-lg ${message.sender === 'agent'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-gray-100 text-gray-900'
                      }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className={`text-xs mt-1 ${message.sender === 'agent'
                          ? 'text-primary-foreground/70'
                          : 'text-gray-500'
                        }`}>
                        {message.time}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="ghost">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 relative">
                    <Input placeholder="Digite sua mensagem..." className="pr-10" />
                    <Button size="sm" variant="ghost" className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <Smile className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button size="sm">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </Card>
      </div>

      {/* Quick Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Modelos Rápidos</CardTitle>
          <CardDescription>Mensagens pré-definidas para agilizar o atendimento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
            <Button variant="outline" className="h-auto p-3 text-left justify-start">
              <div>
                <div className="font-medium">Boas-vindas</div>
                <div className="text-sm text-muted-foreground">Olá! Como posso ajudar?</div>
              </div>
            </Button>
            <Button variant="outline" className="h-auto p-3 text-left justify-start">
              <div>
                <div className="font-medium">Informações</div>
                <div className="text-sm text-muted-foreground">Vou buscar essas informações...</div>
              </div>
            </Button>
            <Button variant="outline" className="h-auto p-3 text-left justify-start">
              <div>
                <div className="font-medium">Despedida</div>
                <div className="text-sm text-muted-foreground">Obrigado pelo contato!</div>
              </div>
            </Button>
            <Button variant="outline" className="h-auto p-3 text-left justify-start">
              <div>
                <div className="font-medium">Prazo Entrega</div>
                <div className="text-sm text-muted-foreground">Entrega em 3-5 dias úteis</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function WhatsAppPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <WhatsAppContent />
    </Suspense>
  );
}
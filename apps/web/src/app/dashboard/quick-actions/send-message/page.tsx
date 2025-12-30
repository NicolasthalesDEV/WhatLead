"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  MessageSquare,
  Send,
  Search,
  User,
  Phone,
  Image,
  Paperclip,
  Smile,
  Clock,
  Check,
  CheckCheck
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface Contact {
  id: number;
  name: string;
  phone: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
  online: boolean;
}

export default function SendMessagePage() {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [message, setMessage] = useState("");
  const [searchContact, setSearchContact] = useState("");

  // Contatos simulados
  const contacts: Contact[] = [
    {
      id: 1,
      name: "João Silva",
      phone: "(11) 99999-9999",
      lastMessage: "Obrigado pelo atendimento!",
      lastMessageTime: "14:32",
      unread: 0,
      online: true
    },
    {
      id: 2,
      name: "Maria Santos",
      phone: "(11) 88888-8888",
      lastMessage: "Quando chega o produto?",
      lastMessageTime: "13:45",
      unread: 2,
      online: false
    },
    {
      id: 3,
      name: "Pedro Costa",
      phone: "(11) 77777-7777",
      lastMessage: "Perfeito, vou finalizar!",
      lastMessageTime: "12:15",
      unread: 1,
      online: true
    },
    {
      id: 4,
      name: "Ana Silva",
      phone: "(11) 66666-6666",
      lastMessage: "Produto chegou bem!",
      lastMessageTime: "11:30",
      unread: 0,
      online: false
    }
  ];

  // Mensagens pré-definidas
  const quickMessages = [
    "Olá! Como posso ajudar você hoje?",
    "Obrigado pelo seu contato! Vou verificar e retorno em breve.",
    "Seu produto será enviado hoje e deve chegar em 2-3 dias úteis.",
    "Temos uma promoção especial para você! Gostaria de saber mais?",
    "Agradecemos sua compra! Se precisar de algo, estamos aqui.",
    "Confirmo o recebimento do seu pagamento. Obrigado!"
  ];

  const handleSendMessage = () => {
    if (!selectedContact || !message.trim()) return;

    console.log("Enviando mensagem:", {
      contact: selectedContact,
      message: message
    });

    // Limpar mensagem após envio
    setMessage("");
  };

  const handleQuickMessage = (quickMsg: string) => {
    setMessage(quickMsg);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Enviar Mensagem</h1>
            <p className="text-muted-foreground">
              Envie mensagens WhatsApp para seus clientes
            </p>
          </div>
        </div>
        <Button
          onClick={handleSendMessage}
          disabled={!selectedContact || !message.trim()}
        >
          <Send className="mr-2 h-4 w-4" />
          Enviar Mensagem
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Lista de Contatos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Contatos
            </CardTitle>
            <CardDescription>Selecione um contato para conversar</CardDescription>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar contatos..."
                className="pl-8"
                value={searchContact}
                onChange={(e) => setSearchContact(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-0">
              {contacts
                .filter(contact =>
                  contact.name.toLowerCase().includes(searchContact.toLowerCase()) ||
                  contact.phone.includes(searchContact)
                )
                .map((contact) => (
                  <div
                    key={contact.id}
                    className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b ${selectedContact?.id === contact.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    onClick={() => setSelectedContact(contact)}
                  >
                    <div className="relative">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-semibold text-sm">
                          {contact.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      {contact.online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm truncate">{contact.name}</h3>
                        <span className="text-xs text-muted-foreground">{contact.lastMessageTime}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{contact.lastMessage}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-muted-foreground">{contact.phone}</span>
                        {contact.unread > 0 && (
                          <Badge className="bg-green-500 hover:bg-green-500 text-white text-xs">
                            {contact.unread}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Área de Composição */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {selectedContact ? (
                  <>
                    <div className="relative">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-semibold text-sm">
                          {selectedContact.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      {selectedContact.online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">{selectedContact.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedContact.online ? 'Online' : 'Último acesso ' + selectedContact.lastMessageTime}
                      </p>
                    </div>
                  </>
                ) : (
                  <div>
                    <h3 className="font-semibold">Nenhum contato selecionado</h3>
                    <p className="text-sm text-muted-foreground">Selecione um contato para enviar mensagem</p>
                  </div>
                )}
              </div>
              {selectedContact && (
                <Button size="sm" variant="outline">
                  <Phone className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {selectedContact ? (
              <>
                {/* Histórico de Mensagens Simulado */}
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg max-h-60 overflow-y-auto">
                  <div className="flex justify-start">
                    <div className="max-w-xs bg-white p-3 rounded-lg shadow-sm">
                      <p className="text-sm">Olá! Gostaria de saber mais sobre os produtos LED.</p>
                      <div className="flex items-center justify-end mt-1 space-x-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-400">13:40</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="max-w-xs bg-blue-500 text-white p-3 rounded-lg">
                      <p className="text-sm">Claro! Temos várias opções. Qual tipo você procura?</p>
                      <div className="flex items-center justify-end mt-1 space-x-1">
                        <span className="text-xs text-blue-200">13:42</span>
                        <CheckCheck className="h-3 w-3 text-blue-200" />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="max-w-xs bg-white p-3 rounded-lg shadow-sm">
                      <p className="text-sm">{selectedContact.lastMessage}</p>
                      <div className="flex items-center justify-end mt-1 space-x-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-400">{selectedContact.lastMessageTime}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mensagens Rápidas */}
                <div className="space-y-3">
                  <Label>Mensagens Rápidas</Label>
                  <div className="grid gap-2 md:grid-cols-2">
                    {quickMessages.map((quickMsg, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="h-auto p-2 text-left justify-start text-xs"
                        onClick={() => handleQuickMessage(quickMsg)}
                      >
                        {quickMsg}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Área de Digitação */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="message">Nova Mensagem</Label>
                    <textarea
                      id="message"
                      className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Digite sua mensagem..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </div>

                  {/* Ferramentas */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Image className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Smile className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {message.length}/1000 caracteres
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Selecione um contato para começar a conversar</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas Rápidas */}
      {selectedContact && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informações do Contato</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">8</div>
                <div className="text-sm text-muted-foreground">Mensagens hoje</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">3</div>
                <div className="text-sm text-muted-foreground">Pedidos feitos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">R$ 450</div>
                <div className="text-sm text-muted-foreground">Total gasto</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">15 dias</div>
                <div className="text-sm text-muted-foreground">Cliente há</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Search,
  Plus,
  Send,
  Phone,
  MoreVertical,
  Paperclip,
  Smile,
  Image as ImageIcon,
  FileText,
  CheckCheck,
  Check,
  Clock,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Conversation {
  customerId: string;
  customer: {
    name: string;
    phone: string;
  };
  lastMessage: {
    body: string | null;
    type: string;
    direction: string;
    timestamp: Date;
  };
  unreadCount: number;
  assignedTo: {
    id: string;
    name: string;
  } | null;
}

interface Message {
  id: string;
  direction: 'IN' | 'OUT';
  type: string;
  body: string | null;
  templateName?: string;
  status: string;
  media: {
    url: string;
    mimeType: string | null;
    fileName: string | null;
  } | null;
  timestamp: Date;
}

interface Customer {
  id: string;
  name: string;
  phoneE164: string;
  email: string | null;
  tags: string[];
}

interface QuickResponse {
  id: string;
  title: string;
  content: string;
}

export default function WhatsAppPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadOnlyFilter, setUnreadOnlyFilter] = useState(false);
  const [quickResponses, setQuickResponses] = useState<QuickResponse[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (unreadOnlyFilter) params.append('unreadOnly', 'true');

      const response = await fetch(`/api/whatsapp/conversations?${params}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to fetch conversations');
      }

      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      // Silently handle errors - could be auth, network, or DB issues
      setConversations([]);
    }
  };

  // Fetch conversation messages
  const fetchMessages = async (customerId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/whatsapp/conversations/${customerId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to fetch messages');
      }

      const data = await response.json();
      setMessages(data.messages || []);
      setCustomer(data.customer || null);

      // Refresh conversations list to update unread count
      fetchConversations();
    } catch (error) {
      // Silently handle errors - could be auth, network, or DB issues
      setMessages([]);
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch quick responses
  const fetchQuickResponses = async () => {
    try {
      const response = await fetch('/api/chatbot/quick-responses');
      if (!response.ok) {
        setQuickResponses([]);
        return;
      }
      const data = await response.json();
      setQuickResponses(data.quickResponses || []);
    } catch (error) {
      // Silently handle errors - quick responses are optional
      setQuickResponses([]);
    }
  };

  // Send text message
  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedCustomerId || sending) return;

    setSending(true);
    try {
      const response = await fetch(
        `/api/whatsapp/conversations/${selectedCustomerId}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'text',
            text: messageInput.trim(),
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }

      const data = await response.json();

      // Add message to list
      setMessages((prev) => [...prev, data.message]);
      setMessageInput("");

      // Refresh conversations to update last message
      fetchConversations();

      scrollToBottom();
    } catch (error) {
      // User gets feedback via alert, no need for console.error overlay
      alert(error instanceof Error ? error.message : 'Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  // Send media message
  const sendMediaMessage = async (file: File) => {
    if (!selectedCustomerId || sending) return;

    setSending(true);
    try {
      // In production, you'd upload the file first to get a URL
      // For now, we'll show an alert
      alert('Funcionalidade de envio de mídia requer upload para storage (S3, etc.)');

      // Example flow:
      // 1. Upload file to your storage (S3, etc.)
      // 2. Get public URL
      // 3. Send message with media URL

      /*
      const response = await fetch(
        `/api/whatsapp/conversations/${selectedCustomerId}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: file.type.startsWith('image/') ? 'image' : 'document',
            mediaUrl: uploadedUrl,
            caption: '',
            fileName: file.name,
          }),
        }
      );
      */
    } catch (error) {
      // Silently handle - media sending is not yet implemented
    } finally {
      setSending(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      sendMediaMessage(file);
    }
  };

  // Load conversations on mount
  useEffect(() => {
    fetchConversations();
    fetchQuickResponses();

    // Poll for new messages every 5 seconds
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [searchQuery, unreadOnlyFilter]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedCustomerId) {
      fetchMessages(selectedCustomerId);

      // Poll for new messages in active conversation
      const interval = setInterval(() => {
        fetchMessages(selectedCustomerId);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [selectedCustomerId]);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle Enter key to send
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Format message preview
  const formatMessagePreview = (msg: Conversation['lastMessage']) => {
    if (msg.type === 'text') return msg.body || '';
    if (msg.type === 'image') return '📷 Imagem';
    if (msg.type === 'document') return '📄 Documento';
    if (msg.type === 'video') return '🎥 Vídeo';
    if (msg.type === 'audio') return '🎵 Áudio';
    return msg.body || 'Mensagem';
  };

  // Render message status icon
  const renderStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Check className="h-3 w-3" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  // Use quick response
  const useQuickResponse = (content: string) => {
    setMessageInput(content);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">WhatsApp Inbox</h1>
          <p className="text-muted-foreground">
            Central de atendimento e conversas em tempo real
          </p>
        </div>
      </div>

      {/* WhatsApp Interface */}
      <div className="grid gap-4 lg:grid-cols-3 h-[calc(100vh-200px)]">
        {/* Conversations List */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Conversas</CardTitle>
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar conversas..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={unreadOnlyFilter ? "default" : "outline"}
                  onClick={() => setUnreadOnlyFilter(!unreadOnlyFilter)}
                  className="text-xs"
                >
                  {unreadOnlyFilter ? "Todas" : "Não lidas"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-y-auto">
            <div className="space-y-0">
              {conversations.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma conversa encontrada</p>
                </div>
              ) : (
                conversations.map((conv) => {
                  const isSelected = selectedCustomerId === conv.customerId;
                  return (
                    <div
                      key={conv.customerId}
                      className={`flex items-start gap-3 p-4 hover:bg-gray-50 cursor-pointer border-b transition-colors ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                        }`}
                      onClick={() => setSelectedCustomerId(conv.customerId)}
                    >
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-semibold text-sm">
                          {conv.customer.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-sm truncate">
                            {conv.customer.name}
                          </h3>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {format(new Date(conv.lastMessage.timestamp), 'HH:mm', { locale: ptBR })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-1">
                          <p className="text-sm text-muted-foreground truncate">
                            {conv.lastMessage.direction === 'OUT' && '✓ '}
                            {formatMessagePreview(conv.lastMessage)}
                          </p>
                          {conv.unreadCount > 0 && (
                            <Badge className="bg-green-500 hover:bg-green-500 text-white text-xs h-5 min-w-5 flex items-center justify-center">
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </div>
                        {conv.assignedTo && (
                          <p className="text-xs text-muted-foreground mt-1">
                            👤 {conv.assignedTo.name}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2 flex flex-col">
          {selectedCustomerId && customer ? (
            <>
              {/* Chat Header */}
              <CardHeader className="border-b pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-semibold text-sm">
                        {customer.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold">{customer.name}</h3>
                      <p className="text-sm text-muted-foreground">{customer.phoneE164}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 p-4 space-y-3 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>Nenhuma mensagem ainda</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.direction === 'OUT' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${message.direction === 'OUT'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-gray-100 text-gray-900'
                          }`}
                      >
                        {/* Media */}
                        {message.media && (
                          <div className="mb-2">
                            {message.media.mimeType?.startsWith('image/') ? (
                              <img
                                src={message.media.url}
                                alt="Imagem"
                                className="rounded max-w-full h-auto"
                              />
                            ) : (
                              <div className="flex items-center gap-2 p-2 bg-white/10 rounded">
                                <FileText className="h-4 w-4" />
                                <span className="text-sm">{message.media.fileName || 'Arquivo'}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Text */}
                        {message.body && (
                          <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                        )}

                        {/* Timestamp and Status */}
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span
                            className={`text-xs ${message.direction === 'OUT'
                                ? 'text-primary-foreground/70'
                                : 'text-gray-500'
                              }`}
                          >
                            {format(new Date(message.timestamp), 'HH:mm', { locale: ptBR })}
                          </span>
                          {message.direction === 'OUT' && (
                            <span className="text-primary-foreground/70">
                              {renderStatusIcon(message.status)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </CardContent>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex items-end gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept="image/*,application/pdf,.doc,.docx"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sending}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Digite sua mensagem..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={sending}
                      rows={1}
                      className="resize-none min-h-[40px] max-h-[120px]"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={sendMessage}
                    disabled={!messageInput.trim() || sending}
                  >
                    {sending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                  Selecione uma conversa
                </h3>
                <p className="text-sm text-muted-foreground">
                  Escolha um cliente à esquerda para começar a conversar
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Quick Responses */}
      {quickResponses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Respostas Rápidas</CardTitle>
            <CardDescription>Clique para usar uma resposta pré-definida</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
              {quickResponses.slice(0, 8).map((response) => (
                <Button
                  key={response.id}
                  variant="outline"
                  className="h-auto p-3 text-left justify-start"
                  onClick={() => useQuickResponse(response.content)}
                  disabled={!selectedCustomerId}
                >
                  <div className="truncate">
                    <div className="font-medium text-sm">{response.title}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {response.content}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

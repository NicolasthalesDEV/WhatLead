"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
  Camera,
  Mic,
  Video,
  File,
  StopCircle,
  Volume2,
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

  // New conversation states
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  const [newConversationPhone, setNewConversationPhone] = useState("");
  const [startingConversation, setStartingConversation] = useState(false);

  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [showMediaMenu, setShowMediaMenu] = useState(false);
  const [sendingVoice, setSendingVoice] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

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

      const response = await fetch(`/api/whatsapp/conversations?${params}`, { credentials: 'include' });
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
      const response = await fetch(`/api/whatsapp/conversations/${customerId}`, { credentials: 'include' });
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
      const response = await fetch('/api/chatbot/quick-responses', { credentials: 'include' });
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
          credentials: 'include',
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
  const sendMediaMessage = async (file: File, caption?: string) => {
    if (!selectedCustomerId || sending) return;

    setSending(true);
    try {
      // 1. Upload file to get public URL
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/whatsapp/media/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.error || 'Erro ao fazer upload do arquivo');
      }

      const uploadData = await uploadResponse.json();
      const mediaUrl = uploadData.url;

      // 2. Determine message type based on file MIME type
      let messageType: 'image' | 'video' | 'audio' | 'document' = 'document';
      if (file.type.startsWith('image/')) {
        messageType = 'image';
      } else if (file.type.startsWith('video/')) {
        messageType = 'video';
      } else if (file.type.startsWith('audio/')) {
        messageType = 'audio';
      }

      // 3. Send message with media URL
      const messagePayload: any = {
        type: messageType,
        mediaUrl: mediaUrl,
      };

      // Add caption for image/video/document
      if (caption && (messageType === 'image' || messageType === 'video' || messageType === 'document')) {
        messagePayload.caption = caption;
      }

      // Add filename for documents
      if (messageType === 'document') {
        messagePayload.fileName = file.name;
      }

      const response = await fetch(
        `/api/whatsapp/conversations/${selectedCustomerId}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(messagePayload),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao enviar mensagem');
      }

      const data = await response.json();

      // Add message to list
      setMessages((prev) => [...prev, data.message]);

      // Refresh conversations to update last message
      fetchConversations();

      scrollToBottom();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao enviar mídia');
      console.warn('Failed to send media:', error);
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

  // Send current text input as voice audio via ElevenLabs TTS
  const sendAsVoice = async () => {
    if (!messageInput.trim() || !selectedCustomerId || sendingVoice) return;
    setSendingVoice(true);
    try {
      // 1. Generate audio from text
      const ttsRes = await fetch('/api/whatsapp/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text: messageInput.trim() }),
      });

      if (!ttsRes.ok) {
        const err = await ttsRes.json().catch(() => ({ error: 'Falha ao gerar áudio' }));
        throw new Error(err.error || 'Falha ao gerar áudio');
      }

      const audioBlob = await ttsRes.blob();

      // 2. Upload audio to get public URL
      const formData = new FormData();
      formData.append('file', audioBlob, 'voice.mp3');
      const uploadRes = await fetch('/api/whatsapp/media/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({ error: 'Falha ao fazer upload' }));
        throw new Error(err.error || 'Falha ao fazer upload do áudio');
      }

      const { url: mediaUrl } = await uploadRes.json();

      // 3. Send audio message
      const msgRes = await fetch(
        `/api/whatsapp/conversations/${selectedCustomerId}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ type: 'audio', mediaUrl }),
        }
      );

      if (!msgRes.ok) {
        const err = await msgRes.json().catch(() => ({ error: 'Falha ao enviar' }));
        throw new Error(err.error || 'Falha ao enviar áudio');
      }

      const data = await msgRes.json();
      setMessages((prev) => [...prev, data.message]);
      setMessageInput('');
      fetchConversations();
      scrollToBottom();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao enviar áudio via ElevenLabs');
    } finally {
      setSendingVoice(false);
    }
  };

  // Search customers for new conversation
  const searchCustomers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchingCustomers(true);
    try {
      const response = await fetch(
        `/api/customers?search=${encodeURIComponent(query)}&limit=10`,
        { credentials: 'include' }
      );

      if (!response.ok) throw new Error('Erro ao buscar clientes');

      const data = await response.json();
      setSearchResults(data.customers || []);
    } catch (error) {
      console.warn('Failed to search customers:', error);
      setSearchResults([]);
    } finally {
      setSearchingCustomers(false);
    }
  };

  // Debounce customer search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (customerSearch) {
        searchCustomers(customerSearch);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [customerSearch]);

  // Start new conversation with customer
  const startNewConversation = async (customerId: string) => {
    setStartingConversation(true);
    try {
      // Fetch customer details
      const response = await fetch(`/api/customers/${customerId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        let errorMsg = 'Cliente não encontrado';
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorData.message || errorMsg;
        } catch (e) {
          // Se não conseguir parsear o JSON, usa a mensagem padrão
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      const customer = data.customer;

      // Select this customer's conversation
      setSelectedCustomerId(customerId);
      setShowNewConversation(false);
      setCustomerSearch("");
      setSearchResults([]);

      // Refresh conversations to include this one
      await fetchConversations();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(errorMessage);
      console.warn('Failed to start conversation:', error);
    } finally {
      setStartingConversation(false);
    }
  };

  // Start recording audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' });

        // Create file from blob
        const audioFile = audioBlob as any as File;
        Object.defineProperty(audioFile, 'name', {
          value: `audio-${Date.now()}.ogg`,
          writable: false,
        });

        // Send audio file
        await sendMediaMessage(audioFile);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());

        // Reset
        setAudioChunks([]);
        setRecordingTime(0);
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setAudioChunks(chunks);

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

    } catch (error) {
      console.warn('Failed to start recording:', error);
      alert('Erro ao acessar o microfone. Verifique as permissões do navegador.');
    }
  };

  // Stop recording audio
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  // Format recording time
  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Start conversation with phone number
  const startConversationWithPhone = async () => {
    const phone = newConversationPhone.trim();
    if (!phone) {
      alert('Digite um número de telefone');
      return;
    }

    setStartingConversation(true);
    try {
      // Check if customer exists or create new one
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: phone, // Will be updated when they respond
          phone: phone,
        }),
      });

      if (!response.ok) {
        let errorMsg = 'Erro ao criar cliente';
        try {
          const errorData = await response.json();
          // Extrair mensagem de erro de forma segura
          if (typeof errorData.error === 'string') {
            errorMsg = errorData.error;
          } else if (typeof errorData.message === 'string') {
            errorMsg = errorData.message;
          } else if (errorData.error?.message) {
            errorMsg = errorData.error.message;
          }
        } catch (e) {
          // Se não conseguir parsear o JSON, usa a mensagem padrão
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      const customerId = data.customer?.id;

      if (!customerId) {
        throw new Error('ID do cliente não foi retornado pela API');
      }

      // Start conversation with this customer
      await startNewConversation(customerId);
      setNewConversationPhone("");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(errorMessage);
      console.warn('Failed to start conversation with phone:', error);
    } finally {
      setStartingConversation(false);
    }
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
                <Button
                  size="sm"
                  onClick={() => setShowNewConversation(true)}
                  className="text-xs"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Nova Conversa
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
                  {/* Hidden file inputs */}
                  <input
                    ref={imageInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept="image/*"
                  />
                  <input
                    ref={videoInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept="video/*"
                  />
                  <input
                    ref={documentInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                  />

                  {/* Media buttons */}
                  {!isRecording && (
                    <div className="flex gap-1">
                      {/* Image button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={sending}
                        title="Enviar imagem"
                      >
                        <ImageIcon className="h-4 w-4" />
                      </Button>

                      {/* Video button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => videoInputRef.current?.click()}
                        disabled={sending}
                        title="Enviar vídeo"
                      >
                        <Video className="h-4 w-4" />
                      </Button>

                      {/* Document button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => documentInputRef.current?.click()}
                        disabled={sending}
                        title="Enviar documento"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {/* Recording indicator or text input */}
                  {isRecording ? (
                    <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-2 flex-1">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-sm font-medium text-red-600">
                          Gravando... {formatRecordingTime(recordingTime)}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={stopRecording}
                      >
                        <StopCircle className="h-4 w-4 mr-1" />
                        Parar
                      </Button>
                    </div>
                  ) : (
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
                  )}

                  {/* Send, Voice-TTS, or Mic button */}
                  {!isRecording && (
                    messageInput.trim() ? (
                      <div className="flex gap-1">
                        {/* ElevenLabs TTS – send as voice */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={sendAsVoice}
                          disabled={sending || sendingVoice}
                          title="Enviar como áudio (ElevenLabs)"
                        >
                          {sendingVoice ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                          ) : (
                            <Volume2 className="h-4 w-4 text-purple-600" />
                          )}
                        </Button>
                        {/* Regular text send */}
                        <Button
                          size="sm"
                          onClick={sendMessage}
                          disabled={sending || sendingVoice}
                        >
                          {sending ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={startRecording}
                        disabled={sending}
                        title="Gravar áudio"
                      >
                        <Mic className="h-4 w-4" />
                      </Button>
                    )
                  )}
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

      {/* New Conversation Dialog */}
      <Dialog open={showNewConversation} onOpenChange={setShowNewConversation}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nova Conversa</DialogTitle>
            <DialogDescription>
              Busque um cliente existente ou inicie uma conversa com um novo número
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Search existing customers */}
            <div className="space-y-2">
              <Label htmlFor="customer-search">Buscar Cliente</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="customer-search"
                  placeholder="Digite o nome ou telefone..."
                  className="pl-8"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
              </div>
              {searchingCustomers && (
                <p className="text-xs text-muted-foreground">Buscando...</p>
              )}
              {searchResults.length > 0 && (
                <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                  {searchResults.map((customer) => (
                    <div
                      key={customer.id}
                      className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => startNewConversation(customer.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {customer.phoneE164}
                          </p>
                        </div>
                        <Phone className="h-4 w-4 text-muted-foreground" />
                      </div>
                      {customer.tags && customer.tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {customer.tags.slice(0, 3).map((tag, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {customerSearch && !searchingCustomers && searchResults.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Nenhum cliente encontrado
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Ou</span>
              </div>
            </div>

            {/* New phone number */}
            <div className="space-y-2">
              <Label htmlFor="new-phone">Novo Número</Label>
              <div className="flex gap-2">
                <Input
                  id="new-phone"
                  placeholder="+55 11 99999-9999"
                  value={newConversationPhone}
                  onChange={(e) => setNewConversationPhone(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      startConversationWithPhone();
                    }
                  }}
                />
                <Button
                  onClick={startConversationWithPhone}
                  disabled={startingConversation || !newConversationPhone.trim()}
                >
                  {startingConversation ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-1" />
                      Iniciar
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Digite o número com código do país (ex: +55 11 99999-9999)
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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

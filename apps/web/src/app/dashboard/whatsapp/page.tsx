"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Mic,
  Video,
  StopCircle,
  Volume2,
  Pencil,
  X,
  Ban,
  BellOff,
  Bell,
  Trash2,
  MessageSquareX,
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
  deliveryError?: { code: number; title: string; message: string } | null;
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

// Returns phone number when the contact has no real saved name (auto-generated "Cliente XXXX")
function displayName(name: string, phone: string): string {
  if (!name) return phone;
  if (/^Cliente \d+$/.test(name.trim())) return phone;
  if (name === phone) return phone;
  return name;
}

// Initials for avatar — uses last 4 digits of phone when no real name exists
function getInitials(name: string, phone: string): string {
  const d = displayName(name, phone);
  if (d === phone) return phone.slice(-4);
  return d.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function WAAudioPlayer({ src, isOutgoing }: { src: string; isOutgoing: boolean }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bars] = useState<number[]>(() => {
    // Deterministic pseudo-random bars seeded by src length
    const seed = src.length;
    return Array.from({ length: 30 }, (_, i) => {
      const x = Math.sin(seed * 9301 + i * 49297 + 233995) * 0.5 + 0.5;
      return 0.15 + x * 0.7;
    });
  });

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;
    audio.onloadedmetadata = () => setDuration(audio.duration);
    audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
    audio.onended = () => { setPlaying(false); setCurrentTime(0); };
    return () => { audio.pause(); audio.src = ""; };
  }, [src]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else { audio.play().catch(() => null); setPlaying(true); }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * duration;
  };

  const progress = duration > 0 ? currentTime / duration : 0;
  const playedBars = Math.round(progress * bars.length);
  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const barActive = isOutgoing ? "#ffffff" : "#25d366";
  const barInactive = isOutgoing ? "rgba(255,255,255,0.4)" : "rgba(37,211,102,0.3)";

  return (
    <div className="flex items-center gap-2 px-2 py-1" style={{ minWidth: 220, maxWidth: 280 }}>
      {/* Play / Pause button */}
      <button
        onClick={toggle}
        className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
        style={{ background: isOutgoing ? "rgba(255,255,255,0.25)" : "#25d366" }}
        aria-label={playing ? "Pausar áudio" : "Reproduzir áudio"}
      >
        {playing ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill={isOutgoing ? "#fff" : "#fff"}>
            <rect x="2" y="1" width="3.5" height="12" rx="1" />
            <rect x="8.5" y="1" width="3.5" height="12" rx="1" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill={isOutgoing ? "#fff" : "#fff"}>
            <path d="M3 1.5 L12 7 L3 12.5 Z" />
          </svg>
        )}
      </button>

      {/* Waveform bars */}
      <div
        className="flex-1 flex items-center gap-[2px] cursor-pointer"
        style={{ height: 32 }}
        onClick={seek}
        role="slider"
        aria-valuenow={Math.round(progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-full transition-colors duration-150"
            style={{
              height: `${h * 100}%`,
              background: i < playedBars ? barActive : barInactive,
              minWidth: 2,
            }}
          />
        ))}
      </div>

      {/* Time */}
      <span
        className="flex-shrink-0 text-[11px] tabular-nums"
        style={{ color: isOutgoing ? "rgba(255,255,255,0.8)" : "#555", minWidth: 28 }}
      >
        {duration > 0 ? fmt(playing ? currentTime : duration) : "0:00"}
      </span>
    </div>
  );
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

  // Mobile: controla qual painel é exibido (lista ou chat)
  const [mobilePanel, setMobilePanel] = useState<'list' | 'chat'>('list');

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
  const [showQuickResponses, setShowQuickResponses] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  // Contact rename
  const [editingContact, setEditingContact] = useState(false);
  const [editContactValue, setEditContactValue] = useState("");
  const [savingContact, setSavingContact] = useState(false);
  const editContactInputRef = useRef<HTMLInputElement>(null);

  // Contact three-dot menu
  const [showContactMenu, setShowContactMenu] = useState(false);
  const [menuActionLoading, setMenuActionLoading] = useState<string | null>(null);
  const contactMenuRef = useRef<HTMLDivElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Rename / save contact
  const startEditContact = () => {
    if (!customer) return;
    const current = displayName(customer.name, customer.phoneE164);
    setEditContactValue(current === customer.phoneE164 ? "" : current);
    setEditingContact(true);
    // Focus after render
    setTimeout(() => editContactInputRef.current?.focus(), 50);
  };

  const saveContact = async () => {
    if (!customer || !selectedCustomerId) return;
    const trimmed = editContactValue.trim();
    if (!trimmed) { setEditingContact(false); return; }
    setSavingContact(true);
    try {
      const res = await fetch(`/api/customers/${selectedCustomerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: trimmed }),
      });
      if (res.ok) {
        setCustomer((prev) => prev ? { ...prev, name: trimmed } : prev);
        // Also update in conversations list
        setConversations((prev) =>
          prev.map((c) =>
            c.customerId === selectedCustomerId
              ? { ...c, customer: { ...c.customer, name: trimmed } }
              : c
          )
        );
      }
    } catch { /* ignore */ } finally {
      setSavingContact(false);
      setEditingContact(false);
    }
  };

  // ─── Three-dot menu: close on outside click ───────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contactMenuRef.current && !contactMenuRef.current.contains(e.target as Node)) {
        setShowContactMenu(false);
      }
    };
    if (showContactMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showContactMenu]);

  // Block / Unblock contact
  const toggleBlockContact = async () => {
    if (!customer || !selectedCustomerId) return;
    setMenuActionLoading('block');
    const isBlocked = customer.tags.includes('__blocked');
    const newTags = isBlocked
      ? customer.tags.filter((t) => t !== '__blocked')
      : [...customer.tags, '__blocked'];
    try {
      const res = await fetch(`/api/customers/${selectedCustomerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tags: newTags }),
      });
      if (res.ok) setCustomer((prev) => prev ? { ...prev, tags: newTags } : prev);
    } catch { /* ignore */ } finally {
      setMenuActionLoading(null);
      setShowContactMenu(false);
    }
  };

  // Mute / Unmute contact
  const toggleMuteContact = async () => {
    if (!customer || !selectedCustomerId) return;
    setMenuActionLoading('mute');
    const isMuted = customer.tags.includes('__muted');
    const newTags = isMuted
      ? customer.tags.filter((t) => t !== '__muted')
      : [...customer.tags, '__muted'];
    try {
      const res = await fetch(`/api/customers/${selectedCustomerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tags: newTags }),
      });
      if (res.ok) setCustomer((prev) => prev ? { ...prev, tags: newTags } : prev);
    } catch { /* ignore */ } finally {
      setMenuActionLoading(null);
      setShowContactMenu(false);
    }
  };

  // Clear conversation (wipe messages, keep in list)
  const clearConversation = async () => {
    if (!selectedCustomerId) return;
    if (!window.confirm('Apagar todas as mensagens desta conversa?')) return;
    setMenuActionLoading('clear');
    try {
      await fetch(`/api/whatsapp/conversations/${selectedCustomerId}?mode=clear`, {
        method: 'DELETE',
        credentials: 'include',
      });
      setMessages([]);
    } catch { /* ignore */ } finally {
      setMenuActionLoading(null);
      setShowContactMenu(false);
    }
  };

  // Delete conversation (wipe messages + remove from list)
  const deleteConversation = async () => {
    if (!selectedCustomerId) return;
    if (!window.confirm('Remover esta conversa da lista? As mensagens serão apagadas.')) return;
    setMenuActionLoading('delete');
    try {
      await fetch(`/api/whatsapp/conversations/${selectedCustomerId}?mode=delete`, {
        method: 'DELETE',
        credentials: 'include',
      });
      setConversations((prev) => prev.filter((c) => c.customerId !== selectedCustomerId));
      setSelectedCustomerId(null);
      setMessages([]);
      setCustomer(null);
      setMobilePanel('list');
    } catch { /* ignore */ } finally {
      setMenuActionLoading(null);
      setShowContactMenu(false);
    }
  };

  // Use refs so polling intervals always read the latest values
  // without needing to be recreated on every search/filter change
  const searchQueryRef = useRef(searchQuery);
  const unreadOnlyFilterRef = useRef(unreadOnlyFilter);
  useEffect(() => { searchQueryRef.current = searchQuery; }, [searchQuery]);
  useEffect(() => { unreadOnlyFilterRef.current = unreadOnlyFilter; }, [unreadOnlyFilter]);

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQueryRef.current) params.append('search', searchQueryRef.current);
      if (unreadOnlyFilterRef.current) params.append('unreadOnly', 'true');

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
  // silent=true: usado no polling — não mostra spinner nem alerta, evita flicker
  const fetchMessages = async (customerId: string, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await fetch(`/api/whatsapp/conversations/${customerId}`, { credentials: 'include' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to fetch messages');
      }

      const data = await response.json();
      setMessages(data.messages || []);
      setCustomer(data.customer || null);
      // NOTE: do NOT call fetchConversations() here — it already has its own interval
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao carregar mensagens';
      console.error('fetchMessages error:', msg);
      // Só mostra alerta no carregamento inicial, não no polling silencioso
      if (!silent) {
        alert(`Erro ao carregar mensagens: ${msg}`);
        setMessages([]);
        setCustomer(null);
      }
    } finally {
      if (!silent) setLoading(false);
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
      // NOTE: conversations list will update on the next poll (no need to call fetchConversations here)

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
      // Prefere mediaId (upload direto para Meta, sem URL pública necessária)
      // Fallback para url se mediaId não estiver disponível
      const mediaPayloadRef = uploadData.mediaId
        ? { mediaId: uploadData.mediaId as string }
        : { mediaUrl: uploadData.url as string };

      // 2. Determine message type based on file MIME type
      let messageType: 'image' | 'video' | 'audio' | 'document' = 'document';
      if (file.type.startsWith('image/')) {
        messageType = 'image';
      } else if (file.type.startsWith('video/')) {
        messageType = 'video';
      } else if (file.type.startsWith('audio/')) {
        messageType = 'audio';
      }

      // 3. Send message with media ID or URL
      const messagePayload: any = {
        type: messageType,
        ...mediaPayloadRef,
        mimeType: file.type,  // stored in DB so conversations API can render without re-fetching
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

      // If API returned no media (e.g. mediaId path), build a local preview so the
      // message is immediately visible without waiting for the next poll.
      const optimisticMessage = data.message.media
        ? data.message
        : {
          ...data.message,
          media: {
            url: URL.createObjectURL(file),
            mimeType: file.type,
            fileName: file.name,
          },
        };

      // Add message to list
      setMessages((prev) => [...prev, optimisticMessage]);
      // NOTE: conversations list will update on the next poll (no need to call fetchConversations here)

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
    // Reset so the same file can be re-selected
    e.target.value = '';
  };

  // Load conversations on mount — poll every 20s, pause when tab hidden
  useEffect(() => {
    fetchConversations();
    fetchQuickResponses();

    let interval: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (!interval) interval = setInterval(fetchConversations, 20000);
    };
    const stopPolling = () => {
      if (interval) { clearInterval(interval); interval = null; }
    };

    startPolling();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchConversations(); // immediate refresh on tab focus
        startPolling();
      } else {
        stopPolling();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only on mount — search/filter changes are picked up via refs

  // Re-fetch when search or filter changes — debounced 300ms to avoid a request per keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchConversations();
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, unreadOnlyFilter]);

  // Load messages when conversation is selected — poll every 15s
  useEffect(() => {
    if (selectedCustomerId) {
      // Carregamento inicial — mostra spinner
      fetchMessages(selectedCustomerId);

      // Poll silencioso a cada 15s — sem spinner, sem flicker
      const interval = setInterval(() => {
        fetchMessages(selectedCustomerId, true);
      }, 15000);

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
  const renderStatusIcon = (status: string, deliveryError?: { code: number; title: string; message: string } | null) => {
    switch (status) {
      case 'sent':
        return <Check className="h-3 w-3" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case 'failed': {
        const tooltip = deliveryError
          ? `Erro ${deliveryError.code}: ${deliveryError.message}`
          : 'Falha na entrega';
        return (
          <span title={tooltip} className="cursor-help">
            <AlertCircle className="h-3 w-3 text-red-500" />
          </span>
        );
      }
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

      const uploadData = await uploadRes.json();
      const audioPayloadRef = uploadData.mediaId
        ? { mediaId: uploadData.mediaId as string }
        : { mediaUrl: uploadData.url as string };

      // 3. Send audio message
      const msgRes = await fetch(
        `/api/whatsapp/conversations/${selectedCustomerId}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ type: 'audio', ...audioPayloadRef }),
        }
      );

      if (!msgRes.ok) {
        const err = await msgRes.json().catch(() => ({ error: 'Falha ao enviar' }));
        throw new Error(err.error || 'Falha ao enviar áudio');
      }

      const data = await msgRes.json();
      setMessages((prev) => [...prev, data.message]);
      setMessageInput('');
      // conversations list updates on the next poll — no need to call fetchConversations here
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
      // mediaDevices only available in secure context (HTTPS / localhost)
      if (!navigator?.mediaDevices?.getUserMedia) {
        alert('Gravação de áudio não disponível. Acesse via HTTPS ou localhost.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Pick best supported mime type: webm (Chrome/Firefox) → mp4 (Safari) → ogg fallback
      const preferredTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
        'audio/ogg',
      ];
      const mimeType = preferredTypes.find((t) => MediaRecorder.isTypeSupported(t)) ?? '';

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        // Determine actual mime type used (may differ from requested)
        const actualMime = recorder.mimeType || mimeType || 'audio/webm';
        const ext = actualMime.includes('mp4') ? 'mp4' : actualMime.includes('ogg') ? 'ogg' : 'webm';

        // Build a proper File (type is set correctly so upload route accepts it)
        const audioBlob = new Blob(chunks, { type: actualMime });
        const audioFile = new File([audioBlob], `audio-${Date.now()}.${ext}`, { type: actualMime });

        await sendMediaMessage(audioFile);

        // Release microphone
        stream.getTracks().forEach((track) => track.stop());

        setAudioChunks([]);
        setRecordingTime(0);
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setAudioChunks(chunks);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

    } catch (error) {
      console.warn('Failed to start recording:', error);
      const err = error as any;
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        alert('Permissão de microfone negada. Clique no ícone de cadeado na barra de endereço e permita o uso do microfone.');
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        alert('Nenhum microfone encontrado. Verifique se há um microfone conectado ao dispositivo.');
      } else if (err?.name === 'NotSupportedError') {
        alert('Gravação de áudio não suportada neste navegador. Tente Chrome ou Firefox.');
      } else {
        alert(`Erro ao acessar o microfone: ${err?.message ?? 'erro desconhecido'}`);
      }
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
      // Normalize phone: add + prefix if missing
      const normalizedPhone = phone.startsWith('+') ? phone : `+${phone.replace(/\D/g, '')}`;

      // Check if customer exists or create new one
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: normalizedPhone,
          phoneE164: normalizedPhone,
        }),
      });

      let customerId: string | undefined;

      if (response.status === 409) {
        // Customer already exists — find them by phone
        const searchRes = await fetch(
          `/api/customers?search=${encodeURIComponent(normalizedPhone)}&limit=1`,
          { credentials: 'include' }
        );
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          customerId = searchData.customers?.[0]?.id;
        }
      } else if (!response.ok) {
        let errorMsg = 'Erro ao criar cliente';
        try {
          const errorData = await response.json();
          if (typeof errorData.error === 'string') {
            errorMsg = errorData.error;
          } else if (typeof errorData.message === 'string') {
            errorMsg = errorData.message;
          } else if (errorData.error?.message) {
            errorMsg = errorData.error.message;
          }
        } catch (e) { /* ignore */ }
        throw new Error(errorMsg);
      } else {
        const data = await response.json();
        customerId = data.customer?.id;
      }

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

  // Group messages by date for separators
  const groupedMessages = messages.reduce<{ date: string; msgs: Message[] }[]>((acc, msg) => {
    const d = format(new Date(msg.timestamp), 'dd/MM/yyyy');
    const last = acc[acc.length - 1];
    if (last && last.date === d) {
      last.msgs.push(msg);
    } else {
      acc.push({ date: d, msgs: [msg] });
    }
    return acc;
  }, []);

  const todayStr = format(new Date(), 'dd/MM/yyyy');
  const yesterdayStr = format(new Date(Date.now() - 86400000), 'dd/MM/yyyy');
  const formatDateLabel = (d: string) => {
    if (d === todayStr) return 'Hoje';
    if (d === yesterdayStr) return 'Ontem';
    return d;
  };

  return (
    /* Escapa o padding do wrapper do layout (p-4 mobile / p-6 desktop) e preenche h-full do main */
    <div className="flex flex-col h-full -m-4 sm:-m-6 overflow-hidden rounded-lg">

      {/* ── MAIN PANEL ─────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ══ LEFT: Conversations sidebar ══════════════════════════ */}
        <div className={`${mobilePanel === 'list' ? 'flex' : 'hidden'} sm:flex w-full sm:w-[320px] sm:flex-shrink-0 flex-col bg-white border-r border-border`}>

          {/* Sidebar header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#f0f2f5] border-b border-border">
            <span className="font-semibold text-base text-gray-800">Conversas</span>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-200"
              onClick={() => setShowNewConversation(true)}
              title="Nova conversa"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Search + filter */}
          <div className="px-3 py-2 bg-[#f0f2f5] border-b border-border space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Pesquisar ou começar conversa"
                className="pl-8 h-8 text-sm bg-white border-none rounded-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              onClick={() => setUnreadOnlyFilter(!unreadOnlyFilter)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${unreadOnlyFilter
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
            >
              {unreadOnlyFilter ? '✕ Não lidas' : 'Não lidas'}
            </button>
          </div>

          {/* Conversation list — scrollable */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Nenhuma conversa</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = selectedCustomerId === conv.customerId;
                const initials = getInitials(conv.customer.name, conv.customer.phone);
                return (
                  <div
                    key={conv.customerId}
                    onClick={() => { setSelectedCustomerId(conv.customerId); setMobilePanel('chat'); setEditingContact(false); }}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-100 transition-colors ${isSelected ? 'bg-[#f0f2f5]' : 'hover:bg-[#f5f6f6]'
                      }`}
                  >
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center flex-shrink-0 text-white font-semibold text-sm shadow-sm">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-1">
                        <span className="font-medium text-sm text-gray-900 truncate">
                          {displayName(conv.customer.name, conv.customer.phone)}
                        </span>
                        <span className="text-[11px] text-gray-400 whitespace-nowrap flex-shrink-0">
                          {format(new Date(conv.lastMessage.timestamp), 'HH:mm')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <p className="text-xs text-gray-500 truncate">
                          {conv.lastMessage.direction === 'OUT' && (
                            <span className="text-gray-400 mr-0.5">✓</span>
                          )}
                          {formatMessagePreview(conv.lastMessage)}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="flex-shrink-0 min-w-[18px] h-[18px] px-1 bg-green-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ══ RIGHT: Chat panel ════════════════════════════════════ */}
        {selectedCustomerId && customer ? (
          <div className={`${mobilePanel === 'chat' ? 'flex' : 'hidden'} sm:flex flex-col flex-1 min-w-0 bg-white`}>

            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-2.5 bg-[#f0f2f5] border-b border-border flex-shrink-0">
              {/* Botão voltar — mobile */}
              <button
                className="sm:hidden mr-1 text-gray-500 hover:text-gray-700 flex-shrink-0"
                onClick={() => setMobilePanel('list')}
                aria-label="Voltar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center text-white font-semibold text-sm shadow-sm flex-shrink-0">
                {getInitials(customer.name, customer.phoneE164)}
              </div>
              <div className="flex-1 min-w-0">
                {editingContact ? (
                  <form
                    className="flex items-center gap-1"
                    onSubmit={(e) => { e.preventDefault(); saveContact(); }}
                  >
                    <input
                      ref={editContactInputRef}
                      className="flex-1 min-w-0 text-sm font-semibold bg-white border border-green-400 rounded-md px-2 py-0.5 outline-none focus:ring-1 focus:ring-green-400"
                      value={editContactValue}
                      onChange={(e) => setEditContactValue(e.target.value)}
                      placeholder={customer.phoneE164}
                      maxLength={80}
                      disabled={savingContact}
                    />
                    <button
                      type="submit"
                      disabled={savingContact}
                      className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
                      aria-label="Salvar"
                    >
                      {savingContact
                        ? <div className="h-4 w-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                        : <Check className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingContact(false)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      aria-label="Cancelar"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </form>
                ) : (
                  <button
                    className="flex items-center gap-1 group text-left w-full min-w-0"
                    onClick={startEditContact}
                    title="Renomear contato"
                  >
                    <p className="font-semibold text-sm text-gray-900 leading-tight truncate">
                      {displayName(customer.name, customer.phoneE164)}
                    </p>
                    <Pencil className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity" />
                  </button>
                )}
                <p className="text-xs text-gray-500 truncate">{customer.phoneE164}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {quickResponses.length > 0 && (
                  <div className="relative">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-gray-500"
                      title="Respostas rápidas"
                      onClick={() => setShowQuickResponses(!showQuickResponses)}
                    >
                      <Smile className="h-4 w-4" />
                    </Button>
                    {/* Quick responses dropdown — click-based (works on touch devices) */}
                    {showQuickResponses && (
                      <div className="absolute right-0 top-9 z-50 w-72 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                        <div className="px-3 py-2 bg-gray-50 border-b text-xs font-semibold text-gray-600 flex items-center justify-between">
                          <span>Respostas Rápidas</span>
                          <button onClick={() => setShowQuickResponses(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <div className="max-h-60 overflow-y-auto divide-y divide-gray-100">
                          {quickResponses.slice(0, 10).map((r) => (
                            <button
                              key={r.id}
                              className="w-full text-left px-3 py-2.5 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                              onClick={() => { useQuickResponse(r.content); setShowQuickResponses(false); }}
                            >
                              <p className="text-sm font-medium text-gray-800">{r.title}</p>
                              <p className="text-xs text-gray-500 truncate mt-0.5">{r.content}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <a
                  href={`tel:${customer.phoneE164}`}
                  title={`Ligar para ${customer.phoneE164}`}
                  className="inline-flex items-center justify-center h-8 w-8 rounded-md text-gray-500 hover:bg-gray-200 transition-colors"
                >
                  <Phone className="h-4 w-4" />
                </a>
                {/* Three-dot menu */}
                <div ref={contactMenuRef} className="relative">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-gray-500"
                    onClick={() => setShowContactMenu((v) => !v)}
                    title="Mais opções"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>

                  {showContactMenu && (
                    <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-1 text-sm">
                      {/* Block / Unblock */}
                      <button
                        className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-gray-50 text-red-600 disabled:opacity-50"
                        disabled={menuActionLoading === 'block'}
                        onClick={toggleBlockContact}
                      >
                        <Ban className="h-4 w-4 shrink-0" />
                        {customer.tags.includes('__blocked') ? 'Desbloquear contato' : 'Bloquear contato'}
                      </button>

                      {/* Mute / Unmute */}
                      <button
                        className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-gray-50 text-gray-700 disabled:opacity-50"
                        disabled={menuActionLoading === 'mute'}
                        onClick={toggleMuteContact}
                      >
                        {customer.tags.includes('__muted')
                          ? <Bell className="h-4 w-4 shrink-0" />
                          : <BellOff className="h-4 w-4 shrink-0" />}
                        {customer.tags.includes('__muted') ? 'Reativar notificações' : 'Silenciar notificações'}
                      </button>

                      <div className="border-t border-gray-100 my-1" />

                      {/* Clear conversation */}
                      <button
                        className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-gray-50 text-yellow-700 disabled:opacity-50"
                        disabled={menuActionLoading === 'clear'}
                        onClick={clearConversation}
                      >
                        <MessageSquareX className="h-4 w-4 shrink-0" />
                        Limpar conversa
                      </button>

                      {/* Delete conversation */}
                      <button
                        className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-gray-50 text-red-600 disabled:opacity-50"
                        disabled={menuActionLoading === 'delete'}
                        onClick={deleteConversation}
                      >
                        <Trash2 className="h-4 w-4 shrink-0" />
                        Apagar conversa
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Messages area — scrollable, WhatsApp wallpaper feel */}
            <div
              className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-1"
              style={{ background: '#efeae2', backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,.04) 1px, transparent 0)', backgroundSize: '20px 20px' }}
            >
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-7 w-7 border-2 border-green-500 border-t-transparent" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl px-5 py-3 text-sm text-gray-500 shadow-sm">
                    Nenhuma mensagem ainda
                  </div>
                </div>
              ) : (
                groupedMessages.map(({ date, msgs }) => (
                  <div key={date}>
                    {/* Date separator */}
                    <div className="flex items-center justify-center my-3">
                      <span className="bg-white/80 text-[11px] text-gray-600 px-3 py-0.5 rounded-full shadow-sm">
                        {formatDateLabel(date)}
                      </span>
                    </div>

                    {/* Messages for this date */}
                    {msgs.map((message) => {
                      const isOut = message.direction === 'OUT';
                      return (
                        <div
                          key={message.id}
                          className={`flex mb-1 ${isOut ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`relative max-w-[80%] sm:max-w-[65%] rounded-2xl px-3 py-2 shadow-sm ${isOut
                              ? 'bg-[#dcf8c6] text-gray-900 rounded-tr-sm'
                              : 'bg-white text-gray-900 rounded-tl-sm'
                              }`}
                          >
                            {/* Media */}
                            {message.media && (
                              <div className="mb-1 overflow-hidden rounded-lg">
                                {message.media.mimeType?.startsWith('image/') ? (
                                  <img
                                    src={message.media.url}
                                    alt="Imagem"
                                    className="max-w-full max-h-64 object-cover rounded-lg"
                                  />
                                ) : message.media.mimeType?.startsWith('video/') ? (
                                  <video
                                    src={message.media.url}
                                    controls
                                    className="max-w-full max-h-48 rounded-lg"
                                  />
                                ) : message.media.mimeType?.startsWith('audio/') ? (
                                  <WAAudioPlayer
                                    src={message.media.url}
                                    isOutgoing={message.direction === 'OUT'}
                                  />
                                ) : (
                                  <a
                                    href={message.media.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                  >
                                    <FileText className="h-4 w-4 text-gray-600 flex-shrink-0" />
                                    <span className="text-sm text-gray-700 truncate">
                                      {message.media.fileName || 'Arquivo'}
                                    </span>
                                  </a>
                                )}
                              </div>
                            )}

                            {/* Text */}
                            {message.body && (
                              <p className="text-[13.5px] leading-snug whitespace-pre-wrap break-words">
                                {message.body}
                              </p>
                            )}

                            {/* Timestamp + status */}
                            <div className="flex items-center justify-end gap-1 mt-0.5 -mb-0.5">
                              <span className="text-[10px] text-gray-500">
                                {format(new Date(message.timestamp), 'HH:mm')}
                              </span>
                              {isOut && (
                                <span className={message.status === 'read' ? 'text-blue-500' : 'text-gray-400'}>
                                  {renderStatusIcon(message.status, message.deliveryError)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="flex-shrink-0 bg-[#f0f2f5] border-t border-border px-3 py-2">

              {/* Hidden file inputs */}
              <input ref={imageInputRef} type="file" className="hidden" onChange={handleFileSelect} accept="image/*" />
              <input ref={videoInputRef} type="file" className="hidden" onChange={handleFileSelect} accept="video/*" />
              <input ref={documentInputRef} type="file" className="hidden" onChange={handleFileSelect} accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv" />

              {isRecording ? (
                /* Recording UI */
                <div className="flex items-center gap-3 bg-white rounded-full px-4 py-2 shadow-sm">
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                  <span className="flex-1 text-sm font-medium text-red-600">
                    Gravando… {formatRecordingTime(recordingTime)}
                  </span>
                  <Button size="sm" variant="destructive" className="rounded-full h-8" onClick={stopRecording}>
                    <StopCircle className="h-4 w-4 mr-1" />
                    Parar
                  </Button>
                </div>
              ) : (
                <div className="flex items-end gap-2">
                  {/* Attachment buttons */}
                  <div className="flex gap-1 pb-0.5">
                    {/* Mobile: single attach button with popup menu */}
                    <div className="relative sm:hidden">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-9 w-9 p-0 rounded-full text-gray-500 hover:bg-gray-200"
                        onClick={() => setShowAttachMenu(!showAttachMenu)}
                        disabled={sending}
                        title="Anexar"
                      >
                        <Paperclip className="h-5 w-5" />
                      </Button>
                      {showAttachMenu && (
                        <div className="absolute bottom-11 left-0 z-50 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden w-40">
                          <button
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 active:bg-gray-100 text-sm text-gray-700"
                            onClick={() => { imageInputRef.current?.click(); setShowAttachMenu(false); }}
                          >
                            <ImageIcon className="h-4 w-4 text-green-600 flex-shrink-0" />
                            Imagem
                          </button>
                          <button
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 active:bg-gray-100 text-sm text-gray-700 border-t border-gray-100"
                            onClick={() => { videoInputRef.current?.click(); setShowAttachMenu(false); }}
                          >
                            <Video className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            Vídeo
                          </button>
                          <button
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 active:bg-gray-100 text-sm text-gray-700 border-t border-gray-100"
                            onClick={() => { documentInputRef.current?.click(); setShowAttachMenu(false); }}
                          >
                            <Paperclip className="h-4 w-4 text-orange-600 flex-shrink-0" />
                            Documento
                          </button>
                        </div>
                      )}
                    </div>
                    {/* Desktop: show all 3 buttons individually */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="hidden sm:flex h-9 w-9 p-0 rounded-full text-gray-500 hover:bg-gray-200"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={sending}
                      title="Imagem"
                    >
                      <ImageIcon className="h-5 w-5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="hidden sm:flex h-9 w-9 p-0 rounded-full text-gray-500 hover:bg-gray-200"
                      onClick={() => videoInputRef.current?.click()}
                      disabled={sending}
                      title="Vídeo"
                    >
                      <Video className="h-5 w-5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="hidden sm:flex h-9 w-9 p-0 rounded-full text-gray-500 hover:bg-gray-200"
                      onClick={() => documentInputRef.current?.click()}
                      disabled={sending}
                      title="Documento"
                    >
                      <Paperclip className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Text input */}
                  <div className="flex-1">
                    <Textarea
                      placeholder="Digite uma mensagem"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={sending}
                      rows={1}
                      className="resize-none min-h-[40px] max-h-[120px] rounded-2xl bg-white border-none shadow-sm text-sm px-4 py-2.5 leading-tight focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>

                  {/* Right action buttons */}
                  <div className="flex gap-1 pb-0.5">
                    {messageInput.trim() ? (
                      <>
                        {/* TTS voice */}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-9 w-9 p-0 rounded-full text-purple-600 hover:bg-purple-100"
                          onClick={sendAsVoice}
                          disabled={sending || sendingVoice}
                          title="Enviar como áudio (ElevenLabs)"
                        >
                          {sendingVoice ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent" />
                          ) : (
                            <Volume2 className="h-5 w-5" />
                          )}
                        </Button>
                        {/* Send text */}
                        <Button
                          size="sm"
                          className="h-9 w-9 p-0 rounded-full bg-green-500 hover:bg-green-600 text-white"
                          onClick={sendMessage}
                          disabled={sending || sendingVoice}
                        >
                          {sending ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </>
                    ) : (
                      /* Mic — record audio */
                      <Button
                        size="sm"
                        className="h-9 w-9 p-0 rounded-full bg-green-500 hover:bg-green-600 text-white"
                        onClick={startRecording}
                        disabled={sending}
                        title="Gravar áudio"
                      >
                        <Mic className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Empty state — hidden on mobile (user hasn't selected a conversation) */
          <div className="hidden sm:flex flex-1 flex-col items-center justify-center bg-[#f0f2f5]">
            <div className="text-center max-w-xs">
              <div className="w-20 h-20 rounded-full bg-white shadow-md flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-9 w-9 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">WhatLead Inbox</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Selecione uma conversa à esquerda para começar a atender
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── New Conversation Dialog ───────────────────────────────── */}
      <Dialog open={showNewConversation} onOpenChange={setShowNewConversation}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Nova Conversa</DialogTitle>
            <DialogDescription>
              Busque um cliente ou inicie com um novo número
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Search existing */}
            <div className="space-y-2">
              <Label htmlFor="customer-search">Buscar cliente</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="customer-search"
                  placeholder="Nome ou telefone..."
                  className="pl-8"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
              </div>
              {searchingCustomers && <p className="text-xs text-muted-foreground">Buscando...</p>}
              {searchResults.length > 0 && (
                <div className="border rounded-lg divide-y max-h-52 overflow-y-auto">
                  {searchResults.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between"
                      onClick={() => startNewConversation(c.id)}
                    >
                      <div>
                        <p className="font-medium text-sm">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.phoneE164}</p>
                      </div>
                      <Phone className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              )}
              {customerSearch && !searchingCustomers && searchResults.length === 0 && (
                <p className="text-xs text-muted-foreground">Nenhum cliente encontrado</p>
              )}
            </div>
            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Ou</span>
              </div>
            </div>
            {/* New phone */}
            <div className="space-y-2">
              <Label htmlFor="new-phone">Novo número</Label>
              <div className="flex gap-2">
                <Input
                  id="new-phone"
                  placeholder="+55 11 99999-9999"
                  value={newConversationPhone}
                  onChange={(e) => setNewConversationPhone(e.target.value)}
                  onKeyPress={(e) => { if (e.key === 'Enter') startConversationWithPhone(); }}
                />
                <Button
                  onClick={startConversationWithPhone}
                  disabled={startingConversation || !newConversationPhone.trim()}
                >
                  {startingConversation
                    ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    : <><Plus className="h-4 w-4 mr-1" />Iniciar</>
                  }
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Ex: +55 47 91011287</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

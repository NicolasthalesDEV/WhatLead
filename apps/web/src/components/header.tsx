"use client";

import { Bell, Search, User, Settings, LogOut, HelpCircle, CheckCircle2, BedDouble, CalendarCheck, MessageSquare, BookOpen, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { NotificationBell } from "@/components/notification-bell";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";

export function Header() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const { resetTour } = useOnboarding();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Função de busca global (agora chamando API real)
  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Criar novo AbortController
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsSearching(true);

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=5`, {
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error('Erro na busca');
      }

      const data = await response.json();
      setSearchResults(data.results || []);
      setShowResults(data.results.length > 0);
    } catch (error: any) {
      // Ignorar erros de abort (quando usuário digita rápido)
      if (error.name !== 'AbortError') {
        console.error('Erro ao buscar:', error);
        setSearchResults([]);
        setShowResults(false);
      }
    } finally {
      setIsSearching(false);
    }
  };

  // Função para navegar para resultado
  const handleResultClick = (item: any) => {
    switch (item.type) {
      case 'customer':
        router.push(`/dashboard/customers/${item.id}`);
        break;
      case 'product':
        router.push(`/dashboard/products/${item.id}`);
        break;
      case 'order':
        router.push(`/dashboard/orders/${item.id}`);
        break;
      case 'message':
        router.push(`/dashboard/whatsapp?customer=${item.id}`);
        break;
    }
    setShowResults(false);
    setSearchQuery("");
  };

  // Debounce para busca (esperar 300ms após usuário parar de digitar)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        handleSearch(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fechar resultados ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // Fechar com ESC
      if (event.key === 'Escape') {
        setShowResults(false);
        setSearchQuery("");
      }

      // Atalho Ctrl+K ou Cmd+K para focar na busca
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        const searchInput = searchRef.current?.querySelector('input');
        searchInput?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const navigateToSettings = () => {
    router.push('/dashboard/settings');
  };

  const navigateToProfile = () => {
    router.push('/dashboard/profile');
  };

  const openHelp = () => {
    window.open('https://help.exemplo.com', '_blank');
  };

  // Helper: render search result dropdown
  const renderResults = (keyPrefix: string, onItemClick: (item: any) => void) => (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
      {searchResults.length === 0 ? (
        <div className="p-4 text-center text-gray-500">Nenhum resultado encontrado</div>
      ) : (
        searchResults.map((category, categoryIndex) => (
          <div key={`${keyPrefix}-${categoryIndex}-${searchQuery}`}>
            <div className="px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-50 border-b">{category.category}</div>
            {category.items.map((item: any, itemIndex: number) => (
              <div
                key={`${keyPrefix}-${itemIndex}-${item.id}-${searchQuery}`}
                className="px-3 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 flex items-center space-x-3 last:border-b-0"
                onClick={() => onItemClick(item)}
              >
                <div className="flex-shrink-0">
                  {item.type === 'customer' && <User className="h-4 w-4 text-blue-500" />}
                  {item.type === 'product' && <BedDouble className="h-4 w-4 text-green-500" />}
                  {item.type === 'order' && <CalendarCheck className="h-4 w-4 text-purple-500" />}
                  {item.type === 'message' && <MessageSquare className="h-4 w-4 text-orange-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{item.title}</div>
                  <div className="text-xs text-gray-500 truncate">{item.subtitle}</div>
                </div>
              </div>
            ))}
          </div>
        ))
      )}
      <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-t">
        <div className="flex items-center justify-between">
          <span>Mín. 2 caracteres • {searchResults.reduce((acc, cat) => acc + cat.items.length, 0)} resultados</span>
          <div className="flex items-center space-x-1">
            <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs font-mono">ESC</kbd>
            <span>fechar</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <header className="relative z-50 w-full bg-background">
      {/* ── Barra de busca expandida (mobile) ─────────────── */}
      {mobileSearchOpen && (
        <div className="flex items-center gap-2 px-3 py-2 lg:hidden">
          <div className="relative flex-1" ref={searchRef}>
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar clientes, produtos, pedidos..."
              className="w-full pl-9 h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
              autoFocus
            />
            {isSearching && (
              <div className="absolute right-3 top-2.5">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              </div>
            )}
            {showResults && renderResults('mob', (item) => { handleResultClick(item); setMobileSearchOpen(false); })}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { setMobileSearchOpen(false); setSearchQuery(""); setShowResults(false); }}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* ── Linha principal ─────────────────────────────────── */}
      <div className={`flex h-14 items-center px-2 sm:px-3 ${mobileSearchOpen ? 'hidden lg:flex' : 'flex'}`}>
        {/* Busca — desktop */}
        <div className="mr-6 hidden lg:flex">
          <div className="relative" ref={searchRef}>
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar clientes, produtos, pedidos... (Ctrl+K)"
              className="w-[320px] pl-9 h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
            />
            {isSearching && (
              <div className="absolute right-3 top-2.5">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              </div>
            )}
            {showResults && renderResults('desk', handleResultClick)}
          </div>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-1">
          {/* Busca — botão mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="flex lg:hidden"
            onClick={() => setMobileSearchOpen(true)}
            title="Buscar"
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Suporte via WhatsApp */}
          <a
            href="https://wa.me/5547991011287?text=Ol%C3%A1%2C%20preciso%20de%20suporte%20com%20o%20sistema"
            target="_blank"
            rel="noopener noreferrer"
            title="Falar com suporte"
          >
            <Button variant="ghost" size="sm" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Suporte</span>
            </Button>
          </a>

          {/* Notificações */}
          <NotificationBell />

          {/* Menu do Usuário */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-4 w-4" />
                <span className="sr-only">Perfil</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {loading ? "Carregando..." : user?.name || "Usuário"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {loading ? "..." : user?.email || ""}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={navigateToProfile}>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={navigateToSettings}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={resetTour}>
                <BookOpen className="mr-2 h-4 w-4" />
                <span>Ver Tutorial Novamente</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={openHelp}>
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Central de Ajuda</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-red-600" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

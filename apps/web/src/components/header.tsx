"use client";

import { Bell, Search, User, Settings, LogOut, HelpCircle, CheckCircle2, BedDouble, CalendarCheck, MessageSquare } from "lucide-react";
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

export function Header() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  // Dados simulados para busca - Hotelaria
  const mockData = {
    customers: [
      { id: 1, name: "João Silva", phone: "(11) 99999-9999", type: "customer" },
      { id: 2, name: "Maria Santos", phone: "(11) 88888-8888", type: "customer" },
      { id: 3, name: "Pedro Costa", phone: "(11) 77777-7777", type: "customer" },
      { id: 4, name: "Ana Oliveira", phone: "(11) 66666-6666", type: "customer" },
    ],
    products: [
      { id: 1, name: "Suíte Master", sku: "SUITE01", price: "R$ 450,00/noite", type: "product" },
      { id: 2, name: "Quarto Duplo", sku: "DUPLO01", price: "R$ 280,00/noite", type: "product" },
      { id: 3, name: "Quarto Solteiro", sku: "SOLT01", price: "R$ 180,00/noite", type: "product" },
      { id: 4, name: "Suíte Presidencial", sku: "PRES01", price: "R$ 850,00/noite", type: "product" },
    ],
    orders: [
      { id: 1, number: "#R1234", customer: "João Silva", total: "R$ 1.350,00", status: "Confirmada", type: "order" },
      { id: 2, number: "#R1235", customer: "Maria Santos", total: "R$ 560,00", status: "Pendente", type: "order" },
      { id: 3, number: "#R1236", customer: "Pedro Costa", total: "R$ 2.550,00", status: "Check-in", type: "order" },
    ],
    messages: [
      { id: 1, contact: "João Silva", preview: "Qual horário do café da manhã?", time: "10 min", type: "message" },
      { id: 2, contact: "Maria Santos", preview: "Obrigada pelo atendimento!", time: "1h", type: "message" },
      { id: 3, contact: "Pedro Costa", preview: "Posso fazer early check-in?", time: "2h", type: "message" },
    ]
  };

  const [notifications, setNotifications] = useState([
    {
      id: "novo-pedido-1234",
      title: "Novo pedido recebido",
      description: "Pedido #1234 de João Silva",
      time: "2 min",
      read: false
    },
    {
      id: "estoque-baixo-led20w",
      title: "Produto com estoque baixo",
      description: "Painel LED 20W - 5 unidades restantes",
      time: "1h",
      read: false
    },
    {
      id: "whatsapp-maria-santos",
      title: "Mensagem no WhatsApp",
      description: "Nova mensagem de Maria Santos",
      time: "3h",
      read: true
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Função de busca global
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const results: any[] = [];
    const queryLower = query.toLowerCase().trim();

    // Buscar clientes - busca mais precisa
    const customerResults = mockData.customers
      .filter(customer => {
        // Busca no nome
        const nameMatch = customer.name.toLowerCase().includes(queryLower);
        
        // Busca no telefone apenas se a query for claramente numérica
        // (contém pelo menos 2 dígitos e apenas números, espaços, parênteses, traços)
        const hasEnoughDigits = (query.match(/\d/g) || []).length >= 2;
        const isPhoneQuery = hasEnoughDigits && /^[\d\s\(\)\-\+]+$/.test(query.trim());
        
        const phoneMatch = isPhoneQuery && (
          customer.phone.includes(query) || 
          customer.phone.replace(/\D/g, '').includes(query.replace(/\D/g, ''))
        );
        
        return nameMatch || phoneMatch;
      })
      .slice(0, 3);
    
    // Buscar produtos - busca mais precisa
    const productResults = mockData.products
      .filter(product => {
        const nameMatch = product.name.toLowerCase().includes(queryLower);
        const skuMatch = product.sku.toLowerCase().includes(queryLower);
        return nameMatch || skuMatch;
      })
      .slice(0, 3);

    // Buscar pedidos - busca mais precisa
    const orderResults = mockData.orders
      .filter(order => {
        const numberMatch = order.number.toLowerCase().includes(queryLower);
        const customerMatch = order.customer.toLowerCase().includes(queryLower);
        return numberMatch || customerMatch;
      })
      .slice(0, 3);

    // Buscar mensagens - busca mais precisa
    const messageResults = mockData.messages
      .filter(message => {
        const contactMatch = message.contact.toLowerCase().includes(queryLower);
        const previewMatch = message.preview.toLowerCase().includes(queryLower);
        return contactMatch || previewMatch;
      })
      .slice(0, 3);

    // Combinar resultados com categorias apenas se houver resultados
    if (customerResults.length > 0) {
      results.push({ category: 'Clientes', items: customerResults });
    }
    if (productResults.length > 0) {
      results.push({ category: 'Produtos', items: productResults });
    }
    if (orderResults.length > 0) {
      results.push({ category: 'Pedidos', items: orderResults });
    }
    if (messageResults.length > 0) {
      results.push({ category: 'Mensagens', items: messageResults });
    }

    setSearchResults(results);
    setShowResults(results.length > 0);
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
        router.push(`/dashboard/whatsapp?contact=${item.contact}`);
        break;
    }
    setShowResults(false);
    setSearchQuery("");
  };

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

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleLogout = () => {
    // Limpar dados de autenticação (localStorage, cookies, etc.)
    localStorage.removeItem('auth-token');
    localStorage.removeItem('user-data');
    
    // Redirecionar para página de login
    router.push('/login');
  };

  const navigateToSettings = () => {
    router.push('/dashboard/settings');
  };

  const navigateToProfile = () => {
    // Assumindo que haverá uma página de perfil
    router.push('/dashboard/profile');
  };

  const openHelp = () => {
    // Pode abrir um modal de ajuda ou navegar para uma página de help
    window.open('https://help.exemplo.com', '_blank');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center pl-10 pr-4">
        <div className="mr-6 hidden lg:flex">
          <div className="relative" ref={searchRef}>
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar hóspedes, quartos, reservas... (Ctrl+K)"
              className="w-[320px] pl-9 h-9"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
            />
            
            {/* Dropdown de Resultados */}
            {showResults && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                {searchResults.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    Nenhum resultado encontrado
                  </div>
                ) : (
                  searchResults.map((category, categoryIndex) => (
                    <div key={`${categoryIndex}-${searchQuery}`}>
                      <div className="px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-50 border-b">
                        {category.category}
                      </div>
                      {category.items.map((item: any, itemIndex: number) => (
                        <div
                          key={`${itemIndex}-${item.id}-${searchQuery}`}
                          className="px-3 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 flex items-center space-x-3 last:border-b-0"
                          onClick={() => handleResultClick(item)}
                        >
                          <div className="flex-shrink-0">
                            {item.type === 'customer' && <User className="h-4 w-4 text-blue-500" />}
                            {item.type === 'product' && <BedDouble className="h-4 w-4 text-green-500" />}
                            {item.type === 'order' && <CalendarCheck className="h-4 w-4 text-purple-500" />}
                            {item.type === 'message' && <MessageSquare className="h-4 w-4 text-orange-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {item.type === 'customer' && item.name}
                              {item.type === 'product' && item.name}
                              {item.type === 'order' && `Reserva ${item.number}`}
                              {item.type === 'message' && item.contact}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {item.type === 'customer' && item.phone}
                              {item.type === 'product' && `${item.sku} • ${item.price}`}
                              {item.type === 'order' && `${item.customer} • ${item.total}`}
                              {item.type === 'message' && item.preview}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
                )}
                
                {/* Footer do dropdown */}
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
            )}
          </div>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center space-x-2">
            {/* Dropdown de Notificações */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-black text-white text-xs flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                  <span className="sr-only">Notificações</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  Notificações
                  {unreadCount > 0 && (
                    <Badge variant="secondary">{unreadCount} novas</Badge>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notification) => (
                    <Link key={notification.id} href={`/dashboard/notifications/${notification.id}`}>
                      <DropdownMenuItem className="flex flex-col items-start p-3 cursor-pointer">
                        <div className="flex items-start justify-between w-full">
                          <div className="flex-1">
                            <div className={`font-medium text-sm ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {notification.title}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {notification.description}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-2">
                            <span className="text-xs text-muted-foreground">{notification.time}</span>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      </DropdownMenuItem>
                    </Link>
                  ))}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-center cursor-pointer" onClick={markAllAsRead}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Marcar todas como lidas
                </DropdownMenuItem>
                <DropdownMenuItem className="text-center cursor-pointer" onClick={() => router.push('/dashboard/notifications')}>
                  <Bell className="h-4 w-4 mr-2" />
                  Ver todas as notificações
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Dropdown do Usuário */}
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
                    <p className="text-sm font-medium leading-none">João Silva</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      joao@empresa.com
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
                <DropdownMenuItem className="cursor-pointer" onClick={openHelp}>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Ajuda</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer text-red-600" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </div>
    </header>
  );
}
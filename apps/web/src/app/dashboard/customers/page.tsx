"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  MessageSquare,
  MoreVertical,
  Filter,
  Edit,
  Trash2,
  Eye,
  ChevronDown
} from "lucide-react";

export default function CustomersPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; customerId: number | null }>({
    open: false,
    customerId: null
  });

  // Função para abrir chat WhatsApp
  const handleOpenChat = (customer: any) => {
    router.push(`/dashboard/whatsapp?contact=${encodeURIComponent(customer.name)}`);
  };

  // Função para editar cliente
  const handleEditCustomer = (customerId: number) => {
    router.push(`/dashboard/customers/${customerId}/edit`);
  };

  // Função para ver detalhes do cliente
  const handleViewCustomer = (customerId: number) => {
    router.push(`/dashboard/customers/${customerId}`);
  };

  // Dados mockados de hóspedes (com estado local)
  const [customers, setCustomers] = useState([
    {
      id: 1,
      name: "João Silva",
      email: "joao@email.com",
      phone: "(11) 99999-9999",
      status: "online",
      totalSpent: "R$ 2.450,00",
      orders: 12,
      lastContact: "2 dias atrás",
      lastSeen: "Online",
      room: "Quarto 101"
    },
    {
      id: 2,
      name: "Maria Santos",
      email: "maria@email.com",
      phone: "(11) 88888-8888",
      status: "offline",
      totalSpent: "R$ 1.200,00",
      orders: 5,
      lastContact: "1 semana atrás",
      lastSeen: "Visto por último às 14:30",
      room: "Quarto 205"
    },
    {
      id: 3,
      name: "Pedro Costa",
      email: "pedro@email.com",
      phone: "(11) 77777-7777",
      status: "online",
      totalSpent: "R$ 800,00",
      orders: 3,
      lastContact: "Hoje",
      lastSeen: "Online",
      room: "Quarto 312"
    }
  ]);

  // Função para deletar cliente
  const handleDeleteCustomer = (customerId: number) => {
    setDeleteModal({ open: true, customerId });
  };

  const confirmDelete = () => {
    if (deleteModal.customerId) {
      setCustomers(prev => prev.filter(customer => customer.id !== deleteModal.customerId));
      setDeleteModal({ open: false, customerId: null });
    }
  };

  const cancelDelete = () => {
    setDeleteModal({ open: false, customerId: null });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hóspedes</h1>
          <p className="text-muted-foreground">
            Gerencie seus hóspedes e relacionamentos
          </p>
        </div>
        <Link href="/dashboard/quick-actions/new-customer">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Hóspede
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Hóspedes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,248</div>
            <p className="text-xs text-muted-foreground">+12% em relação ao mês anterior</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hóspedes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">896</div>
            <p className="text-xs text-muted-foreground">72% do total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Check-ins Este Mês</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
            <p className="text-xs text-muted-foreground">+8% vs mês anterior</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Diária Média</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 185</div>
            <p className="text-xs text-muted-foreground">+5% vs mês anterior</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Hóspedes</CardTitle>
          <CardDescription>Encontre e gerencie seus hóspedes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar hóspedes..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Dropdown de Filtros */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtros
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filtrar por Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setStatusFilter("all")}
                  className={statusFilter === "all" ? "bg-accent" : ""}
                >
                  Todos os hóspedes
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setStatusFilter("online")}
                  className={statusFilter === "online" ? "bg-accent" : ""}
                >
                  Online
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setStatusFilter("offline")}
                  className={statusFilter === "offline" ? "bg-accent" : ""}
                >
                  Offline
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Customer List */}
          <div className="space-y-4">
            {customers
              .filter(customer => {
                // Filtro por busca
                const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  customer.phone.includes(searchQuery);

                // Filtro por status
                const matchesStatus = statusFilter === "all" || customer.status === statusFilter;

                return matchesSearch && matchesStatus;
              })
              .map((customer) => (
                <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-semibold">
                        {customer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{customer.name}</h3>
                        <Badge variant={customer.status === 'online' ? 'default' : 'secondary'}>
                          {customer.lastSeen}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {customer.email}
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {customer.phone}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-right text-sm">
                      <div className="font-semibold">{customer.totalSpent}</div>
                      <div className="text-muted-foreground">{customer.orders} pedidos</div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="text-muted-foreground">Último contato</div>
                      <div>{customer.lastContact}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenChat(customer)}
                        title="Abrir chat WhatsApp"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>

                      {/* Dropdown de Ações */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleViewCustomer(customer.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditCustomer(customer.id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteCustomer(customer.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Deletar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}

            {/* Estado vazio */}
            {customers.filter(customer => {
              const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                customer.phone.includes(searchQuery);
              const matchesStatus = statusFilter === "all" || customer.status === statusFilter;
              return matchesSearch && matchesStatus;
            }).length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">Nenhum cliente encontrado</h3>
                  <p className="text-muted-foreground">
                    {searchQuery || statusFilter !== "all"
                      ? "Tente ajustar os filtros de busca"
                      : "Adicione seu primeiro cliente para começar"
                    }
                  </p>
                </div>
              )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Confirmação de Delete */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Confirmar Exclusão</h3>
            <p className="text-muted-foreground mb-6">
              Tem certeza que deseja deletar este cliente? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={cancelDelete}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Deletar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
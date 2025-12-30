"use client";

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
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  BedDouble,
  Search,
  Plus,
  Edit,
  Eye,
  DollarSign,
  TrendingUp,
  Filter,
  MoreVertical,
  Trash2,
  ChevronDown
} from "lucide-react";

export default function ProductsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; productId: number | null }>({
    open: false,
    productId: null
  });

  // Função para editar quarto
  const handleEditProduct = (productId: number) => {
    router.push(`/dashboard/products/${productId}/edit`);
  };

  // Função para ver detalhes do quarto
  const handleViewProduct = (productId: number) => {
    router.push(`/dashboard/products/${productId}`);
  };

  // Dados simulados de quartos (com estado local)
  const [products, setProducts] = useState([
    {
      id: 1,
      name: "Suíte Master",
      description: "Vista para o mar, cama king size, banheira de hidromassagem",
      price: "R$ 450,00/noite",
      category: "Suítes",
      stock: 4,
      status: "active",
      image: "/placeholder-product.jpg",
      sales: 45
    },
    {
      id: 2,
      name: "Quarto Standard",
      description: "Cama de casal, ar-condicionado, TV 42 polegadas",
      price: "R$ 180,00/noite",
      category: "Standard",
      stock: 12,
      status: "active",
      image: "/placeholder-product.jpg",
      sales: 32
    },
    {
      id: 3,
      name: "Suíte Premium",
      description: "2 camas queen, varanda privativa, frigobar premium",
      price: "R$ 320,00/noite",
      category: "Suítes",
      stock: 0,
      status: "out_of_stock",
      image: "/placeholder-product.jpg",
      sales: 18
    },
  ]);

  // Função para deletar produto
  const handleDeleteProduct = (productId: number) => {
    setDeleteModal({ open: true, productId });
  };

  const confirmDelete = () => {
    if (deleteModal.productId) {
      setProducts(prev => prev.filter(product => product.id !== deleteModal.productId));
      setDeleteModal({ open: false, productId: null });
    }
  };

  const cancelDelete = () => {
    setDeleteModal({ open: false, productId: null });
  };

  // Categorias únicas para o filtro
  const categories = [...new Set(products.map(product => product.category))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quartos</h1>
          <p className="text-muted-foreground">
            Gerencie os quartos e acomodações do hotel
          </p>
        </div>
        <Link href="/dashboard/quick-actions/add-product">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Quarto
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Quartos</CardTitle>
            <BedDouble className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">157</div>
            <p className="text-xs text-muted-foreground">Em todas as categorias</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quartos Disponíveis</CardTitle>
            <BedDouble className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
            <p className="text-xs text-muted-foreground">90% disponibilidade</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ocupados Hoje</CardTitle>
            <BedDouble className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15</div>
            <p className="text-xs text-muted-foreground">Taxa de ocupação</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Diária</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 24.890</div>
            <p className="text-xs text-muted-foreground">+12% vs dia anterior</p>
          </CardContent>
        </Card>
      </div>

      {/* Products List */}
      <Card>
        <CardHeader>
          <CardTitle>Catálogo de Quartos</CardTitle>
          <CardDescription>Visualize e gerencie os quartos do hotel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar quartos..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Filtro por Status */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Status
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filtrar por Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setStatusFilter("all")}
                    className={statusFilter === "all" ? "bg-accent" : ""}
                  >
                    Todos os quartos
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setStatusFilter("active")}
                    className={statusFilter === "active" ? "bg-accent" : ""}
                  >
                    Disponíveis
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setStatusFilter("out_of_stock")}
                    className={statusFilter === "out_of_stock" ? "bg-accent" : ""}
                  >
                    Ocupados
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Filtro por Categoria */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <BedDouble className="h-4 w-4 mr-2" />
                    Tipo
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filtrar por Tipo</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setCategoryFilter("all")}
                    className={categoryFilter === "all" ? "bg-accent" : ""}
                  >
                    Todos os tipos
                  </DropdownMenuItem>
                  {categories.map((category) => (
                    <DropdownMenuItem
                      key={category}
                      onClick={() => setCategoryFilter(category)}
                      className={categoryFilter === category ? "bg-accent" : ""}
                    >
                      {category}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products
              .filter(product => {
                // Filtro por busca
                const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  product.category.toLowerCase().includes(searchQuery.toLowerCase());

                // Filtro por status
                const matchesStatus = statusFilter === "all" || product.status === statusFilter;

                // Filtro por categoria
                const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;

                return matchesSearch && matchesStatus && matchesCategory;
              })
              .map((product) => (
                <Card key={product.id} className="overflow-hidden">
                  <div className="aspect-square bg-gray-100 relative">
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                      <BedDouble className="h-12 w-12" />
                    </div>
                    {product.status === 'out_of_stock' && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="destructive">Ocupado</Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">{product.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-primary">{product.price}</span>
                        <Badge variant="secondary">{product.category}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Unidades: {product.stock}</span>
                        <div className="flex items-center">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {product.sales} reservas
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewProduct(product.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver
                      </Button>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditProduct(product.id)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
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
                            <DropdownMenuItem onClick={() => handleViewProduct(product.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditProduct(product.id)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Deletar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

            {/* Estado vazio */}
            {products.filter(product => {
              const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.category.toLowerCase().includes(searchQuery.toLowerCase());
              const matchesStatus = statusFilter === "all" || product.status === statusFilter;
              const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
              return matchesSearch && matchesStatus && matchesCategory;
            }).length === 0 && (
                <div className="col-span-full text-center py-8">
                  <BedDouble className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">Nenhum quarto encontrado</h3>
                  <p className="text-muted-foreground">
                    {searchQuery || statusFilter !== "all" || categoryFilter !== "all"
                      ? "Tente ajustar os filtros de busca"
                      : "Adicione seu primeiro quarto para começar"
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
              Tem certeza que deseja deletar este quarto? Esta ação não pode ser desfeita.
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
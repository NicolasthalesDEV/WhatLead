"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Package,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Filter,
  Star,
  MoreVertical,
  ShoppingCart,
  FileText,
} from "lucide-react";

interface Product {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  sku?: string;
  stock?: number;
  active: boolean;
  featured: boolean;
  slug: string;
  createdAt: string;
  prices: Array<{
    id: string;
    amount: number;
    promoAmount?: number;
    active: boolean;
  }>;
  _count: {
    quoteItems: number;
    orderItems: number;
  };
}

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [activeFilter, setActiveFilter] = useState<string>("ALL");

  useEffect(() => {
    loadProducts();
  }, [categoryFilter, activeFilter]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (categoryFilter !== "ALL") {
        params.append("category", categoryFilter);
      }

      if (activeFilter !== "ALL") {
        params.append("active", activeFilter === "ACTIVE" ? "true" : "false");
      }

      const res = await fetch(`/api/products?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm("Tem certeza que deseja deletar este produto?")) return;

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await loadProducts();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao deletar produto");
      }
    } catch (error) {
      console.error("Erro ao deletar produto:", error);
    }
  };

  const toggleActive = async (productId: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !currentActive }),
      });

      if (res.ok) {
        await loadProducts();
      }
    } catch (error) {
      console.error("Erro ao atualizar produto:", error);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  const filteredProducts = products.filter((product) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      product.title.toLowerCase().includes(search) ||
      product.description?.toLowerCase().includes(search) ||
      product.sku?.toLowerCase().includes(search) ||
      product.category?.toLowerCase().includes(search)
    );
  });

  // Get unique categories
  const categories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean))
  );

  const stats = {
    total: products.length,
    active: products.filter((p) => p.active).length,
    inactive: products.filter((p) => !p.active).length,
    featured: products.filter((p) => p.featured).length,
    outOfStock: products.filter((p) => p.stock !== null && p.stock !== undefined && p.stock <= 0).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Carregando produtos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quartos</h1>
          <p className="text-muted-foreground">Gerencie os quartos do seu hotel</p>
        </div>
        <Link href="/dashboard/products/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Produto
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Ativos</CardDescription>
            <CardTitle className="text-2xl text-green-600">{stats.active}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Inativos</CardDescription>
            <CardTitle className="text-2xl text-muted-foreground">{stats.inactive}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Em Destaque</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">{stats.featured}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Sem Estoque</CardDescription>
            <CardTitle className="text-2xl text-red-600">{stats.outOfStock}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, descrição, SKU ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Categoria: {categoryFilter === "ALL" ? "Todas" : categoryFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setCategoryFilter("ALL")}>
              Todas
            </DropdownMenuItem>
            {categories.map((category) => (
              <DropdownMenuItem
                key={category}
                onClick={() => setCategoryFilter(category!)}
              >
                {category}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Status: {activeFilter === "ALL" ? "Todos" : activeFilter === "ACTIVE" ? "Ativos" : "Inativos"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setActiveFilter("ALL")}>
              Todos
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveFilter("ACTIVE")}>
              Ativos
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveFilter("INACTIVE")}>
              Inativos
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum produto encontrado</p>
            <Link href="/dashboard/products/new">
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Produto
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="aspect-video bg-muted relative">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Package className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                {product.featured && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-yellow-500">
                      <Star className="h-3 w-3 mr-1" />
                      Destaque
                    </Badge>
                  </div>
                )}
                {!product.active && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary">Inativo</Badge>
                  </div>
                )}
              </div>

              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-1">{product.title}</CardTitle>
                    {product.category && (
                      <Badge variant="outline" className="mt-2">
                        {product.category}
                      </Badge>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => router.push(`/dashboard/products/${product.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => router.push(`/dashboard/products/${product.id}/edit`)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => toggleActive(product.id, product.active)}
                      >
                        {product.active ? "Desativar" : "Ativar"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => deleteProduct(product.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Deletar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {product.description && (
                  <CardDescription className="line-clamp-2 mt-2">
                    {product.description}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">
                    {product.prices[0]
                      ? formatCurrency(product.prices[0].amount)
                      : "Sem preço"}
                  </span>
                  {product.prices[0]?.promoAmount && (
                    <span className="text-sm text-muted-foreground line-through">
                      {formatCurrency(product.prices[0].promoAmount)}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <ShoppingCart className="h-4 w-4" />
                    <span>{product._count.orderItems} vendas</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    <span>{product._count.quoteItems} orçamentos</span>
                  </div>
                </div>

                {product.sku && (
                  <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                )}

                {product.stock !== null && product.stock !== undefined && (
                  <p className="text-xs">
                    Estoque:{" "}
                    <span
                      className={product.stock <= 0 ? "text-red-600 font-semibold" : ""}
                    >
                      {product.stock}
                    </span>
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

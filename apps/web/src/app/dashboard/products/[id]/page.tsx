"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Package, ShoppingCart, FileText, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  updatedAt: string;
  prices: Array<{
    id: string;
    amount: number;
    promoAmount?: number;
    active: boolean;
    createdAt: string;
  }>;
  _count: {
    quoteItems: number;
    orderItems: number;
  };
}

export default function ProductDetailsPage() {
  const router = useRouter();
  const routeParams = useParams<{ id: string }>();
  const id = routeParams?.id;
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (!id) return;
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProduct(data.product);
      } else {
        alert("Produto não encontrado");
        router.push("/dashboard/products");
      }
    } catch (error) {
      console.error("Erro ao carregar produto:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async () => {
    if (!confirm("Tem certeza que deseja deletar este produto?")) return;

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/dashboard/products");
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao deletar produto");
      }
    } catch (error) {
      console.error("Erro ao deletar produto:", error);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Carregando produto...</p>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const latestPrice = product.prices[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/products">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{product.title}</h1>
            <p className="text-muted-foreground">Detalhes do produto</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/products/${product.id}/edit`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
          <Button variant="destructive" onClick={deleteProduct}>
            <Trash2 className="h-4 w-4 mr-2" />
            Deletar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Informações Básicas</CardTitle>
                <div className="flex gap-2">
                  {product.active ? (
                    <Badge className="bg-green-600">Ativo</Badge>
                  ) : (
                    <Badge variant="secondary">Inativo</Badge>
                  )}
                  {product.featured && (
                    <Badge className="bg-yellow-500">
                      <Star className="h-3 w-3 mr-1" />
                      Destaque
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {product.imageUrl && (
                <div className="aspect-video bg-muted rounded-md overflow-hidden">
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {product.description && (
                <div>
                  <h3 className="font-semibold mb-2">Descrição</h3>
                  <p className="text-muted-foreground">{product.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4">
                {product.category && (
                  <div>
                    <p className="text-sm text-muted-foreground">Categoria</p>
                    <p className="font-medium">{product.category}</p>
                  </div>
                )}

                {product.sku && (
                  <div>
                    <p className="text-sm text-muted-foreground">SKU</p>
                    <p className="font-medium">{product.sku}</p>
                  </div>
                )}

                {product.stock !== null && product.stock !== undefined && (
                  <div>
                    <p className="text-sm text-muted-foreground">Estoque</p>
                    <p className={`font-medium ${product.stock <= 0 ? "text-red-600" : ""}`}>
                      {product.stock} unidades
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground">Slug</p>
                  <p className="font-medium text-sm">{product.slug}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Criado em</p>
                  <p className="font-medium text-sm">
                    {format(new Date(product.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Atualizado em</p>
                  <p className="font-medium text-sm">
                    {format(new Date(product.updatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prices History */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Preços</CardTitle>
              <CardDescription>
                {product.prices.length} {product.prices.length === 1 ? "preço registrado" : "preços registrados"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {product.prices.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhum preço cadastrado</p>
              ) : (
                <div className="space-y-3">
                  {product.prices.map((price, index) => (
                    <div
                      key={price.id}
                      className="flex items-center justify-between p-3 border rounded-md"
                    >
                      <div>
                        <p className="font-semibold">{formatCurrency(price.amount)}</p>
                        {price.promoAmount && (
                          <p className="text-sm text-muted-foreground line-through">
                            {formatCurrency(price.promoAmount)}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(price.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {index === 0 && <Badge>Atual</Badge>}
                        {price.active ? (
                          <Badge className="bg-green-600">Ativo</Badge>
                        ) : (
                          <Badge variant="secondary">Inativo</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Price Card */}
          <Card>
            <CardHeader>
              <CardTitle>Preço Atual</CardTitle>
            </CardHeader>
            <CardContent>
              {latestPrice ? (
                <div>
                  <p className="text-3xl font-bold">
                    {formatCurrency(latestPrice.amount)}
                  </p>
                  {latestPrice.promoAmount && (
                    <p className="text-muted-foreground line-through mt-1">
                      {formatCurrency(latestPrice.promoAmount)}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">Sem preço definido</p>
              )}
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Vendas</span>
                </div>
                <span className="font-semibold">{product._count.orderItems}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Orçamentos</span>
                </div>
                <span className="font-semibold">{product._count.quoteItems}</span>
              </div>

              {product.stock !== null && product.stock !== undefined && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Estoque</span>
                  </div>
                  <span className={`font-semibold ${product.stock <= 0 ? "text-red-600" : ""}`}>
                    {product.stock}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  BedDouble,
  DollarSign,
  TrendingUp,
  Eye,
  BarChart3,
  Users,
  Calendar
} from "lucide-react";

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  // Dados simulados do quarto
  const product = {
    id: productId,
    name: "Suíte Master",
    description: "Vista para o mar, cama king size, banheira de hidromassagem",
    fullDescription: "A Suíte Master oferece uma experiência de hospedagem luxuosa com vista panorâmica para o mar. Equipada com cama king size, banheira de hidromassagem, ar-condicionado split, TV 55 polegadas, frigobar premium, cofre digital e varanda privativa. Ideal para casais em lua de mel ou viagens especiais.",
    price: "R$ 450,00/noite",
    cost: "R$ 150,00",
    category: "Suítes",
    stock: 4,
    status: "active",
    sku: "SUITE-MASTER-001",
    weight: "45m²",
    dimensions: "Vista para o mar",
    supplier: "Hotel Principal",
    createdAt: "15/03/2024",
    updatedAt: "10/09/2024",
    analytics: {
      totalSales: 45,
      totalRevenue: "R$ 20.250,00",
      averageRating: 4.8,
      reviews: 23,
      conversionRate: "85%",
      viewsLastMonth: 1250
    },
    recentSales: [
      {
        id: 1,
        customer: "João Silva",
        date: "18/09/2024",
        quantity: 3,
        total: "R$ 1.350,00"
      },
      {
        id: 2,
        customer: "Maria Santos",
        date: "15/09/2024",
        quantity: 2,
        total: "R$ 900,00"
      },
      {
        id: 3,
        customer: "Pedro Costa",
        date: "12/09/2024",
        quantity: 5,
        total: "R$ 2.250,00"
      }
    ]
  };

  const handleEdit = () => {
    router.push(`/dashboard/products/${productId}/edit`);
  };

  const handleBack = () => {
    router.push('/dashboard/products');
  };

  const profitMargin = ((parseFloat(product.price.replace('R$ ', '').replace(',', '.')) -
    parseFloat(product.cost.replace('R$ ', '').replace(',', '.'))) /
    parseFloat(product.price.replace('R$ ', '').replace(',', '.')) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Detalhes do Quarto</h1>
            <p className="text-muted-foreground">Informações completas sobre {product.name}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Informações Principais */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Quarto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start space-x-6">
                <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                  <BedDouble className="h-16 w-16 text-gray-400" />
                </div>
                <div className="space-y-4 flex-1">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <h2 className="text-xl font-semibold">{product.name}</h2>
                      <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                        {product.status === 'active' ? 'Disponível' : 'Ocupado'}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">{product.description}</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <span className="text-sm text-muted-foreground">Diária</span>
                      <div className="text-2xl font-bold text-primary">{product.price}</div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Margem de Lucro</span>
                      <div className="text-2xl font-bold text-green-600">{profitMargin}%</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t my-4"></div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="font-semibold">Detalhes do Quarto</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Código:</span>
                      <span>{product.sku}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tipo:</span>
                      <span>{product.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tamanho:</span>
                      <span>{product.weight}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vista:</span>
                      <span>{product.dimensions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Andar:</span>
                      <span>{product.supplier}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold">Histórico</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Criado em:</span>
                      <span>{product.createdAt}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Última edição:</span>
                      <span>{product.updatedAt}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Unidades disponíveis:</span>
                      <span className="font-semibold">{product.stock} quartos</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t my-4"></div>

              <div>
                <h3 className="font-semibold mb-2">Descrição Completa</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {product.fullDescription}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Reservas Recentes */}
          <Card>
            <CardHeader>
              <CardTitle>Reservas Recentes</CardTitle>
              <CardDescription>Últimas reservas deste quarto</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {product.recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold">{sale.customer}</h4>
                        <Badge variant="outline">{sale.quantity} noites</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {sale.date}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{sale.total}</p>
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar com Analytics */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total de Reservas</span>
                  <span className="font-semibold text-lg">{product.analytics.totalSales}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Receita Total</span>
                  <span className="font-semibold">{product.analytics.totalRevenue}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Avaliação Média</span>
                  <span className="font-semibold">{product.analytics.averageRating} ⭐</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Taxa de Ocupação</span>
                  <span className="font-semibold">{product.analytics.conversionRate}</span>
                </div>
              </div>

              <div className="border-t my-4"></div>

              <div className="space-y-4">
                <h3 className="font-semibold">Ações Rápidas</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Ver Relatório
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Users className="h-4 w-4 mr-2" />
                    Ver Avaliações
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Calendar className="h-4 w-4 mr-2" />
                    Histórico de Preços
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Análise Financeira</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Preço de Custo</span>
                  <span className="font-semibold">{product.cost}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Preço de Venda</span>
                  <span className="font-semibold">{product.price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Margem de Lucro</span>
                  <span className="font-semibold text-green-600">{profitMargin}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Taxa de Conversão</span>
                  <span className="font-semibold">{product.analytics.conversionRate}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
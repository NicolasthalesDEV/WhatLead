"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Save,
  Eye,
  BedDouble,
  Upload
} from "lucide-react";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  // Estados do formulário
  const [formData, setFormData] = useState({
    name: "Suíte Master",
    description: "Vista para o mar, cama king size, banheira de hidromassagem",
    fullDescription: "A Suíte Master oferece uma experiência de hospedagem luxuosa com vista panorâmica para o mar. Equipada com cama king size, banheira de hidromassagem, ar-condicionado split, TV 55 polegadas, frigobar premium, cofre digital e varanda privativa.",
    price: "450.00",
    cost: "150.00",
    category: "Suítes",
    stock: "4",
    status: "active",
    sku: "SUITE-MASTER-001",
    weight: "45",
    dimensions: "Vista para o mar",
    supplier: "Hotel Principal"
  });

  const [loading, setLoading] = useState(false);

  const categories = [
    "Suítes",
    "Standard",
    "Premium",
    "Deluxe",
    "Família",
    "Econômico"
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);

    // Simular salvamento
    setTimeout(() => {
      setLoading(false);
      router.push(`/dashboard/products/${productId}`);
    }, 1000);
  };

  const handleBack = () => {
    router.push(`/dashboard/products/${productId}`);
  };

  const handleViewDetails = () => {
    router.push(`/dashboard/products/${productId}`);
  };

  const profitMargin = ((parseFloat(formData.price) - parseFloat(formData.cost)) / parseFloat(formData.price) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Editar Quarto</h1>
            <p className="text-muted-foreground">Atualize as informações do quarto</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleViewDetails}>
            <Eye className="h-4 w-4 mr-2" />
            Ver Detalhes
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Formulário Principal */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>Dados principais do quarto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Imagem e Status */}
              <div className="flex items-start space-x-6">
                <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-gray-400 cursor-pointer transition-colors">
                  <div className="text-center">
                    <BedDouble className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <Upload className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Clique para enviar</p>
                  </div>
                </div>
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-2">
                    <Badge variant={formData.status === 'active' ? 'default' : 'secondary'}>
                      {formData.status === 'active' ? 'Disponível' : 'Ocupado'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">Código: {formData.sku}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Margem de lucro atual: <span className="font-semibold text-green-600">{profitMargin}%</span>
                  </p>
                </div>
              </div>

              {/* Campos básicos */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="name">Nome do Quarto</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Nome do quarto"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="description">Descrição Curta</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Descrição resumida"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Tipo</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  >
                    <option value="active">Disponível</option>
                    <option value="inactive">Manutenção</option>
                    <option value="out_of_stock">Ocupado</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullDescription">Descrição Completa</Label>
                <textarea
                  id="fullDescription"
                  value={formData.fullDescription}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('fullDescription', e.target.value)}
                  placeholder="Descrição detalhada do quarto"
                  rows={4}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </CardContent>
          </Card>

          {/* Precificação */}
          <Card>
            <CardHeader>
              <CardTitle>Precificação e Disponibilidade</CardTitle>
              <CardDescription>Configure diárias e disponibilidade</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="cost">Custo Operacional (R$)</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => handleInputChange('cost', e.target.value)}
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Diária (R$)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Unidades</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => handleInputChange('stock', e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <p className="text-sm">
                  <span className="font-semibold">Margem de Lucro:</span> {profitMargin}%
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Lucro por Diária:</span> R$ {(parseFloat(formData.price) - parseFloat(formData.cost)).toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Informações do Quarto */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Quarto</CardTitle>
              <CardDescription>Especificações e localização</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sku">Código</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => handleInputChange('sku', e.target.value)}
                    placeholder="Código do quarto"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Tamanho (m²)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => handleInputChange('weight', e.target.value)}
                    placeholder="0.0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dimensions">Vista</Label>
                  <Input
                    id="dimensions"
                    value={formData.dimensions}
                    onChange={(e) => handleInputChange('dimensions', e.target.value)}
                    placeholder="Ex: Vista para o mar"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier">Andar/Localização</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) => handleInputChange('supplier', e.target.value)}
                    placeholder="Andar ou localização"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                <BedDouble className="h-16 w-16 text-gray-400" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">{formData.name}</h3>
                <p className="text-sm text-muted-foreground">{formData.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-primary">R$ {formData.price}</span>
                  <Badge variant="secondary">{formData.category}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Estoque: {formData.stock}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full" onClick={handleViewDetails}>
                <Eye className="h-4 w-4 mr-2" />
                Ver Detalhes
              </Button>
              <Button
                className="w-full"
                onClick={handleSave}
                disabled={loading}
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div>
                <strong>Criado em:</strong> 15/03/2024
              </div>
              <div>
                <strong>Última edição:</strong> Hoje às 14:30
              </div>
              <div>
                <strong>Total de vendas:</strong> 45 unidades
              </div>
              <div>
                <strong>Receita gerada:</strong> R$ 2.245,50
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
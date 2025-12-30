"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  BedDouble,
  Save,
  Upload,
  DollarSign,
  Boxes,
  Tag,
  FileText,
  Image,
  Barcode
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function AddProductPage() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sku: "",
    barcode: "",
    category: "",
    price: "",
    comparePrice: "",
    cost: "",
    stock: "",
    minStock: "",
    weight: "",
    dimensions: "",
    tags: "",
    status: "active"
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    console.log("Salvando quarto:", formData);
    // Aqui você implementaria a lógica de salvar
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Adicionar Quarto</h1>
            <p className="text-muted-foreground">
              Cadastre um novo quarto no sistema
            </p>
          </div>
        </div>
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Salvar Quarto
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Formulário Principal */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BedDouble className="mr-2 h-5 w-5" />
              Informações do Quarto
            </CardTitle>
            <CardDescription>Dados principais do quarto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Nome e Descrição */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Quarto *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Suíte Master Vista Mar"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <textarea
                  id="description"
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Descrição detalhada do produto, características, aplicações..."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                />
              </div>
            </div>

            {/* SKU e Código de Barras */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU/Código *</Label>
                <Input
                  id="sku"
                  placeholder="LED-20W-001"
                  value={formData.sku}
                  onChange={(e) => handleInputChange("sku", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="barcode">Código de Barras</Label>
                <Input
                  id="barcode"
                  placeholder="7891234567890"
                  value={formData.barcode}
                  onChange={(e) => handleInputChange("barcode", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Input
                  id="category"
                  placeholder="Iluminação LED"
                  value={formData.category}
                  onChange={(e) => handleInputChange("category", e.target.value)}
                />
              </div>
            </div>

            {/* Preços */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <DollarSign className="mr-2 h-4 w-4" />
                Preços e Custos
              </h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="price">Preço de Venda *</Label>
                  <Input
                    id="price"
                    placeholder="125.00"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comparePrice">Preço Comparação</Label>
                  <Input
                    id="comparePrice"
                    placeholder="150.00"
                    type="number"
                    step="0.01"
                    value={formData.comparePrice}
                    onChange={(e) => handleInputChange("comparePrice", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost">Custo</Label>
                  <Input
                    id="cost"
                    placeholder="80.00"
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => handleInputChange("cost", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Estoque */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <Boxes className="mr-2 h-4 w-4" />
                Controle de Estoque
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="stock">Quantidade em Estoque</Label>
                  <Input
                    id="stock"
                    placeholder="100"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => handleInputChange("stock", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minStock">Estoque Mínimo</Label>
                  <Input
                    id="minStock"
                    placeholder="10"
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => handleInputChange("minStock", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Dimensões e Peso */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Dimensões e Peso</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="weight">Peso (kg)</Label>
                  <Input
                    id="weight"
                    placeholder="0.5"
                    type="number"
                    step="0.01"
                    value={formData.weight}
                    onChange={(e) => handleInputChange("weight", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dimensions">Dimensões (cm)</Label>
                  <Input
                    id="dimensions"
                    placeholder="30 x 30 x 2"
                    value={formData.dimensions}
                    onChange={(e) => handleInputChange("dimensions", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                placeholder="led, iluminacao, economico (separadas por vírgula)"
                value={formData.tags}
                onChange={(e) => handleInputChange("tags", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upload de Imagens */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Image className="mr-2 h-4 w-4" />
                Imagens
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Arraste imagens aqui ou clique para selecionar
                </p>
                <Button variant="outline" size="sm" className="mt-2">
                  Selecionar Arquivos
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: JPG, PNG, WebP (máx. 2MB cada)
              </p>
            </CardContent>
          </Card>

          {/* Status e Visibilidade */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Visibilidade</span>
                <Badge className="bg-green-100 text-green-800">Ativo</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Disponível em</span>
                <span className="font-medium">Catálogo</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Criado em</span>
                <span className="font-medium">Hoje</span>
              </div>
            </CardContent>
          </Card>

          {/* Dicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">💡 Dicas</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>• Use um SKU único para cada produto</p>
              <p>• Adicione imagens de alta qualidade</p>
              <p>• Descrições detalhadas aumentam as vendas</p>
              <p>• Configure alertas de estoque baixo</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
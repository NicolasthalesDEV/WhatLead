"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  CalendarCheck,
  Save,
  Search,
  Plus,
  Minus,
  User,
  BedDouble,
  Calculator,
  Truck,
  CreditCard,
  Phone
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  sku: string;
}

interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
}

interface CartItem extends Product {
  quantity: number;
}

export default function CreateOrderPage() {
  const [orderData, setOrderData] = useState({
    customerId: "",
    customerName: "",
    customerPhone: "",
    items: [],
    subtotal: 0,
    shipping: 0,
    discount: 0,
    total: 0,
    paymentMethod: "",
    notes: "",
    shippingAddress: ""
  });

  const [searchProduct, setSearchProduct] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Quartos simulados
  const products = [
    { id: 1, name: "Suíte Master", price: 450.00, stock: 4, sku: "SUITE-001" },
    { id: 2, name: "Quarto Standard", price: 180.00, stock: 12, sku: "STD-002" },
    { id: 3, name: "Suíte Premium", price: 320.00, stock: 6, sku: "PREM-003" },
    { id: 4, name: "Quarto Família", price: 280.00, stock: 8, sku: "FAM-004" }
  ];

  // Hóspedes simulados
  const customers = [
    { id: 1, name: "João Silva", phone: "(11) 99999-9999", email: "joao@email.com" },
    { id: 2, name: "Maria Santos", phone: "(11) 88888-8888", email: "maria@email.com" },
    { id: 3, name: "Pedro Costa", phone: "(11) 77777-7777", email: "pedro@email.com" }
  ];

  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const addToCart = (product: Product) => {
    const existingItem = cartItems.find(item => item.id === product.id);
    if (existingItem) {
      setCartItems(prev => prev.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCartItems(prev => [...prev, { ...product, quantity: 1 }]);
    }
    calculateTotal();
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCartItems(prev => prev.filter(item => item.id !== productId));
    } else {
      setCartItems(prev => prev.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
    calculateTotal();
  };

  const calculateTotal = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal + orderData.shipping - orderData.discount;
    setOrderData(prev => ({ ...prev, subtotal, total }));
  };

  const handleSave = () => {
    console.log("Criando reserva:", { ...orderData, items: cartItems });
    // Aqui você implementaria a lógica de criar reserva
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
            <h1 className="text-3xl font-bold tracking-tight">Nova Reserva</h1>
            <p className="text-muted-foreground">
              Crie uma nova reserva para um hóspede
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={cartItems.length === 0}>
          <Save className="mr-2 h-4 w-4" />
          Criar Reserva
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Seleção de Hóspede e Quartos */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarCheck className="mr-2 h-5 w-5" />
              Montar Reserva
            </CardTitle>
            <CardDescription>Selecione hóspede e adicione quartos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Seleção de Hóspede */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <User className="mr-2 h-4 w-4" />
                Hóspede
              </h3>
              {!selectedCustomer ? (
                <div className="grid gap-3">
                  {customers.map((customer) => (
                    <div
                      key={customer.id}
                      className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                      onClick={() => setSelectedCustomer(customer)}
                    >
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-muted-foreground">{customer.phone}</div>
                      </div>
                      <Button size="sm" variant="outline">
                        Selecionar
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <div className="font-medium">{selectedCustomer.name}</div>
                    <div className="text-sm text-muted-foreground">{selectedCustomer.phone}</div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedCustomer(null)}
                  >
                    Alterar
                  </Button>
                </div>
              )}
            </div>

            {/* Busca de Quartos */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <BedDouble className="mr-2 h-4 w-4" />
                Selecionar Quartos
              </h3>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar quartos..."
                  className="pl-8"
                  value={searchProduct}
                  onChange={(e) => setSearchProduct(e.target.value)}
                />
              </div>
              <div className="grid gap-3">
                {products
                  .filter(product =>
                    product.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
                    product.sku.toLowerCase().includes(searchProduct.toLowerCase())
                  )
                  .map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Código: {product.sku} • Disponíveis: {product.stock}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}/noite
                        </span>
                        <Button
                          size="sm"
                          onClick={() => addToCart(product)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Carrinho */}
            {cartItems.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Itens do Pedido</h3>
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)} cada
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <span className="w-20 text-right font-semibold">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumo e Finalização */}
        <div className="space-y-6">
          {/* Resumo do Pedido */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Calculator className="mr-2 h-4 w-4" />
                Resumo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(orderData.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Frete</span>
                <span>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(orderData.shipping)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Desconto</span>
                <span className="text-red-600">
                  -{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(orderData.discount)}
                </span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(orderData.total)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Forma de Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <CreditCard className="mr-2 h-4 w-4" />
                Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                PIX
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Cartão de Crédito
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Boleto
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Dinheiro
              </Button>
            </CardContent>
          </Card>

          {/* Ações Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Phone className="mr-2 h-4 w-4" />
                Ligar para Cliente
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Truck className="mr-2 h-4 w-4" />
                Calcular Frete
              </Button>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="outline">Rascunho</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Criado em</span>
                <span className="font-medium">Agora</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
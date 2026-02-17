# 🎯 Sistema de Erros Personalizados do WhatLead CRM

## 📖 Visão Geral

Sistema centralizado de erros personalizados com mensagens em português para melhor experiência do usuário.

---

## 🚀 Como Usar

### 1. **Importar erros necessários**

```typescript
import {
  errorResponse,
  UnauthorizedError,
  ValidationError,
  NotFoundError,
  DuplicateEmailError,
  // ... outros erros
} from "@/lib/errors";
```

### 2. **Lançar erros específicos**

```typescript
// ❌ ANTES (erro genérico)
return NextResponse.json(
  { error: "Email already in use" },
  { status: 409 }
);

// ✅ DEPOIS (erro personalizado)
throw new DuplicateEmailError();
// → Retorna: "Este email já está em uso. Tente outro ou faça login"
```

### 3. **Capturar e formatar erros**

```typescript
export async function POST(req: NextRequest) {
  try {
    // Sua lógica aqui
    const user = await createUser(data);
    return NextResponse.json({ user });
    
  } catch (error) {
    console.error("[handler] error:", error);
    return errorResponse(error as Error, "api/route/handler");
  }
}
```

---

## 📋 Classes de Erro Disponíveis

### **Autenticação (401)**

| Classe | Mensagem | Uso |
|--------|----------|-----|
| `UnauthorizedError` | "Você precisa estar autenticado..." | Login necessário |
| `InvalidCredentialsError` | "Email ou senha incorretos" | Login falhou |
| `ExpiredTokenError` | "Sua sessão expirou. Faça login novamente" | Token JWT expirado |
| `InvalidTokenError` | "Token de autenticação inválido" | Token malformado |

**Exemplo:**
```typescript
const user = await prisma.user.findUnique({ where: { email } });
if (!user) {
  throw new InvalidCredentialsError();
}
```

---

### **Permissão (403)**

| Classe | Mensagem | Uso |
|--------|----------|-----|
| `ForbiddenError` | "Você não tem permissão..." | Acesso negado |
| `InsufficientPermissionsError` | "Você não tem permissão para {ação}" | Falta permissão específica |

**Exemplo:**
```typescript
if (user.role !== "ADMIN") {
  throw new InsufficientPermissionsError("deletar usuários");
}
```

---

### **Não Encontrado (404)**

| Classe | Mensagem | Uso |
|--------|----------|-----|
| `NotFoundError` | "{Recurso} não encontrado" | Genérico |
| `CustomerNotFoundError` | "Cliente não encontrado" | Cliente específico |
| `OrderNotFoundError` | "Pedido não encontrado" | Pedido específico |
| `ProductNotFoundError` | "Produto não encontrado" | Produto específico |
| `QuoteNotFoundError` | "Orçamento não encontrado" | Orçamento específico |
| `FlowNotFoundError` | "Fluxo de chatbot não encontrado" | Chatbot específico |

**Exemplo:**
```typescript
const order = await prisma.order.findUnique({ where: { id } });
if (!order) {
  throw new OrderNotFoundError();
}
```

---

### **Validação (400)**

| Classe | Mensagem | Uso |
|--------|----------|-----|
| `ValidationError` | Mensagem customizada | Validação genérica |
| `InvalidInputError` | "Campo inválido: {campo}. {razão}" | Campo específico inválido |
| `MissingFieldError` | "Campo obrigatório: {campo}" | Campo faltando |
| `InvalidEmailError` | "Email inválido..." | Email malformado |
| `InvalidPhoneError` | "Telefone inválido..." | Telefone malformado |
| `WeakPasswordError` | "Senha fraca. Use no mínimo 8..." | Senha fraca |

**Exemplo:**
```typescript
const parseResult = schema.safeParse(body);
if (!parseResult.success) {
  const firstError = parseResult.error.issues[0];
  throw new ValidationError(firstError.message, parseResult.error.issues);
}

// Ou validação manual
if (!data.phoneE164.startsWith("+")) {
  throw new InvalidPhoneError();
}
```

---

### **Conflito (409)**

| Classe | Mensagem | Uso |
|--------|----------|-----|
| `ConflictError` | Mensagem customizada | Conflito genérico |
| `DuplicateEmailError` | "Este email já está em uso..." | Email duplicado |
| `DuplicatePhoneError` | "Este telefone já está cadastrado..." | Telefone duplicado |
| `DuplicateSlugError` | "Este nome de empresa já está em uso..." | Slug duplicado |
| `DuplicateResourceError` | "{Recurso} já existe..." | Recurso duplicado |

**Exemplo:**
```typescript
const existing = await prisma.user.findUnique({ where: { email } });
if (existing) {
  throw new DuplicateEmailError();
}
```

---

### **Regras de Negócio (422)**

| Classe | Mensagem | Uso |
|--------|----------|-----|
| `BusinessRuleError` | Mensagem customizada | Regra de negócio genérica |
| `InsufficientStockError` | "Estoque insuficiente de..." | Estoque esgotado |
| `InvalidOrderStatusError` | "Não é possível {ação}..." | Status de pedido inválido |
| `PaymentAlreadyProcessedError` | "Este pagamento já foi processado" | Pagamento duplicado |
| `QuoteExpiredError` | "Este orçamento expirou..." | Orçamento expirado |
| `InvalidAmountError` | "Valor inválido: {razão}" | Valor inválido |

**Exemplo:**
```typescript
if (product.stock < quantity) {
  throw new InsufficientStockError(product.title, product.stock);
}

if (order.status === "PAID") {
  throw new InvalidOrderStatusError("PAID", "cancelar");
}
```

---

### **Rate Limit (429)**

| Classe | Mensagem | Uso |
|--------|----------|-----|
| `RateLimitError` | "Muitas tentativas. Aguarde..." | Limite de requisições |

**Exemplo:**
```typescript
if (!checkRateLimit(key, 5, 15 * 60 * 1000)) {
  throw new RateLimitError(900); // 15 minutos em segundos
}
```

---

### **Integração (502, 503)**

| Classe | Mensagem | Uso |
|--------|----------|-----|
| `IntegrationError` | "Erro ao conectar com {serviço}..." | Integração genérica |
| `WhatsAppError` | "Erro ao conectar com WhatsApp..." | WhatsApp específico |
| `PaymentGatewayError` | "Erro ao conectar com gateway..." | Gateway de pagamento |
| `DatabaseError` | "Erro ao acessar banco de dados..." | Banco de dados |

**Exemplo:**
```typescript
try {
  await sendWhatsAppMessage(phone, message);
} catch (error) {
  throw new WhatsAppError("Não foi possível enviar mensagem");
}
```

---

### **Erros Internos (500, 501)**

| Classe | Mensagem | Uso |
|--------|----------|-----|
| `InternalServerError` | "Erro interno do servidor..." | Erro desconhecido |
| `NotImplementedError` | "Funcionalidade ainda não disponível" | Feature não implementada |

**Exemplo:**
```typescript
if (!featureFlag.enabled) {
  throw new NotImplementedError("Relatórios avançados");
}
```

---

## 🛠️ Helpers de Validação

Helpers prontos para validações comuns:

```typescript
import { validateEmail, validatePhone, validatePassword, validateRequired } from "@/lib/errors";

// Validar email
validateEmail(email); // Lança InvalidEmailError se inválido

// Validar telefone
validatePhone(phone); // Lança InvalidPhoneError se inválido

// Validar senha
validatePassword(password); // Lança WeakPasswordError se fraca

// Validar campo obrigatório
validateRequired(value, "Nome"); // Lança MissingFieldError se vazio
```

---

## 📦 Resposta Padronizada

Todas as respostas de erro seguem o formato:

```json
{
  "error": {
    "code": "DUPLICATE_EMAIL",
    "message": "Este email já está em uso. Tente outro ou faça login",
    "details": { /* opcional */ }
  },
  "meta": {
    "requestId": "uuid-123...",
    "timestamp": "2026-02-17T20:00:00.000Z",
    "handler": "api/auth/register"
  }
}
```

### Headers automáticos:

```
X-Request-Id: uuid-123...
X-Route-Handler: api/auth/register
```

---

## 🎯 Exemplos Completos

### **Endpoint de Registro**

```typescript
export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    if (!checkRateLimit(ip, 3, 3600000)) {
      throw new RateLimitError(3600);
    }

    // Validação
    const body = schema.safeParse(await req.json());
    if (!body.success) {
      throw new ValidationError("Dados inválidos", body.error.issues);
    }

    // Verificar duplicados
    const existing = await prisma.user.findUnique({ 
      where: { email: body.data.email } 
    });
    if (existing) {
      throw new DuplicateEmailError();
    }

    // Criar usuário
    const user = await createUser(body.data);
    return NextResponse.json({ user }, { status: 201 });

  } catch (error) {
    return errorResponse(error as Error, "api/auth/register");
  }
}
```

### **Endpoint de Pedido**

```typescript
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) {
      throw new UnauthorizedError();
    }

    const body = await req.json();
    
    // Validar itens
    if (!body.items || body.items.length === 0) {
      throw new ValidationError("Adicione pelo menos um produto ao pedido");
    }

    // Verificar estoque
    for (const item of body.items) {
      const product = await prisma.product.findUnique({ 
        where: { id: item.productId } 
      });
      
      if (!product) {
        throw new ProductNotFoundError();
      }
      
      if (product.stock < item.quantity) {
        throw new InsufficientStockError(product.title, product.stock);
      }
    }

    // Criar pedido
    const order = await createOrder(body);
    return NextResponse.json({ order }, { status: 201 });

  } catch (error) {
    return errorResponse(error as Error, "api/orders");
  }
}
```

---

## 🎨 Mensagens Personalizadas

Constantes com mensagens amigáveis em português:

```typescript
import { ERROR_MESSAGES } from "@/lib/errors";

// Usar mensagens pré-definidas
throw new ValidationError(ERROR_MESSAGES.ORDER.EMPTY_CART);

// Ou criar mensagem customizada
throw new BusinessRuleError("Não é possível processar pedido sem endereço de entrega");
```

---

## 🧪 Logs Automáticos

O sistema loga automaticamente erros não tratados:

```typescript
// Erro customizado (AppError) → loga detalhes
throw new DuplicateEmailError();

// Erro genérico → loga stack trace completo
throw new Error("Something went wrong");
// Console: "[handler] Unhandled error: Something went wrong"
```

---

## ✅ Benefícios

1. **✨ Mensagens em português** - UX melhorada
2. **🎯 Código limpo** - `throw new DuplicateEmailError()` vs 10 linhas
3. **📊 Padronização** - Todas as respostas seguem o mesmo formato
4. **🔍 Rastreabilidade** - `requestId` único em cada erro
5. **🛠️ Manutenibilidade** - Alterar mensagem em um lugar
6. **📝 Documentação** - Código auto-documentado

---

## 🚀 Migração de Código Antigo

### Antes:
```typescript
return NextResponse.json(
  { error: "Email already exists" },
  { status: 409 }
);
```

### Depois:
```typescript
throw new DuplicateEmailError();
```

**Resultado:** Mensagem em português, status code correto, formato padronizado, requestId gerado automaticamente! 🎉

---

## 📚 Próximos Passos

1. ✅ Sistema criado em `/apps/web/src/lib/errors.ts`
2. ✅ Atualizado: `auth/register`, `auth/login`, `customers`
3. ⏳ Atualizar: `orders`, `products`, `quotes`, `payments`
4. ⏳ Adicionar testes automáticos
5. ⏳ Criar middleware global de erros

---

**Documentação criada em:** 17 de fevereiro de 2026

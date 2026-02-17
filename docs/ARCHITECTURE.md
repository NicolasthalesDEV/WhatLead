# Arquitetura do Projeto WhatLead

## 📋 Visão Geral

WhatLead é uma plataforma CRM completa para gestão de vendas via WhatsApp com foco em automação, conversão e análise de métricas. O projeto utiliza um monorepo (Turborepo) com Next.js, Prisma e PostgreSQL.

---

## 🏗️ Estrutura do Monorepo

```
WhatLead/
├── apps/
│   ├── web/                    # Aplicação Next.js principal
│   │   ├── src/
│   │   │   ├── app/           # App Router (Next.js 15)
│   │   │   │   ├── (auth)/    # Grupo de rotas de autenticação
│   │   │   │   ├── api/       # API Routes
│   │   │   │   └── dashboard/ # Dashboard principal
│   │   │   ├── components/    # Componentes React reutilizáveis
│   │   │   ├── hooks/         # Custom React Hooks
│   │   │   └── lib/           # Utils e bibliotecas auxiliares
│   │   └── public/            # Assets estáticos
│   │
│   └── worker/                # Background jobs (futuro)
│       └── src/
│           └── index.ts       # Worker para processar filas
│
├── packages/
│   └── db/                    # Package do banco de dados
│       ├── prisma/
│       │   ├── schema.prisma  # Schema do banco (20+ models)
│       │   └── migrations/    # Migrações do Prisma
│       └── src/
│           ├── client.ts      # Cliente Prisma exportado
│           └── index.ts       # Exports principais
│
├── infra/
│   └── docker-compose.yml     #  PostgreSQL local
│
├── docs/                       # Documentação do projeto
│   ├── ARCHITECTURE.md        # Este arquivo
│   ├── PERFORMANCE.md         # Guia de otimização
│   ├── WHATSAPP_SETUP.md      # Setup do WhatsApp Cloud API
│   └── PIX_SETUP.md           # Setup dos gateways PIX
│
├── scripts/                    # Scripts auxiliares
│   ├── dev.seed.ts            # Seed de dados para desenvolvimento
│   └── setup.sh               # Setup inicial do projeto
│
├── package.json               # Root package.json (workspaces)
├── pnpm-workspace.yaml        # Configuração do pnpm workspaces
├── turbo.json                 # Configuração do Turborepo
└── tsconfig.base.json         # TypeScript config compartilhado
```

---

## 🎯 Tecnologias Principais

### Frontend
- **Next.js 15** (App Router) - Framework React com SSR/SSG
- **React 19** - Biblioteca de UI
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização utility-first
- **Shadcn/ui** - Componentes base acessíveis
- **date-fns** - Manipulação de datas
- **Lucide React** - Ícones

### Backend
- **Next.js API Routes** - Backend serverless
- **Prisma ORM** - ORM para PostgreSQL
- **Zod** - Validação de schemas
- **bcryptjs** - Hash de senhas
- **jsonwebtoken** - Autenticação JWT

### Database
- **PostgreSQL** - Banco de dados relacional
- **Prisma** - ORM e migrations

### Integrações
- **WhatsApp Cloud API** (Facebook/Meta) - Mensagens
- **Mercado Pago** - Gateway PIX
- **Asaas** - Gateway PIX alternativo
- **Puppeteer** - Geração de PDFs

### DevOps
- **Turborepo** - Build system do monorepo
- **pnpm** - Package manager rápido
- **Docker** - PostgreSQL em container para dev

---

## 📐 Arquitetura de Software

### Camadas da Aplicação

```
┌─────────────────────────────────────────────┐
│           FRONTEND (Next.js App)            │
│  ┌────────────┐  ┌──────────────────────┐  │
│  │  Dashboard │  │  Components/UI       │  │
│  │  Pages     │  │  (Shadcn/Tailwind)   │  │
│  └────────────┘  └──────────────────────┘  │
└──────────────────┬──────────────────────────┘
                   │ HTTP/REST
┌──────────────────┴──────────────────────────┐
│         BACKEND (API Routes)                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Auth    │  │  CRUD    │  │  Business│  │
│  │  APIs    │  │  APIs    │  │  Logic   │  │
│  └──────────┘  └──────────┘  └──────────┘  │
└──────────────────┬──────────────────────────┘
                   │ Prisma Client
┌──────────────────┴──────────────────────────┐
│         DATA LAYER (Prisma + PostgreSQL)    │
│  ┌────────────────────────────────────────┐ │
│  │  20+ Models (User, Company, Customer, │ │
│  │  Order, Product, WhatsMessage, etc.)   │ │
│  └────────────────────────────────────────┘ │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────┴──────────────────────────┐
│     EXTERNAL INTEGRATIONS                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ WhatsApp │  │   PIX    │  │ Webhooks │  │
│  │  Cloud   │  │ Gateways │  │ Outbound │  │
│  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────┘
```

---

## 🗄️ Modelo de Dados

### Entidades Principais

#### **Core Entities**
- `Company` - Empresas (multi-tenant)
- `User` - Usuários do sistema (com RBAC)
- `Session` - Sessões de autenticação
- `AuditLog` - Logs de auditoria

#### **Customer & Sales**
- `Customer` - Clientes
- `Product` - Produtos com preços
- `Quote` - Orçamentos
- `Order` - Pedidos
- `Payment` - Pagamentos (PIX)

#### **Communication**
- `WhatsChannel` - Canais do WhatsApp
- `WhatsMessage` - Mensagens do WhatsApp
- `Notification` - Notificações do sistema

#### **Automation**
- `ChatbotFlow` - Fluxos do chatbot
- `ChatbotTrigger` - Gatilhos de automação
- `QuickResponse` - Respostas rápidas

#### **Sales Funnel**
- `FunnelStage` - Estágios do funil
- `FunnelCard` - Cards/leads no funil

#### **Support**
- `Ticket` - Tickets de suporte
- `TicketComment` - Comentários dos tickets

#### **Analytics**
- `DailyMetric` - Métricas diárias
- `NPSSurvey` - Pesquisas NPS
- `NPSResponse` - Respostas NPS

#### **Webhooks**
- `WebhookEndpoint` - Endpoints configurados
- `WebhookDelivery` - Log de entregas

### Relacionamentos

```
Company 1──N User
Company 1──N Customer
Company 1──N Product
Company 1──N Order
Company 1──N WhatsChannel
Company 1──N WhatsMessage
Company 1──N FunnelStage
Company 1──N ChatbotFlow
Company 1──N Ticket
Company 1──N WebhookEndpoint

Customer 1──N Order
Customer 1──N Quote
Customer 1──N WhatsMessage
Customer 1──N FunnelCard
Customer 1──N Ticket

Order N──N Product (through OrderItem)
Quote N──N Product (through QuoteItem)

Order 1──N Payment
Order 1──N OrderHistory
Order 1──N NPSResponse

FunnelStage 1──N FunnelCard

Ticket 1──N TicketComment
```

---

## 🔐 Autenticação & Autorização

### Autenticação (JWT)
- **Access Token**: JWT válido por 1 hora
- **Refresh Token**: Válido por 7 dias, armazenado no banco
- **2FA**: TOTP com códigos de backup
- **Session Management**: Múltiplas sessões por usuário

### Autorização (RBAC)

**Roles:**
- `OWNER` - Dono da empresa (acesso total)
- `ADMIN` - Administrador (gerencia usuários e configurações)
- `SELLER` - Vendedor (acesso aos seus clientes/pedidos)
- `SUPPORT` - Suporte (acesso a tickets)

**Permissions (42+):**
```typescript
// Exemplos de permissões
'users:create', 'users:delete'
'orders:read', 'orders:read_all'
'customers:update', 'customers:delete'
'chatbot:create', 'chatbot:configure'
'webhooks:create', 'webhooks:delete'
'audit:read'
```

**Implementação:**
- `apps/web/src/lib/permissions.ts` - Matriz de permissões
- `apps/web/src/lib/authorization.ts` - Middleware de autorização
- `apps/web/src/lib/auth.ts` - Funções de autenticação

---

## 📡 APIs e Rotas

### Estrutura de Rotas

```
/api/
├── auth/                       # Autenticação
│   ├── login
│   ├── register
│   ├── refresh
│   ├── logout
│   ├── 2fa/
│   ├── verify-email/
│   ├── forgot-password/
│   └── sessions/
│
├── user/                       # Usuário
│   ├── profile
│   └── change-password
│
├── company/                    # Empresa
│   └── settings
│
├── customers/                  # Clientes
│   ├── GET /                   # Listar
│   ├── POST /                  # Criar
│   └── [id]/
│       ├── GET                 # Detalhes
│       ├── PATCH               # Atualizar
│       └── DELETE              # Deletar
│
├── products/                   # Produtos
├── quotes/                     # Orçamentos
├── orders/                     # Pedidos
│   └── [id]/
│       ├── payments/pix/       # Criar cobrança PIX
│       └── pdf/                # Gerar PDF
│
├── whatsapp/                   # WhatsApp
│   ├── conversations/          # Listar conversas
│   │   └── [customerId]/      # Mensagens da conversa
│   │       └── messages/       # Enviar mensagem
│   └── media/[mediaId]/        # Download de mídia
│
├── chatbot/                    # Chatbot
│   ├── flows/
│   ├── triggers/
│   └── quick-responses/
│
├── funnel/                     # Funil
│   ├── stages/
│   ├── cards/
│   └── metrics/
│
├── nps/                        # NPS
│   └── surveys/
│       └── [id]/
│
├── tickets/                    # Suporte
│   └── [id]/
│       └── comments/
│
├── webhooks/                   # Webhooks Outbound
│   ├── endpoints/
│   └── deliveries/
│       └── [id]/retry/
│
├── notifications/              # Notificações
│   ├── GET /                   # Listar
│   ├── [id]/read               # Marcar como lida
│   ├── mark-all-read/          # Marcar todas
│   └── stream/                 # SSE stream
│
├── reports/                    # Relatórios
│   └── conversion/
│
├── search/                     # Busca Global
│
└── webhooks/                   # Webhooks Inbound
    ├── whatsapp/               # Webhook do WhatsApp
    └── pix/                    # Webhook dos gateways PIX
```

### Padrões de API

**Respostas de sucesso:**
```json
{
  "data": { /* objeto ou array */ },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

**Respostas de erro:**
```json
{
  "error": "Mensagem de erro",
  "details": { /* detalhes opcionais */ }
}
```

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validação falhou)
- `401` - Unauthorized (não autenticado)
- `403` - Forbidden (sem permissão)
- `404` - Not Found
- `500` - Internal Server Error

---

## 🔄 Fluxos Principais

### 1. Fluxo de Autenticação

```
User → POST /api/auth/login
  → Validar email/senha (bcrypt)
  → Gerar Access Token (JWT, 1h)
  → Gerar Refresh Token (salvar no DB)
  → Retornar tokens + dados do usuário
  → Frontend armazena tokens

User → POST /api/auth/refresh
  → Validar Refresh Token
  → Gerar novo Access Token
  → Retornar novo token

User → POST /api/auth/logout
  → Revogar sessão (deletar refresh token)
```

### 2. Fluxo de Pedido com PIX

```
1. Cliente envia mensagem no WhatsApp
   → Webhook /api/webhooks/whatsapp
   → Salvar mensagem no banco
   → Processar com chatbot (se configurado)

2. Vendedor cria pedido no dashboard
   → POST /api/orders
   → Salvar pedido (status: PENDING)

3. Gerar cobrança PIX
   → POST /api/orders/[id]/payments/pix
   → Chamar gateway (Mercado Pago/Asaas)
   → Criar Payment (status: PENDING)
   → Retornar QR Code + Pix Copy & Paste

4. Cliente paga
   → Gateway envia webhook → /api/webhooks/pix
   → Atualizar Payment (status: PAID)
   → Atualizar Order (status: PAID)
   → Criar notificação para vendedor
   → Disparar webhook outbound (se configurado)
   → Agendar envio de NPS (após X dias)

5. Envio de NPS
   → Worker ou cron job
   → Buscar pedidos elegíveis
   → Enviar mensagem WhatsApp com link NPS
   → Salvar NPSResponse

6. Cliente responde NPS
   → POST /api/public/nps/[surveyId]/respond
   → Salvar resposta
   → Calcular sentimento (Promotor/Neutro/Detrator)
```

### 3. Fluxo de Conversação WhatsApp

```
1. Cliente envia mensagem
   → WhatsApp → Webhook /api/webhooks/whatsapp
   → Salvar WhatsMessage (direction: IN, status: delivered)
   → Processar triggers do chatbot
   → Executar fluxo automatizado (se match)

2. Vendedor responde no inbox
   → Frontend → POST /api/whatsapp/conversations/[id]/messages
   → Enviar via WhatsApp Cloud API
   → Salvar WhatsMessage (direction: OUT, status: sent)
   → Retornar mensagem criada

3. WhatsApp confirma entrega
   → Webhook /api/webhooks/whatsapp (status update)
   → Atualizar status da mensagem (sent → delivered → read)
```

---

## 🎨 Frontend Architecture

### Componentes

**UI Base (Shadcn):**
- `components/ui/` - Componentes base reutilizáveis
  - Button, Card, Input, Textarea, Badge, etc.

**Business Components:**
- `components/header.tsx` - Header com busca global
- `components/sidebar.tsx` - Navegação principal
- `components/notification-bell.tsx` - Notificações real-time

**Pages (App Router):**
- `app/dashboard/` - Páginas do dashboard
  - `customers/`, `products/`, `orders/`, `quotes/`
  - `funnel/`, `whatsapp/`, `chatbot/`, `nps/`, `tickets/`
  - `reports/`, `settings/`, `profile/`

### State Management

**Server State:**
- Fetch direto nas Server Components (Next.js 15)
- Client Components: `useState` + `useEffect`
- Futuro: SWR ou React Query para cache

**Client State:**
- `useState` - Estado local de componentes
- Context API - Compartilhar estado (ex: tema, user)

### Real-Time

**Server-Sent Events (SSE):**
- `GET /api/notifications/stream` - Stream de notificações
- Frontend: `EventSource` para receber em tempo real

**Polling:**
- WhatsApp Inbox: Poll a cada 3-5s para novas mensagens
- Dashboard metrics: Poll a cada 30s

---

## 🚀 Deploy e Infraestrutura

### Ambientes

**Development:**
```bash
# Banco local via Docker
docker-compose up -d

# Next.js dev server
pnpm dev

# Prisma Studio
pnpm db:studio
```

**Staging/Production:**
- **Frontend + API**: Vercel / AWS / Digital Ocean
- **Database**: Neon / Supabase / AWS RDS
- **Assets**: Cloudflare R2 / AWS S3
- **Monitoring**: Sentry / Datadog

### Variáveis de Ambiente

```env
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..." # Para  migrations

# Auth
JWT_SECRET="..."
JWT_REFRESH_SECRET="..."

# WhatsApp Cloud API
WA_PHONE_NUMBER_ID="..."
WA_ACCESS_TOKEN="..."
WA_VERIFY_TOKEN="..."
WA_BUSINESS_ACCOUNT_ID="..."

# PIX Gateways
PSP_PROVIDER="mercadopago" # ou "asaas"
MERCADOPAGO_ACCESS_TOKEN="..."
ASAAS_API_KEY="..."
```

---

## 📊 Monitoramento e Logs

### Logs

**Estrutura:**
```typescript
console.log('[MODULE]', 'action', { context });
console.error('[MODULE] Error:', error);
console.warn('[MODULE] Warning:', warning);
```

**Prisma Query Logging:**
```typescript
// Log queries lentas (> 1s)
prisma.$on('query', (e) => {
  if (e.duration > 1000) {
    console.warn('Slow query:', {
      query: e.query,
      duration: `${e.duration}ms`,
    });
  }
});
```

### Métricas

**Prisma:**
- Query count
- Query duration
- Connection pool usage

**Next.js:**
- Build time
- Bundle size
- Page load time

**Business:**
- Pedidos por dia
- Taxa de conversão
- Tempo médio de resposta WhatsApp
- NPS score

---

## 🔧 Manutenção

### Migrations

```bash
# Criar migration
pnpm db:migrate:dev

# Deploy migrations (production)
pnpm db:migrate:deploy

# Reset database (development)
pnpm db:reset

# Seed data
pnpm db:seed
```

### Backup

**Database:**
- Backup incremental diário
- Backup full semanal
- Retenção: 30 dias

**Código:**
- Git com branches protegidas
- CI/CD pipeline para deploys

---

## 📚 Referências

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Mercado Pago API](https://www.mercadopago.com.br/developers/pt/reference)
- [Asaas API](https://docs.asaas.com/)

---

**Última atualização:** 16/02/2026  
**Versão:** 1.0.0


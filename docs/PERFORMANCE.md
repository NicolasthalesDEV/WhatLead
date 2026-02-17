# Guia de Otimização de Performance - WhatLead

## 📊 Status Atual
- ✅ Todas as funcionalidades implementadas (13/13 módulos)
- ⚠️ Otimizações de performance pendentes
- 🎯 Objetivo: Melhorar performance para produção

---

## 🔍 1. Otimização de Queries Prisma

### Índices Recomendados

Os seguintes índices já estão implementados no schema. Para adicionar mais:

```prisma
// Já implementado:
@@index([companyId])
@@index([active])
@@index([createdAt])
@@index([userId])
@@index([customerId])
@@index([phoneE164])

// Recomendações adicionais:

model WhatsMessage {
  // Adicionar para otimizar listagem de conversas
  @@index([companyId, customerId, createdAt])
  // Adicionar para otimizar busca de não lidas
  @@index([companyId, direction, status])
}

model Order {
  // Adicionar para otimizar dashboard
  @@index([companyId, status, createdAt])
  // Adicionar para busca por cliente
  @@index([customerId, createdAt])
}

model FunnelCard {
  // Adicionar para drag-and-drop rápido
  @@index([stageId, order])
  // Adicionar para filtro por vendedor
  @@index([assignedToId, companyId])
}

model Notification {
  // Adicionar para listagem de não lidas
  @@index([userId, read, createdAt])
}

model AuditLog {
  // Adicionar para filtros do dashboard
  @@index([companyId, action, createdAt])
  @@index([userId, createdAt])
}
```

### Select Fields Optimization

**Sempre especifique apenas os campos necessários:**

```typescript
// ❌ Ruim: busca todos os campos
const customers = await prisma.customer.findMany();

// ✅ Bom: busca apenas o necessário
const customers = await prisma.customer.findMany({
  select: {
    id: true,
    name: true,
    phoneE164: true,
  },
});
```

### Pagination

**Sempre implemente paginação em listagens:**

```typescript
// ✅ Com paginação
const page = 1;
const limit = 20;

const [items, total] = await Promise.all([
  prisma.customer.findMany({
    take: limit,
    skip: (page - 1) * limit,
  }),
  prisma.customer.count(),
]);
```

### Batch Operations

**Use createMany, updateMany, deleteMany quando possível:**

```typescript
// ❌ Ruim: N queries
for (const item of items) {
  await prisma.item.create({ data: item });
}

// ✅ Bom: 1 query
await prisma.item.createMany({
  data: items,
  skipDuplicates: true,
});
```

---

## ⚡ 2. Otimização de Componentes React

### Lazy Loading

**Componentes pesados devem ser carregados sob demanda:**

```typescript
// apps/web/src/app/dashboard/reports/page.tsx
import dynamic from 'next/dynamic';

// Lazy load do gráfico
const Chart = dynamic(() => import('@/components/Chart'), {
  loading: () => <div>Carregando gráfico...</div>,
  ssr: false,
});

// Lazy load de modais
const NPSModal = dynamic(() => import('@/components/NPSModal'));
```

### React.memo

**Memoize componentes que renderizam listas:**

```typescript
const ConversationItem = React.memo(({ conversation }: Props) => {
  return <div>{/* render */}</div>;
});
```

### useMemo e useCallback

```typescript
const ExpensiveComponent = () => {
  // Memoize cálculos pesados
  const sortedItems = useMemo(() => {
    return items.sort((a, b) => a.createdAt - b.createdAt);
  }, [items]);

  // Memoize callbacks passados para children
  const handleClick = useCallback((id: string) => {
    // handler
  }, [dependency]);
};
```

---

## 🖼️ 3. Otimização de Imagens

### Usar Next.js Image Component

```typescript
import Image from 'next/image';

// ❌ Ruim
<img src={product.imageUrl} alt={product.title} />

// ✅ Bom
<Image
  src={product.imageUrl}
  alt={product.title}
  width={400}
  height={300}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

### Configurar next.config.js

```javascript
// apps/web/next.config.js
module.exports = {
  images: {
    domains: ['seu-bucket.s3.amazonaws.com', 'cdn.exemplo.com'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};
```

---

## 💾 4. Cache e Revalidation

### Server-Side Caching (Next.js App Router)

```typescript
// Revalidate a cada 1 hora
export const revalidate = 3600;

export async function GET() {
  const data = await fetchData();
  return NextResponse.json(data);
}
```

### Client-Side Caching (SWR ou React Query)

```typescript
import useSWR from 'swr';

function Dashboard() {
  const { data, error } = useSWR('/api/dashboard', fetcher, {
    refreshInterval: 30000, // Atualiza a cada 30s
    revalidateOnFocus: false,
    dedupingInterval: 10000,
  });
}
```

### Redis Cache (Futuro)

**Para dados frequentemente acessados:**

```typescript
// Exemplo de implementação futura
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function getConversations(companyId: string) {
  const cacheKey = `conversations:${companyId}`;
  
  // Tentar buscar do cache
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  // Buscar do banco
  const data = await prisma.whatsMessage.findMany({
    where: { companyId },
  });
  
  // Salvar no cache (5 minutos)
  await redis.set(cacheKey, JSON.stringify(data), 'EX', 300);
  
  return data;
}
```

---

## 🔧 5. Otimizações de Build

### Bundle Analysis

```bash
# Analisar tamanho do bundle
cd apps/web
pnpm add -D @next/bundle-analyzer

# next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // config
});

# Executar análise
ANALYZE=true pnpm build
```

### Code Splitting

```typescript
// Importar apenas quando necessário
const handleExport = async () => {
  const XLSX = await import('xlsx');
  // usar XLSX
};
```

---

## 📱 6. Otimizações Mobile

### Viewport Meta Tag

```html
<!-- apps/web/src/app/layout.tsx -->
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
```

### Lazy Load Offscreen Content

```typescript
// Usar Intersection Observer para carregar apenas quando visível
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      // Carregar conteúdo
    }
  });
});
```

---

## 🎯 7. Query Optimization Checklist

### APIs Existentes que Precisam de Otimização

✅ **Já Otimizados:**
- `/api/whatsapp/conversations` - usa raw query otimizada com DISTINCT ON
- `/api/search` - usa select específico e limites

⚠️ **Precisam de Review:**
- `/api/customers` - adicionar select fields específicos
- `/api/products` - adicionar select fields específicos
- `/api/orders` - verificar N+1 queries com relations
- `/api/funnel/cards` - otimizar query de cards com metrics

### Exemplo de Refatoração

```typescript
// ❌ Antes: N+1 problem
const orders = await prisma.order.findMany();
for (const order of orders) {
  order.customer = await prisma.customer.findUnique({
    where: { id: order.customerId },
  });
}

// ✅ Depois: Include
const orders = await prisma.order.findMany({
  include: {
    customer: {
      select: {
        id: true,
        name: true,
        phoneE164: true,
      },
    },
  },
});
```

---

## 📊 8. Monitoring Queries

### Prisma Query Logging

```typescript
// apps/web/src/lib/db.ts
export const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ],
});

// Log queries lentas (> 1s)
prisma.$on('query', (e) => {
  if (e.duration > 1000) {
    console.warn('Slow query:', {
      query: e.query,
      duration: `${e.duration}ms`,
      params: e.params,
    });
  }
});
```

---

## ✅ Checklist de Implementação

### Fase 1: Quick Wins (1 dia)
- [ ] Adicionar índices compostos no schema Prisma
- [ ] Rodar migration para criar índices
- [ ] Adicionar select fields específicos nas principais queries
- [ ] Implementar paginação em APIs que retornam listas grandes
- [ ] Substituir <img> por Next Image nos dashboards

### Fase 2: Component Optimization (2 dias)
- [ ] Lazy load de componentes pesados (gráficos, modais)
- [ ] Adicionar React.memo em listas
- [ ] Implementar useMemo para cálculos
- [ ] Configurar Image domains no next.config.js

### Fase 3: Caching (1 dia)
- [ ] Adicionar revalidate em rotas estáticas
- [ ] Implementar SWR/React Query no frontend
- [ ] Configurar cache headers nas APIs

### Fase 4: Monitoring (1 dia)
- [ ] Ativar query logging do Prisma
- [ ] Configurar bundle analyzer
- [ ] Profile components com React DevTools
- [ ] Identificar e corrigir queries lentas

---

## 🚀 Performance Targets

### Métricas de Sucesso
- 📄 **Lighthouse Score**: > 90
- ⚡ **FCP (First Contentful Paint)**: < 1.5s
- 🎨 **LCP (Largest Contentful Paint)**: < 2.5s
- 🔄 **TTI (Time to Interactive)**: < 3.5s
- 🗄️ **Database Queries**: < 100ms (p95)
- 📦 **Bundle Size**: < 300KB (gzipped)

### Ferramentas de Medição
- Lighthouse CI
- WebPageTest
- Chrome DevTools Performance Tab
- Next.js Built-in Analytics
- Prisma Query Logging

---

## 📝 Notas

- **Prioridade**: Focar em otimizações que impactam UX (queries lentas, components pesados)
- **Não otimize cedo demais**: Meça primeiro, otimize depois
- **Redis**: Adicionar apenas se necessário (MVP pode funcionar sem)
- **CDN**: Configurar para assets estáticos e imagens

---

**Última atualização:** 16/02/2026  
**Status:** Guia pronto, aguardando implementação

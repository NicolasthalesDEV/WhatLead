# 🤝 Guia de Contribuição - WhatLead CRM

Obrigado por considerar contribuir com o WhatLead! Este documento fornece diretrizes para contribuir com o projeto.

---

## 📋 Índice

- [Código de Conduta](#código-de-conduta)
- [Como Posso Contribuir?](#como-posso-contribuir)
- [Configuração do Ambiente](#configuração-do-ambiente)
- [Workflow de Desenvolvimento](#workflow-de-desenvolvimento)
- [Padrões de Código](#padrões-de-código)
- [Commits e Pull Requests](#commits-e-pull-requests)
- [Testes](#testes)
- [Documentação](#documentação)

---

## 📜 Código de Conduta

### Nossos Padrões

**Comportamentos esperados:**
- Use linguagem acolhedora e inclusiva
- Respeite pontos de vista e experiências diferentes
- Aceite críticas construtivas com positividade
- Foque no que é melhor para a comunidade
- Mostre empatia com outros membros

**Comportamentos inaceitáveis:**
- Uso de linguagem ou imagens sexualizadas
- Comentários insultuosos ou depreciativos (trolling)
- Assédio público ou privado
- Publicar informações privadas de terceiros
- Qualquer conduta imprópria em ambiente profissional

---

## 🎯 Como Posso Contribuir?

### Reportando Bugs

Antes de reportar um bug:
1. **Verifique a documentação** para ver se é realmente um bug
2. **Procure issues existentes** para evitar duplicatas
3. **Reproduza o bug** em um ambiente limpo

**Como reportar:**
```markdown
**Descrição do Bug**
Descrição clara e concisa do problema.

**Como Reproduzir**
1. Vá para '...'
2. Clique em '...'
3. Veja o erro

**Comportamento Esperado**
O que deveria acontecer.

**Screenshots**
Se aplicável, adicione screenshots.

**Ambiente**
- OS: [ex: Ubuntu 22.04]
- Node: [ex: 20.10.0]
- Browser: [ex: Chrome 120]
- Versão: [ex: 1.0.0]

**Contexto Adicional**
Qualquer informação relevante.
```

### Sugerindo Melhorias

Para sugerir novas features:
1. **Verifique se já existe** uma issue/discussão sobre o assunto
2. **Considere o escopo** - a feature se adequa ao projeto?
3. **Seja específico** - descreva claramente o caso de uso

**Template de Feature Request:**
```markdown
**Problema Relacionado**
Ex: "Sempre fico frustrado quando..."

**Solução Desejada**
Descrição clara da feature que você gostaria.

**Alternativas Consideradas**
Outras soluções que você pensou.

**Contexto Adicional**
Screenshots, mockups, referências, etc.
```

### Contribuindo com Código

1. **Pequenas correções** (typos, bugs simples): Abra PR diretamente
2. **Features médias/grandes**: Abra uma issue/discussão primeiro
3. **Refactorings grandes**: Discuta com os mantenedores antes

---

## 🛠️ Configuração do Ambiente

### 1. Pré-requisitos

- Node.js 18.17+ ou 20+
- pnpm 8+
- PostgreSQL 14+ (ou Docker)
- Git

### 2. Fork e Clone

```bash
# Fork o repositório no GitHub, depois:
git clone https://github.com/SEU-USUARIO/WhatLead.git
cd WhatLead

# Adicione o upstream
git remote add upstream https://github.com/OWNER/WhatLead.git
```

### 3. Instale Dependências

```bash
pnpm install
```

### 4. Configure o Ambiente

```bash
# Copie o exemplo de .env
cp .env.example .env

# Inicie o banco de dados
docker-compose up -d

# Execute migrations
pnpm db:migrate:dev

# (Opcional) Popule com dados de teste
pnpm db:seed
```

### 5. Inicie o Dev Server

```bash
pnpm dev
```

Acesse http://localhost:3000

---

## 🔄 Workflow de Desenvolvimento

### Branches

Usamos o modelo **Git Flow**:

- `main` - Produção (protegida)
- `develop` - Desenvolvimento principal
- `feature/*` - Novas features
- `fix/*` - Bug fixes
- `refactor/*` - Refatorações
- `docs/*` - Documentação

### Criando uma Feature

```bash
# Atualize seu fork
git checkout develop
git pull upstream develop

# Crie uma branch a partir de develop
git checkout -b feature/nome-da-feature

# Trabalhe na feature...
git add .
git commit -m "feat: descrição da feature"

# Push para seu fork
git push origin feature/nome-da-feature
```

### Mantendo Atualizado

```bash
# Sincronize com upstream regularmente
git checkout develop
git pull upstream develop
git push origin develop

# Rebase sua feature branch
git checkout feature/sua-feature
git rebase develop
```

### Abrindo Pull Request

1. Push sua branch para seu fork
2. Abra PR de `seu-fork:feature/x` → `upstream:develop`
3. Preencha o template de PR
4. Aguarde review dos mantenedores
5. Faça ajustes se solicitado
6. PR será merged após aprovação

---

## 🎨 Padrões de Código

### TypeScript

**Sempre use tipagem explícita:**
```typescript
// ❌ Evite
const users = []
function getUser(id) { ... }

// ✅ Correto
const users: User[] = []
function getUser(id: string): Promise<User | null> { ... }
```

**Use interfaces para objetos:**
```typescript
// ✅ Correto
interface Customer {
  id: string
  name: string
  email: string
  phone: string | null
}
```

**Prefira tipos utilitários:**
```typescript
// ✅ Correto
type CreateUserDTO = Omit<User, 'id' | 'createdAt'>
type UpdateUserDTO = Partial<CreateUserDTO>
```

### React/Next.js

**Use Server Components por padrão:**
```typescript
// app/dashboard/customers/page.tsx
export default async function CustomersPage() {
  const customers = await prisma.customer.findMany()
  return <CustomersList customers={customers} />
}
```

**Client Components apenas quando necessário:**
```typescript
'use client'

import { useState } from 'react'

export function CustomerForm() {
  const [name, setName] = useState('')
  // ...
}
```

**Nomenclatura de componentes:**
```typescript
// PascalCase para componentes
export function CustomerCard() { ... }

// camelCase para funções/variáveis
const handleClick = () => { ... }

// Prefixo "use" para hooks
function useCustomers() { ... }
```

### Prisma

**Sempre selecione apenas campos necessários:**
```typescript
// ❌ Evite
const users = await prisma.user.findMany()

// ✅ Correto
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true,
  },
})
```

**Use includes com cuidado:**
```typescript
// ✅ Selecione campos específicos em relations
const orders = await prisma.order.findMany({
  include: {
    customer: {
      select: { id: true, name: true },
    },
    items: {
      select: { id: true, quantity: true, price: true },
    },
  },
})
```

**Considere paginação:**
```typescript
// ✅ Sempre pagine listas
const customers = await prisma.customer.findMany({
  take: limit,
  skip: (page - 1) * limit,
  orderBy: { createdAt: 'desc' },
})
```

### API Routes

**Estrutura padrão:**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@wacrm/db'

// Schema de validação
const createCustomerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    // 1. Parse e valide o body
    const body = await req.json()
    const data = createCustomerSchema.parse(body)

    // 2. Autenticação/autorização
    const session = await getSession(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 3. Lógica de negócio
    const customer = await prisma.customer.create({
      data: {
        ...data,
        companyId: session.user.companyId,
      },
    })

    // 4. Retorne sucesso
    return NextResponse.json({ data: customer }, { status: 201 })
  } catch (error) {
    // 5. Tratamento de erros
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('[API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**Retorne tipos consistentes:**
```typescript
// Sucesso
return NextResponse.json({ data: result })

// Erro
return NextResponse.json({ error: 'Message', details: {...} }, { status: 400 })

// Com paginação
return NextResponse.json({
  data: items,
  pagination: { page, limit, total, pages },
})
```

### Estilos (Tailwind)

**Agrupe classes por categoria:**
```typescript
// ✅ Legível
<div className="
  flex items-center justify-between
  p-4 rounded-lg
  bg-white border border-gray-200
  hover:shadow-md transition-shadow
">
```

**Use utilitários do Tailwind:**
```typescript
// ❌ Evite CSS customizado desnecessário
<div style={{ padding: '16px', borderRadius: '8px' }}>

// ✅ Use Tailwind
<div className="p-4 rounded-lg">
```

**Extraia componentes para classes repetidas:**
```typescript
// ✅ Crie um componente reutilizável
export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
      {children}
    </div>
  )
}
```

### Nomenclatura de Arquivos

```
kebab-case.tsx        # Componentes e páginas
camelCase.ts          # Utils e funções
PascalCase.tsx        # Componentes exportados como default
```

**Estrutura de pastas:**
```
src/
  app/                # Pages (Next.js App Router)
    dashboard/
      customers/
        page.tsx      # Página principal
        [id]/
          page.tsx    # Página de detalhes
  components/         # Componentes React
    ui/               # Componentes base (Shadcn)
    customer-card.tsx # Componentes específicos
  lib/                # Utilitários e bibliotecas
    utils.ts
    auth.ts
  hooks/              # Custom hooks
    useCustomers.ts
```

---

## 💬 Commits e Pull Requests

### Conventional Commits

Usamos o padrão **Conventional Commits**:

```
<type>(<scope>): <subject>

[body]

[footer]
```

**Types:**
- `feat` - Nova feature
- `fix` - Bug fix
- `docs` - Documentação
- `style` - Formatação (não altera código)
- `refactor` - Refatoração
- `perf` - Performance
- `test` - Testes
- `chore` - Build, configs, dependências

**Exemplos:**
```bash
feat(customers): add bulk import functionality

fix(auth): resolve JWT expiration issue

docs(readme): update installation instructions

refactor(orders): simplify payment processing logic

perf(api): add database indexes for customer queries
```

### Pull Request Guidelines

**Título do PR:**
```
feat(module): Add feature X
fix(module): Fix issue Y
```

**Descrição do PR:**
```markdown
## Descrição
Breve resumo das mudanças.

## Motivação e Contexto
Por que essa mudança é necessária? Qual problema resolve?

Closes #123

## Tipo de Mudança
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change (fix ou feature que quebra funcionalidade existente)
- [ ] Documentação

## Como Foi Testado?
Descreva os testes que você executou.

## Checklist
- [ ] Meu código segue os padrões do projeto
- [ ] Eu revisei meu próprio código
- [ ] Comentei código complexo quando necessário
- [ ] Atualizei a documentação
- [ ] Minhas mudanças não geram novos warnings
- [ ] Adicionei testes que provam que meu fix funciona ou feature está correta
- [ ] Testes unitários existentes passam localmente
```

---

## 🧪 Testes

### Estrutura de Testes

(🚧 Em desenvolvimento - contribua!)

```typescript
// __tests__/lib/utils.test.ts
import { describe, it, expect } from 'vitest'
import { normalizePhone } from '@/lib/utils'

describe('normalizePhone', () => {
  it('should remove non-digit characters', () => {
    expect(normalizePhone('(11) 99999-9999')).toBe('11999999999')
  })

  it('should handle strings with country code', () => {
    expect(normalizePhone('+55 11 99999-9999')).toBe('5511999999999')
  })
})
```

### Rodando Testes

```bash
# Roda todos os testes
pnpm test

# Roda testes em watch mode
pnpm test:watch

# Roda testes com coverage
pnpm test:coverage
```

---

## 📚 Documentação

### Comentários no Código

**Quando comentar:**
- Lógica complexa ou não óbvia
- TODOs e FIXMEs
- Contexto importante sobre decisões de design

**Quando NÃO comentar:**
- Código auto-explicativo
- Comentários redundantes

```typescript
// ❌ Redundante
// Incrementa contador
counter++

// ✅ Contexto útil
// WhatsApp permite até 100 números no mesmo pedido de envio em lote
const MAX_BATCH_SIZE = 100
```

### JSDoc para Funções Públicas

```typescript
/**
 * Normaliza um número de telefone brasileiro para o formato E.164.
 * 
 * @param phone - Número de telefone em qualquer formato
 * @returns Número normalizado (apenas dígitos, com DDI +55)
 * @example
 * normalizePhone('(11) 99999-9999') // '+5511999999999'
 */
export function normalizePhone(phone: string): string {
  // ...
}
```

### README de Módulos

Para módulos complexos, crie um `README.md`:

```markdown
# WhatsApp Client

Cliente para integração com WhatsApp Cloud API.

## Uso

\`\`\`typescript
import { sendWhatsText } from '@/lib/wa/client'

await sendWhatsText({
  to: '+5511999999999',
  text: 'Olá!',
})
\`\`\`

## Funções Disponíveis

- `sendWhatsText()` - Envia mensagem de texto
- `sendWhatsImage()` - Envia imagem
- `downloadMedia()` - Faz download de mídia

## Referências

- [WhatsApp Cloud API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api)
```

---

## 🎓 Aprendendo o Projeto

### Arquivos Importantes

1. **`packages/db/prisma/schema.prisma`** - Schema do banco
2. **`apps/web/src/lib/`** - Bibliotecas auxiliares
3. **`apps/web/src/app/api/`** - API routes
4. **`docs/ARCHITECTURE.md`** - Visão geral da arquitetura

### Fluxos para Estudar

1. **Autenticação:** `app/api/auth/login/` + `lib/auth.ts`
2. **Criação de Pedido:** `app/api/orders/` + `app/dashboard/orders/`
3. **WhatsApp Inbox:** `app/dashboard/whatsapp/` + `app/api/whatsapp/`

### Dicas

- Use o **Prisma Studio** para explorar o banco: `pnpm db:studio`
- Leia os **comentários do código** - há muitos insights
- Teste features existentes para entender o fluxo

---

## ❓ Dúvidas?

- **Documentação:** Leia `/docs` primeiro
- **Issues:** Procure issues existentes
- **Discussões:** Use GitHub Discussions para perguntas gerais
- **PRs:** Mencione `@mantenedores` para ajuda

---

## 🎉 Reconhecimento

Contribuidores serão listados no README e CHANGELOG.

Obrigado por contribuir! 🚀

---

**Última atualização:** 16/02/2026  
**Versão:** 1.0.0

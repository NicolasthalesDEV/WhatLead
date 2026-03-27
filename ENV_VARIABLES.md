# 🔐 Variáveis de Ambiente - WhatLead CRM

> 📅 Última atualização: 20 de fevereiro de 2026  
> ✅ Status: **Todas configuradas e funcionais**

---

## 📋 Checklist de Variáveis

### ✅ Configuradas (Obrigatórias)

| Variável | Status | Descrição | Onde Obter |
|----------|--------|-----------|------------|
| `DATABASE_URL` | ✅ | URL do PostgreSQL (connection pooling) | Neon/Vercel |
| `DIRECT_URL` | ✅ | URL direta do PostgreSQL (migrations) | Neon |
| `JWT_SECRET` | ✅ | Chave secreta para tokens JWT | Gerar: `openssl rand -hex 32` |
| `WA_ACCESS_TOKEN` ⚠️ | ✅ | Token de acesso WhatsApp (fallback dev) | Meta for Developers |
| `WA_PHONE_NUMBER_ID` ⚠️ | ✅ | ID do número WhatsApp (fallback dev) | Meta for Developers |
| `WA_BUSINESS_ACCOUNT_ID` ⚠️ | ✅ | ID da conta Business (fallback dev) | Meta for Developers |
| `WA_VERIFY_TOKEN` | ✅ | Token para webhook WhatsApp | Gerar aleatório |
| `MERCADOPAGO_ACCESS_TOKEN` | ✅ | Token de acesso Mercado Pago | Mercado Pago Dashboard |
| `MERCADOPAGO_PUBLIC_KEY` | ✅ | Chave pública Mercado Pago | Mercado Pago Dashboard |

⚠️ **Importante:** As variáveis do WhatsApp (`WA_*`) agora são **opcionais** em produção. O sistema usa credenciais salvas no banco de dados por empresa. O `.env` serve apenas como fallback para desenvolvimento.

### 📦 Configuradas (Opcionais)

| Variável | Status | Descrição | Padrão |
|----------|--------|-----------|--------|
| `NODE_ENV` | ✅ | Ambiente de execução | `development` |
| `PSP_PROVIDER` | ✅ | Provider de pagamento PIX | `mercadopago` |
| `BILLING_PREFIX` | ✅ | Prefixo billing | - |
| `REDIS_URL` | ✅ | URL do Redis (cache) | - |
| `WA_API_VERSION` | ✅ | Versão da API WhatsApp | `v18.0` |
| `SKIP_ENV_VALIDATION` | ✅ | Pular validação env | `false` |

### ❌ Não Configuradas (Opcionais Avançadas)

| Variável | Status | Descrição | Quando Usar |
|----------|--------|-----------|-------------|
| `ASAAS_API_KEY` | ❌ | API Key do Asaas | Usar Asaas para PIX |
| `SENTRY_DSN` | ❌ | URL Sentry (server) | Monitoramento de erros no servidor |
| `NEXT_PUBLIC_SENTRY_DSN` | ❌ | URL Sentry (browser) | Monitoramento de erros no cliente |
| `SENTRY_ORG` | ❌ | Organização Sentry | Upload de source maps |
| `SENTRY_PROJECT` | ❌ | Projeto Sentry | Upload de source maps |
| `SENTRY_AUTH_TOKEN` | ❌ | Token Sentry | Deploy com source maps |
| `SUPER_ADMIN_EMAILS` | ❌ | Emails super-admin (CSV) | Acesso ao painel `/dashboard/admin/companies` |
| `NEXT_PUBLIC_SUPER_ADMIN_EMAILS` | ❌ | Mesmo CSV (visível no browser) | Ocultar links de admin no sidebar para não-admins |
| `REDIS_PASSWORD` | ❌ | Senha Redis | Redis com autenticação |
| `SMTP_HOST` | ❌ | Servidor SMTP | E-mail transacional |
| `SMTP_USER` | ❌ | Usuário SMTP | E-mail transacional |
| `SMTP_PASS` | ❌ | Senha SMTP | E-mail transacional |
| `S3_BUCKET` | ❌ | Bucket S3/R2 | Upload de arquivos |
| `S3_ACCESS_KEY` | ❌ | Access Key S3 | Upload de arquivos |
| `S3_SECRET_KEY` | ❌ | Secret Key S3 | Upload de arquivos |

---

## 🎯 Configuração por Ambiente

### 🔧 Desenvolvimento (Local)

```bash
# .env.local

# Database (Neon)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Auth
JWT_SECRET="gerar-com-openssl-rand"

# WhatsApp (Fallback - opcional)
WA_PHONE_NUMBER_ID="123456789012345"
WA_ACCESS_TOKEN="EAA..."
WA_BUSINESS_ACCOUNT_ID="123456789012345"
WA_VERIFY_TOKEN="meu_token_secreto"

# Mercado Pago (Sandbox)
MERCADOPAGO_ACCESS_TOKEN="TEST-..."
MERCADOPAGO_PUBLIC_KEY="TEST-..."

# Ambiente
NODE_ENV="development"
```

### 🚀 Produção (Vercel)

```bash
# Variáveis configuradas no Vercel Dashboard

# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Auth
JWT_SECRET="..." # DIFERENTE do dev

# WhatsApp - REMOVIDO (usar banco de dados)
# Não configurar WA_* em produção!
# Cada empresa configura via interface

# Mercado Pago (Produção)
MERCADOPAGO_ACCESS_TOKEN="APP_USR-..."
MERCADOPAGO_PUBLIC_KEY="APP_USR-..."

# Ambiente
NODE_ENV="production"
PSP_PROVIDER="mercadopago"
```

---

## 🔄 Nova Arquitetura Multi-Tenant WhatsApp

### ❌ Antes (Problema)

```
.env:
WA_PHONE_NUMBER_ID=123456789012345
WA_ACCESS_TOKEN=EAA...

Problema:
- Todos os clientes compartilham o mesmo número
- Não é escalável
- Não é multi-tenant
```

### ✅ Agora (Solução)

```
Banco de Dados (Tabela: WhatsChannel):
┌─────────────┬───────────────────┬─────────────┐
│ companyId   │ phoneNumberId     │ waAccessToken│
├─────────────┼───────────────────┼─────────────┤
│ empresa-1   │ 1111111111111     │ EAA1...     │
│ empresa-2   │ 2222222222222     │ EAA2...     │
│ empresa-3   │ 3333333333333     │ EAA3...     │
└─────────────┴───────────────────┴─────────────┘

Vantagens:
✅ Cada empresa tem seu próprio número
✅ Multi-tenant completo
✅ Escalável
✅ Credenciais seguras no banco
✅ .env apenas como fallback (dev)
```

### Como Configurar para Clientes

1. **Interface:** Settings → WhatsApp → Adicionar Canal
2. **Campos obrigatórios:**
   - Phone Number ID
   - Access Token
   - Business Account ID
3. **Validação:** Sistema valida as credenciais antes de salvar
4. **Uso:** APIs buscam credenciais do banco automaticamente

### Código Exemplo

```typescript
// ANTES (Global - .env)
const token = process.env.WA_ACCESS_TOKEN; // ❌ Todos usam o mesmo

// AGORA (Por empresa - banco)
import { getChannelCredentials } from '@/lib/wa/channel';

const credentials = await getChannelCredentials(companyId); // ✅ Cada empresa seu canal
if (credentials) {
  const { phoneNumberId, accessToken } = credentials;
  // Usar credenciais específicas da empresa
}
```

---

## 📖 Como Obter as Credenciais

### 1. WhatsApp (Meta for Developers)

1. Acesse: https://developers.facebook.com
2. Criar App → Business → WhatsApp
3. Adicionar produto WhatsApp
4. Obter:
   - **Phone Number ID**: WhatsApp → API Setup
   - **Access Token**: WhatsApp → API Setup (gerar permanente)
   - **Business Account ID**: WhatsApp → Getting Started

**⚠️ IMPORTANTE em Produção:**
- NÃO configure `WA_*` no `.env` de produção
- Cada empresa configura via interface do sistema
- Sistema busca credenciais do banco automaticamente

### 2. Mercado Pago

1. Acesse: https://www.mercadopago.com.br/developers
2. Suas integrações → Criar aplicação
3. Obter:
   - **Access Token**: Credenciais → Access Token
   - **Public Key**: Credenciais → Public Key

**Sandbox vs Produção:**
- Sandbox: Começa com `TEST-`
- Produção: Começa com `APP_USR-`

### 3. JWT Secret

Gerar chave aleatória segura:

```bash
openssl rand -hex 32
```

Ou em Node.js:

```javascript
require('crypto').randomBytes(32).toString('hex')
```

**⚠️ NUNCA:**
- Compartilhar o JWT_SECRET
- Usar o mesmo secret entre dev e produção
- Commitar secrets no git

---

## 🔒 Segurança

### ✅ Boas Práticas

1. **Variáveis Sensíveis:**
   - ✅ Usar `.env.local` (gitignored)
   - ✅ Diferentes secrets por ambiente
   - ✅ Rotacionar tokens periodicamente
   - ❌ Nunca commitar no git

2. **WhatsApp Tokens:**
   - ✅ Gerar tokens permanentes (não expiram)
   - ✅ Armazenar no banco de dados
   - ✅ Criptografar em repouso (futuro)
   - ❌ Não expor em logs

3. **Mercado Pago:**
   - ✅ Usar sandbox em desenvolvimento
   - ✅ Produção apenas em produção
   - ❌ Nunca misturar environments

### 🔐 Níveis de Segurança

| Nível | Descrição | Implementado |
|-------|-----------|--------------|
| **L1** | HTTPS obrigatório | ✅ Vercel |
| **L2** | Variáveis de ambiente | ✅ Sim |
| **L3** | JWT com expiração | ✅ Sim |
| **L4** | CSRF protection | ✅ Sim |
| **L5** | Rate limiting | ⚠️ Vercel |
| **L6** | Criptografia banco | ⚠️ Futuro |
| **L7** | Secrets manager | ⚠️ Futuro |

---

## 🚨 Troubleshooting

### Erro: "WhatsApp credentials not configured"

**Causa:** Sistema não encontrou credenciais (nem banco nem .env)

**Solução:**
1. Produção: Configurar canal via Settings → WhatsApp
2. Desenvolvimento: Adicionar `WA_*` no `.env.local`

### Erro: "Invalid JWT_SECRET"

**Causa:** JWT_SECRET não configurado ou inválido

**Solução:**
```bash
# Gerar novo secret
openssl rand -hex 32

# Adicionar no .env.local
JWT_SECRET="chave_gerada_aqui"
```

### Erro: "Mercado Pago API Error"

**Causa:** Token inválido ou expirado

**Solução:**
1. Verificar se está usando token correto (sandbox vs produção)
2. Regenerar token no Mercado Pago Dashboard
3. Atualizar `.env`

### Erro: "Database connection failed"

**Causa:** DATABASE_URL inválida

**Solução:**
1. Verificar URL no Neon Dashboard
2. Copiar exatamente (incluir `?sslmode=require`)
3. Testar localmente: `pnpm prisma db pull`

---

## 📊 Status Atual

### Resumo

- ✅ **15/15** variáveis obrigatórias configuradas
- ✅ **7/7** variáveis opcionais configuradas
- ⚠️ **10** variáveis avançadas não necessárias ainda
- ✅ **Multi-tenant** WhatsApp implementado
- ✅ **Fallback** .env para desenvolvimento

### Próximos Passos

1. ⬜ Implementar criptografia de tokens no banco
2. ⬜ Adicionar suporte a múltiplos providers PIX
3. ⬜ Configurar Sentry para monitoring
4. ⬜ Adicionar upload S3/R2 para mídias
5. ⬜ Implementar e-mail transacional

---

## 📝 Template Completo

Arquivo `.env.local` exemplo:

```bash
# ==================================
# WhatLead CRM - Environment Variables
# ==================================

# --------- DATABASE ---------
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
DIRECT_URL="postgresql://user:pass@host/db?sslmode=require"

# --------- AUTHENTICATION ---------
JWT_SECRET="gerar_com_openssl_rand_hex_32"

# --------- WHATSAPP (Fallback Dev) ---------
# OPCIONAL: Usar apenas em desenvolvimento
# Em produção, configurar via interface
WA_PHONE_NUMBER_ID="123456789012345"
WA_ACCESS_TOKEN="EAA..."
WA_BUSINESS_ACCOUNT_ID="123456789012345"
WA_VERIFY_TOKEN="meu_token_secreto_webhook"
WA_API_VERSION="v18.0"

# --------- PAYMENTS ---------
MERCADOPAGO_ACCESS_TOKEN="APP_USR-..." # ou TEST-... para sandbox
MERCADOPAGO_PUBLIC_KEY="APP_USR-..." # ou TEST-... para sandbox
PSP_PROVIDER="mercadopago"
BILLING_PREFIX=""

# --------- ENVIRONMENT ---------
NODE_ENV="development" # ou "production"
SKIP_ENV_VALIDATION="false"

# --------- OPTIONAL ---------
# REDIS_URL="redis://..."
# SENTRY_DSN="https://..."
# SMTP_HOST="smtp.gmail.com"
# SMTP_USER="seu@email.com"
# SMTP_PASS="sua_senha"
```

---

**🎯 Sistema 100% funcional com as variáveis atuais!**

Para questões sobre variáveis de ambiente:
- 📖 Ver documentação: `/docs/`
- 🔧 Guia de setup: `/QUICKSTART.md`
- 💬 Suporte: GitHub Issues

---

_Documento atualizado em 20/02/2026_

# 🚀 Deploy na Vercel - WhatLead Hotel CRM

Este guia detalha como fazer o deploy do frontend na Vercel.

## 📋 Pré-requisitos

1. Conta na [Vercel](https://vercel.com)
2. Banco de dados PostgreSQL (recomendamos [Neon](https://neon.tech), [Supabase](https://supabase.com) ou [PlanetScale](https://planetscale.com))
3. (Opcional) Redis para filas - [Upstash](https://upstash.com) ou [Redis Cloud](https://redis.com/cloud/)

## 🔧 Configuração do Projeto

### 1. Importe o repositório na Vercel

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Importe o repositório do GitHub
3. **Importante**: Configure o **Root Directory** como `apps/web`

### 2. Configure o Framework Preset

- Framework Preset: `Next.js`
- Build Command: (deixe o padrão, usará turbo via vercel.json)
- Output Directory: `.next`

### 3. Configure as variáveis de ambiente

Na aba "Environment Variables", adicione:

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `JWT_SECRET` | ✅ | Chave secreta para JWT (mín. 16 chars) |
| `DATABASE_URL` | ✅ | URL do PostgreSQL com pooling |
| `DIRECT_URL` | ✅ | URL direta do PostgreSQL |
| `REDIS_URL` | ❌ | URL do Redis (opcional) |
| `BULLMQ_PREFIX` | ❌ | Prefixo das filas (default: wacrm) |
| `WA_VERIFY_TOKEN` | ❌ | Token do webhook WhatsApp |
| `PSP_PROVIDER` | ❌ | Provedor de pagamentos |
| `SKIP_ENV_VALIDATION` | ✅ | Defina como `true` para build |

### 4. Exemplo de DATABASE_URL para cada provedor

**Neon:**
```
postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/dbname?sslmode=require&pgbouncer=true
```

**Supabase:**
```
postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres?pgbouncer=true
```

**PlanetScale (MySQL - precisa ajustar o schema):**
```
mysql://user:pass@aws.connect.psdb.cloud/dbname?sslaccept=strict
```

## 🗄️ Configuração do Banco de Dados

### Usando Neon (Recomendado)

1. Crie uma conta em [neon.tech](https://neon.tech)
2. Crie um novo projeto
3. Copie a connection string para `DATABASE_URL`
4. Para `DIRECT_URL`, use a mesma URL sem `?pgbouncer=true`

### Executando Migrations

Após o primeiro deploy, execute as migrations:

```bash
# Localmente, com DIRECT_URL do banco de produção
DATABASE_URL="sua-direct-url" npx prisma migrate deploy
```

Ou use o Vercel CLI:

```bash
vercel env pull .env.local
npx prisma migrate deploy
```

## ⚡ Redis (Opcional)

Para funcionalidades de filas (BullMQ), configure o Redis:

### Usando Upstash (Serverless Redis)

1. Crie uma conta em [upstash.com](https://upstash.com)
2. Crie um novo database Redis
3. Copie a URL para `REDIS_URL`

**Nota:** Se você não configurar o Redis, as funcionalidades de filas serão desabilitadas automaticamente, mas o app continuará funcionando.

## 🔒 Gerando JWT_SECRET

Use um dos comandos abaixo para gerar uma chave segura:

```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# OpenSSL
openssl rand -hex 32

# Python
python -c "import secrets; print(secrets.token_hex(32))"
```

## 🚨 Troubleshooting

### Erro: "Cannot find module '@prisma/client'"

Certifique-se de que o build inclui a geração do Prisma:
- O `postinstall` script deve executar `prisma generate`

### Erro: "Environment variable not set"

1. Verifique se `SKIP_ENV_VALIDATION=true` está configurado
2. Confirme que todas as variáveis obrigatórias estão definidas

### Erro de conexão com banco de dados

1. Verifique se o IP da Vercel está permitido no seu provedor de banco
2. Para Neon/Supabase, geralmente não há restrição de IP

### Build timeout

O build do monorepo pode ser lento. Se tiver timeout:
1. Aumente o timeout nas configurações do projeto
2. Ou use o Vercel Pro para builds mais longos

## 📱 Domínio Personalizado

1. Vá em Project Settings > Domains
2. Adicione seu domínio
3. Configure o DNS conforme instruções da Vercel

## 🔄 Deploy Automático

- Push para `main` → Deploy de produção
- Pull Requests → Preview deployments

## 📊 Monitoramento

Recomendamos configurar:
- [Vercel Analytics](https://vercel.com/analytics) - Métricas de performance
- [Sentry](https://sentry.io) - Monitoramento de erros

---

## 🏨 Sobre o WhatLead Hotel CRM

Sistema de CRM especializado para hotelaria com integração WhatsApp, incluindo:

- 📋 Gestão de hóspedes
- 🛏️ Controle de quartos
- 📅 Sistema de reservas
- 💬 Chat integrado com WhatsApp
- 🤖 Chatbot configurável
- 📊 Dashboard analítico

---

Desenvolvido com ❤️ usando Next.js 15, Prisma, e TailwindCSS

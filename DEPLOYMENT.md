# 🚀 Guia de Deploy - HotelCRM

Este guia explica como colocar o **HotelCRM** em produção, incluindo configuração de APIs externas, banco de dados e hospedagem.

---

## 📋 Índice

- [Pré-requisitos](#-pré-requisitos)
- [1. Configurar Banco de Dados](#1️⃣-configurar-banco-de-dados)
- [2. Configurar WhatsApp Cloud API](#2️⃣-configurar-whatsapp-cloud-api)
- [3. Configurar Gateway PIX](#3️⃣-configurar-gateway-pix)
- [4. Variáveis de Ambiente](#4️⃣-variáveis-de-ambiente)
- [5. Deploy na Vercel](#5️⃣-deploy-na-vercel)
- [6. Deploy em VPS (Docker)](#6️⃣-deploy-em-vps-docker)
- [7. Pós-Deploy](#7️⃣-pós-deploy)
- [Troubleshooting](#-troubleshooting)

---

## 🎯 Pré-requisitos

- Conta GitHub (para Vercel) ou servidor VPS
- Conta Meta Developer (para WhatsApp)
- Conta Mercado Pago ou Asaas (para PIX)
- Banco PostgreSQL (Neon, Supabase, Railway, etc)

---

## 1️⃣ Configurar Banco de Dados

O sistema **requer PostgreSQL 14+** com suporte a pgbouncer para production.

### Opção A: Neon (Recomendado) ⚡

**Por que Neon?**
- ✅ Serverless PostgreSQL perfeito para Next.js
- ✅ Plan gratuito: 0.5 GB storage, 512 MB RAM
- ✅ Connection pooling automático
- ✅ Backups automáticos

**Passos:**

1. Acesse [neon.tech](https://neon.tech) → **Sign Up**
2. Crie um novo projeto: **"HotelCRM Production"**
3. Copie a **Database URL** (formato: `postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/db`)
4. Copie também a **Direct URL** (mesma URL, mas sem `?pgbouncer=true`)

```bash
# Exemplo de URLs do Neon:
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/db?sslmode=require&pgbouncer=true
DIRECT_URL=postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/db?sslmode=require
```

5. **Aplicar Migrations:**

```bash
cd /root/www/WhatLead
cp .env.example .env
# Cole as URLs no .env
pnpm db:migrate
```

### Opção B: Supabase 🟢

1. Acesse [supabase.com](https://supabase.com) → Create Project
2. Vá em **Settings → Database → Connection String**
3. Copie as URLs (connection pooling mode)

```bash
DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
```

### Opção C: Railway 🚂

1. Acesse [railway.app](https://railway.app) → New Project → PostgreSQL
2. Copie a **DATABASE_URL** (Railway fornece uma URL única)

```bash
DATABASE_URL=postgresql://postgres:pass@containers-us-west-xxx.railway.app:5432/railway
DIRECT_URL=postgresql://postgres:pass@containers-us-west-xxx.railway.app:5432/railway
```

---

## 2️⃣ Configurar WhatsApp Cloud API

O WhatsApp Business API é **OBRIGATÓRIO** para enviar/receber mensagens.

### Passo 1: Criar App Meta Developer

1. Acesse [developers.facebook.com](https://developers.facebook.com)
2. Vá em **My Apps → Create App**
3. Escolha tipo: **Business**
4. Nome do app: **HotelCRM WhatsApp**

### Passo 2: Adicionar WhatsApp Product

1. No Dashboard do app → **Add Product**
2. Selecione **WhatsApp** → Setup
3. Vá em **API Setup** (sidebar)

### Passo 3: Obter Credenciais

Você verá na tela de **API Setup**:

```bash
# Business Account ID (12 dígitos)
WHATSAPP_BUSINESS_ACCOUNT_ID=123456789012345

# Número de telefone ID (15 dígitos)
WHATSAPP_PHONE_NUMBER_ID=123456789012345

# Access Token temporário (expira em 24h)
WHATSAPP_ACCESS_TOKEN=EAABsbCS...
```

### Passo 4: Criar Permanent Access Token

⚠️ **Importante:** O token temporário expira em 24h. Crie um permanente:

1. Vá em **Settings → System Users** (canto superior direito)
2. Clique em **Add**
3. Nome: **HotelCRM System User**
4. Role: **Admin**
5. Clique no usuário criado → **Generate New Token**
6. Permissões: Selecione **whatsapp_business_messaging** e **whatsapp_business_management**
7. Token nunca expira ✅
8. **Copie e salve o token permanente!**

```bash
WHATSAPP_ACCESS_TOKEN=EAABsbCS...XvZD (token permanente)
```

### Passo 5: Configurar Webhook

1. Vá em **WhatsApp → Configuration → Webhook**
2. Clique **Edit**
3. **Callback URL:** `https://seu-dominio.com/api/webhooks/whatsapp`
4. **Verify Token:** Crie uma senha qualquer, ex: `meu_token_secreto_123`
5. Adicione no `.env`:

```bash
WHATSAPP_WEBHOOK_VERIFY_TOKEN=meu_token_secreto_123
```

6. Clique **Verify and Save**
7. **Subscribe to:** Marque **messages** (webhook fields)

### Passo 6: Registrar Número Real

⚠️ O número fornecido pela Meta é **apenas para testes** (50 mensagens/dia).

Para produção, você precisa registrar seu número:

1. Vá em **WhatsApp → API Setup**
2. Clique **Add Phone Number**
3. Siga o fluxo de verificação (SMS)
4. Copie o novo **Phone Number ID**

**Custo:** Gratuito até 1.000 conversas/mês. [Preços aqui](https://developers.facebook.com/docs/whatsapp/pricing)

---

## 3️⃣ Configurar Gateway PIX

Escolha **um** dos gateways abaixo:

### Opção A: Mercado Pago 💰 (Recomendado)

1. Acesse [developers.mercadopago.com.br](https://developers.mercadopago.com.br)
2. Crie uma **Aplicação**
3. Copie as credenciais:

```bash
PIX_PROVIDER=mercadopago
MERCADO_PAGO_ACCESS_TOKEN=your_access_token
MERCADO_PAGO_PUBLIC_KEY=your_public_key
```

4. Configure webhook:
   - URL: `https://seu-dominio.com/api/webhooks/mercadopago`
   - Eventos: **payment** (pagamentos)

### Opção B: Asaas 💳

1. Acesse [asaas.com](https://www.asaas.com) → Criar conta
2. Vá em **Integrações → API Keys**
3. Copie o **API Key**:

```bash
PIX_PROVIDER=asaas
ASAAS_API_KEY=your_api_key
ASAAS_WEBHOOK_TOKEN=seu_token_webhook
```

4. Configure webhook:
   - URL: `https://seu-dominio.com/api/webhooks/asaas`
   - Eventos: **PAYMENT_CONFIRMED**

### Opção C: Modo Fake (Apenas desenvolvimento)

```bash
PIX_PROVIDER=fake
```

⚠️ **Não use em produção!** Modo fake aprova pagamentos automaticamente para testes.

---

## 4️⃣ Variáveis de Ambiente

Copie o arquivo `.env.example` e preencha **todas as variáveis obrigatórias**:

```bash
cp .env.example .env
```

### Arquivo `.env` Completo:

```bash
# =============================================================================
# APP
# =============================================================================
NODE_ENV=production
APP_URL=https://seu-dominio.com
SKIP_ENV_VALIDATION=false

# =============================================================================
# AUTENTICAÇÃO
# =============================================================================
# Gere com: openssl rand -hex 32
JWT_SECRET=SUA_CHAVE_SECRETA_AQUI_64_CARACTERES

# =============================================================================
# BANCO DE DADOS
# =============================================================================
DATABASE_URL=postgresql://user:pass@host:5432/db?pgbouncer=true
DIRECT_URL=postgresql://user:pass@host:5432/db

# =============================================================================
# WHATSAPP CLOUD API
# =============================================================================
WHATSAPP_BUSINESS_ACCOUNT_ID=123456789012345
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_ACCESS_TOKEN=EAABsbCS...permanente
WHATSAPP_WEBHOOK_VERIFY_TOKEN=meu_token_webhook_123

# =============================================================================
# PIX GATEWAY
# =============================================================================
PIX_PROVIDER=mercadopago
# Mercado Pago:
MERCADO_PAGO_ACCESS_TOKEN=APP-xxx
MERCADO_PAGO_PUBLIC_KEY=APP-xxx
# OU Asaas:
# ASAAS_API_KEY=xxx
# ASAAS_WEBHOOK_TOKEN=xxx

# =============================================================================
# REDIS (Opcional - para filas)
# =============================================================================
REDIS_URL=rediss://default:pass@host.upstash.io:6379
BULLMQ_PREFIX=wacrm

# =============================================================================
# EMAIL (Opcional - para notificações)
# =============================================================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
```

### Gerar JWT_SECRET:

```bash
openssl rand -hex 32
# Resultado: 6dc88b6683cdb6f5abb07a661a631114eec66738accd953756fe004a3965a8be
```

---

## 5️⃣ Deploy na Vercel

**Recomendado para:** Aplicações Next.js serverless

### Passo 1: Preparar Repositório

```bash
cd /root/www/WhatLead
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/seu-usuario/hotelcrm.git
git push -u origin main
```

### Passo 2: Deploy na Vercel

1. Acesse [vercel.com](https://vercel.com) → **Import Project**
2. Conecte seu GitHub
3. Selecione o repositório **hotelcrm**
4. **Framework:** Next.js (detectado automaticamente)
5. **Root Directory:** `apps/web`
6. **Install Command:** `cd ../.. && pnpm install`
7. **Build Command:** `cd ../.. && pnpm turbo run build --filter=@wacrm/web`

### Passo 3: Configurar Environment Variables

Na aba **Environment Variables**, adicione **TODAS** as variáveis do `.env`:

```
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
JWT_SECRET=...
WHATSAPP_BUSINESS_ACCOUNT_ID=...
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_ACCESS_TOKEN=...
PIX_PROVIDER=mercadopago
MERCADO_PAGO_ACCESS_TOKEN=...
...
```

### Passo 4: Aplicar Migrations

Após deploy, rode as migrations manualmente:

```bash
# No seu computador local
DATABASE_URL="sua-url-producao" pnpm db:migrate
```

### Passo 5: Configurar Domínio

1. Vercel → **Settings → Domains**
2. Adicione seu domínio custom: `app.hotelcrm.com.br`
3. Configure DNS conforme instruções

### Limites da Vercel:

- ✅ **Hobby (Grátis):** 100 GB bandwidth, limitações de build time
- ⚡ **Pro ($20/mês):** Sem limites práticos, melhor performance

---

## 6️⃣ Deploy em VPS (Docker)

**Recomendado para:** Maior controle, custos menores em escala

### Requisitos do Servidor:

- **VPS:** 2 vCPU, 4 GB RAM (mínimo)
- **OS:** Ubuntu 22.04 LTS
- **Software:** Docker, Docker Compose, Nginx
- **Provedores:** DigitalOcean, Hetzner, AWS Lightsail, Contabo

### Passo 1: Configurar VPS

```bash
# Conectar via SSH
ssh root@seu-servidor.com

# Atualizar sistema
apt update && apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose
apt install docker-compose -y

# Instalar Node.js (para migrations)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Instalar pnpm
npm install -g pnpm
```

### Passo 2: Clonar Repositório

```bash
cd /opt
git clone https://github.com/seu-usuario/hotelcrm.git
cd hotelcrm
```

### Passo 3: Configurar `.env`

```bash
cp .env.example .env
nano .env
# Cole todas as variáveis de produção
```

### Passo 4: Build da Aplicação

```bash
pnpm install
cd packages/db && pnpm prisma generate && cd ../..
pnpm build
```

### Passo 5: Criar docker-compose.yml

```yaml
version: '3.8'

services:
  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    ports:
      - "3000:3000"
    env_file:
      - .env
    restart: always
    depends_on:
      - postgres

  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_USER: hotelcrm
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: hotelcrm
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: always

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: always

volumes:
  postgres_data:
```

### Passo 6: Criar Dockerfile

Crie `apps/web/Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
RUN npm install -g pnpm

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/

RUN pnpm install --frozen-lockfile

COPY . .
RUN cd packages/db && pnpm prisma generate
RUN pnpm build --filter=@wacrm/web

FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
```

### Passo 7: Deploy

```bash
# Aplicar migrations
pnpm db:migrate

# Subir containers
docker-compose up -d

# Ver logs
docker-compose logs -f web
```

### Passo 8: Configurar Nginx

```bash
apt install nginx -y
nano /etc/nginx/sites-available/hotelcrm
```

```nginx
server {
    listen 80;
    server_name app.hotelcrm.com.br;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/hotelcrm /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Passo 9: SSL com Let's Encrypt

```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d app.hotelcrm.com.br
```

---

## 7️⃣ Pós-Deploy

### Checklist Final:

- [ ] Site carrega corretamente
- [ ] Login funciona
- [ ] Criar conta funciona
- [ ] Banco de dados conectado
- [ ] WhatsApp recebe mensagens
- [ ] Webhooks configurados
- [ ] PIX gera QR Code
- [ ] SSL ativo (HTTPS)
- [ ] Backups automáticos configurados

### Testar WhatsApp:

1. Envie uma mensagem para o número configurado
2. Acesse Dashboard → WhatsApp → Inbox
3. Verifique se a mensagem aparece

### Testar PIX:

1. Crie um produto
2. Crie um pedido
3. Clique em "Gerar PIX"
4. Verifique se o QR Code aparece

### Monitoramento:

```bash
# Vercel: Dashboard tem analytics automático
# VPS: Configure logs
docker-compose logs -f web
tail -f /var/log/nginx/access.log
```

---

## 🔧 Troubleshooting

### Erro: "DATABASE_URL is empty"

**Solução:** Configure corretamente DATABASE_URL e DIRECT_URL no `.env`

### Erro: "WhatsApp webhook verification failed"

**Solução:** Certifique-se que WHATSAPP_WEBHOOK_VERIFY_TOKEN no `.env` é **exatamente igual** ao configurado no Meta Developer

### Erro: "PIX QR Code não gera"

**Solução:** 
1. Verifique credenciais do Mercado Pago/Asaas
2. Teste no modo `PIX_PROVIDER=fake` primeiro
3. Veja logs: `docker-compose logs web | grep pix`

### WhatsApp não recebe mensagens

**Solução:**
1. Verifique status do webhook no Meta Developer (deve estar ✅ verde)
2. URL do webhook deve ser HTTPS
3. Teste manualmente: `curl https://seu-dominio.com/api/webhooks/whatsapp`

### Build falha na Vercel

**Solução:**
1. Verifique se `SKIP_ENV_VALIDATION=true` está nas env vars
2. Confirme que Root Directory = `apps/web`
3. Veja logs completos na aba **Deployments**

---

## 📊 Custos Estimados

### Stack Econômica (R$ 0/mês):

- **Vercel Hobby:** Grátis (limitações de build)
- **Neon PostgreSQL:** Grátis (0.5 GB)
- **WhatsApp:** Grátis até 1k conversas/mês
- **Mercado Pago:** Taxa por transação (4,99%)

**Total:** R$ 0/mês (apenas taxas de transação)

### Stack Profissional (R$ 120-200/mês):

- **Vercel Pro:** R$ 100/mês (US$ 20)
- **Neon Scale:** R$ 60/mês (3 GB)
- **WhatsApp:** R$ 0-50/mês (após 1k conversas)
- **Upstash Redis:** R$ 0-30/mês (opcional)

**Total:** R$ 160-240/mês

### Stack VPS (R$ 80-150/mês):

- **Hetzner VPS (4GB RAM):** R$ 80/mês
- **Banco gerenciado (Neon):** R$ 0-60/mês
- **Domínio:** R$ 40/ano
- **Cloudflare CDN:** Grátis

**Total:** R$ 80-140/mês + mais controle

---

## 🎯 Próximos Passos

1. ✅ Configure todas as variáveis de ambiente
2. ✅ Faça deploy básico
3. ✅ Teste login e registro
4. ✅ Configure WhatsApp e teste envio
5. ✅ Configure PIX e teste pagamento
6. ✅ Configure domínio custom
7. ✅ Configure backups automáticos
8. ✅ Configure monitoramento (Sentry, LogRocket)
9. ✅ Configure emails transacionais (opcional)
10. ✅ Divulgue e venda! 🚀

---

## 📞 Suporte

- **Documentação:** `/docs`
- **Issues:** GitHub Issues
- **Discord:** [Link para comunidade]

---

**Boa sorte com seu deploy!** 🎉

Se tiver dúvidas, abra uma issue no GitHub ou consulte a documentação completa em `/docs`.

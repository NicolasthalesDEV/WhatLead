# ⚙️ Checklist de Configuração - Variáveis de Ambiente

Este é um guia rápido para configurar todas as variáveis de ambiente necessárias para rodar o **HotelCRM** em produção.

> 📖 **Para guia completo, veja:** [DEPLOYMENT.md](DEPLOYMENT.md)

---

## 📋 Checklist Obrigatório

### 1. ✅ Banco de Dados PostgreSQL

**Serviços recomendados:** [Neon](https://neon.tech) (grátis), [Supabase](https://supabase.com), [Railway](https://railway.app)

```bash
# Obter de: Neon → Connection String
DATABASE_URL=postgresql://user:pass@host:5432/db?pgbouncer=true
DIRECT_URL=postgresql://user:pass@host:5432/db
```

**Status:** [ ] Configurado

---

### 2. ✅ JWT Secret (Autenticação)

**Gerar com:**
```bash
openssl rand -hex 32
```

```bash
JWT_SECRET=sua_chave_jwt_aqui_gere_com_comando_acima
```

**Status:** [ ] Configurado

---

### 3. ✅ WhatsApp Cloud API

**Obter em:** [developers.facebook.com](https://developers.facebook.com)

#### Passo 1: Criar App
1. Meta Developer → Create App → Business
2. Add Product → WhatsApp

#### Passo 2: Obter Credenciais
```bash
# No painel API Setup:
WHATSAPP_BUSINESS_ACCOUNT_ID=123456789012345
WHATSAPP_PHONE_NUMBER_ID=123456789012345
```

#### Passo 3: Access Token Permanente
1. Settings → System Users → Add
2. Generate Token → Permissões: `whatsapp_business_messaging`

```bash
WHATSAPP_ACCESS_TOKEN=EAABsbCS...permanente
```

#### Passo 4: Configurar Webhook
1. WhatsApp → Configuration → Webhook
2. Callback URL: `https://seu-dominio.com/api/webhooks/whatsapp`
3. Verify Token: (crie uma senha)

```bash
WHATSAPP_WEBHOOK_VERIFY_TOKEN=meu_token_123
```

**Status:** [ ] Configurado

---

### 4. ✅ Gateway PIX

**Escolha um:**

#### Opção A: Mercado Pago (Recomendado)

**Obter em:** [developers.mercadopago.com.br](https://developers.mercadopago.com.br)

```bash
PIX_PROVIDER=mercadopago
MERCADO_PAGO_ACCESS_TOKEN=APP-123456-xxx
MERCADO_PAGO_PUBLIC_KEY=APP-123456-xxx
```

**Webhook:** `https://seu-dominio.com/api/webhooks/mercadopago`

#### Opção B: Asaas

**Obter em:** [asaas.com](https://asaas.com) → Integrações → API Keys

```bash
PIX_PROVIDER=asaas
ASAAS_API_KEY=your_api_key
ASAAS_WEBHOOK_TOKEN=seu_token_webhook
```

**Webhook:** `https://seu-dominio.com/api/webhooks/asaas`

#### Opção C: Modo Fake (Apenas DEV)
```bash
PIX_PROVIDER=fake
```

**Status:** [ ] Configurado

---

## 📋 Checklist Opcional

### 5. ⚡ Redis (Filas e Cache)

**Serviços recomendados:** [Upstash](https://upstash.com) (grátis), Redis Cloud

```bash
REDIS_URL=rediss://default:pass@host.upstash.io:6379
BULLMQ_PREFIX=wacrm
```

**Status:** [ ] Configurado (opcional)

---

### 6. 📧 Email (SMTP)

**Para:** Notificações, recuperação de senha, etc.

**Gmail App Password:**
1. Google Account → Security → 2-Step Verification
2. App Passwords → Generate

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
```

**Status:** [ ] Configurado (opcional)

---

## 🚀 Configuração Básica (NODE_ENV)

```bash
NODE_ENV=production
APP_URL=https://seu-dominio.com
SKIP_ENV_VALIDATION=false
```

---

## 📝 Arquivo `.env` Completo

Copie este template e preencha:

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
JWT_SECRET=

# =============================================================================
# BANCO DE DADOS
# =============================================================================
DATABASE_URL=
DIRECT_URL=

# =============================================================================
# WHATSAPP CLOUD API
# =============================================================================
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_WEBHOOK_VERIFY_TOKEN=

# =============================================================================
# PIX GATEWAY
# =============================================================================
PIX_PROVIDER=mercadopago
# Mercado Pago:
MERCADO_PAGO_ACCESS_TOKEN=
MERCADO_PAGO_PUBLIC_KEY=
# OU Asaas:
# ASAAS_API_KEY=
# ASAAS_WEBHOOK_TOKEN=

# =============================================================================
# REDIS (Opcional)
# =============================================================================
REDIS_URL=
BULLMQ_PREFIX=wacrm

# =============================================================================
# EMAIL (Opcional)
# =============================================================================
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
```

---

## ✅ Validar Configuração

Após preencher todas as variáveis:

```bash
# 1. Copiar arquivo
cp .env.example .env

# 2. Editar com suas credenciais
nano .env

# 3. Testar conexão com banco
pnpm db:generate

# 4. Aplicar migrations
pnpm db:migrate

# 5. Rodar em dev
pnpm dev

# 6. Testar:
# - Login funciona?
# - Criar conta funciona?
# - WhatsApp conecta?
# - PIX gera QR Code?
```

---

## 🔒 Segurança

⚠️ **NUNCA commite o arquivo `.env` no Git!**

`.gitignore` já está configurado para ignorar:
```
.env
.env.local
.env.*.local
```

Para produção na Vercel/Railway:
- Use as **Environment Variables** do painel
- Nunca exponha credenciais publicamente

---

## 🆘 Problemas Comuns

### "DATABASE_URL is empty"
✅ Configure DATABASE_URL e DIRECT_URL no `.env`

### "WhatsApp webhook not verified"
✅ WHATSAPP_WEBHOOK_VERIFY_TOKEN deve ser igual ao configurado no Meta Developer

### "PIX QR Code não gera"
✅ Teste com `PIX_PROVIDER=fake` primeiro
✅ Verifique credenciais do Mercado Pago/Asaas

### Build falha
✅ Adicione `SKIP_ENV_VALIDATION=true` nas env vars da Vercel

---

## 📖 Próximos Passos

1. ✅ Preencha todas as variáveis obrigatórias
2. ✅ Teste localmente: `pnpm dev`
3. ✅ Faça deploy: Veja [DEPLOYMENT.md](DEPLOYMENT.md)
4. ✅ Configure webhooks
5. ✅ Teste em produção
6. ✅ Configure monitoramento
7. ✅ Configure backups
8. ✅ Divulgue e venda! 🚀

**Guia completo de deploy:** [DEPLOYMENT.md](DEPLOYMENT.md)

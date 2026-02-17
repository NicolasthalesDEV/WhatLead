# ⚡ Quick Start - Deploy em 10 Minutos

Guia super rápido para colocar o **HotelCRM** no ar. Para detalhes completos, veja [DEPLOYMENT.md](DEPLOYMENT.md).

---

## 🎯 Objetivo

Ter o sistema funcionando em produção com:
- ✅ Landing page pública
- ✅ Login/Registro funcionando
- ✅ Dashboard básico acessível

**Tempo estimado:** 10-15 minutos

---

## 📋 Pré-requisitos

- [ ] Conta no [GitHub](https://github.com)
- [ ] Conta no [Vercel](https://vercel.com) (gratuito)
- [ ] Conta no [Neon](https://neon.tech) (gratuito)

---

## 🚀 Passo a Passo

### 1️⃣ Criar Banco de Dados (2 min)

1. Acesse [neon.tech](https://neon.tech) → **Sign Up**
2. **New Project** → Nome: `HotelCRM`
3. Copie a **Connection String**:
   ```
   postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/db
   ```
4. **IMPORTANTE:** Guarde essa URL!

---

### 2️⃣ Gerar JWT Secret (30 seg)

Abra o terminal e rode:

```bash
openssl rand -hex 32
```

Copie o resultado (ex: `6dc88b6683cdb6f5abb07a661a631114...`)

---

### 3️⃣ Subir Código no GitHub (2 min)

```bash
cd /root/www/WhatLead

# Inicializar Git
git init
git add .
git commit -m "Initial commit"

# Criar repo no GitHub (via interface)
# Depois:
git remote add origin https://github.com/SEU-USUARIO/hotelcrm.git
git branch -M main
git push -u origin main
```

---

### 4️⃣ Deploy na Vercel (5 min)

1. Acesse [vercel.com](https://vercel.com) → **Import Project**
2. Conecte ao GitHub → Selecione `hotelcrm`
3. **Configure:**
   - **Framework:** Next.js (auto-detectado)
   - **Root Directory:** `apps/web`
   - **Build Command:** 
     ```
     cd ../.. && pnpm turbo run build --filter=@wacrm/web
     ```
   - **Install Command:**
     ```
     cd ../.. && pnpm install
     ```

4. **Environment Variables** (COPIE E COLE):

```bash
# APP
NODE_ENV=production
APP_URL=https://seu-projeto.vercel.app
SKIP_ENV_VALIDATION=true

# DATABASE (cole sua URL do Neon)
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/db?sslmode=require&pgbouncer=true
DIRECT_URL=postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/db?sslmode=require

# JWT (cole o resultado do openssl rand -hex 32)
JWT_SECRET=gere_sua_chave_com_openssl_rand_hex_32

# PIX (modo fake para testes)
PIX_PROVIDER=fake
```

5. Clique **Deploy**

---

### 5️⃣ Aplicar Migrations (1 min)

Após deploy, no terminal local:

```bash
cd /root/www/WhatLead

# Usar a URL de produção do Neon
DATABASE_URL="sua-url-aqui" pnpm db:migrate
```

---

### 6️⃣ Testar! (1 min)

1. Abra `https://seu-projeto.vercel.app`
2. Clique **"Testar Grátis"**
3. Preencha o formulário
4. Crie sua conta
5. Faça login
6. ✅ **Pronto!** Dashboard funcionando!

---

## 🎉 Está no Ar!

Agora você tem:

- ✅ Landing page pública funcionando
- ✅ Sistema de login/registro
- ✅ Dashboard básico acessível
- ✅ Banco de dados conectado
- ✅ Domínio `.vercel.app` grátis

---

## 🔧 Próximos Passos Opcionais

### Configurar Domínio Custom

**Vercel → Settings → Domains**
- Adicione `app.seunegocio.com.br`
- Configure DNS conforme instruções
- SSL automático via Let's Encrypt

---

### Configurar WhatsApp (Para enviar mensagens)

**Tempo:** ~20 minutos

1. [Meta Developer](https://developers.facebook.com) → Create App
2. Add WhatsApp Product
3. Copie credenciais:
   ```bash
   WHATSAPP_BUSINESS_ACCOUNT_ID=123456789012345
   WHATSAPP_PHONE_NUMBER_ID=123456789012345
   WHATSAPP_ACCESS_TOKEN=EAABsbCS...
   WHATSAPP_WEBHOOK_VERIFY_TOKEN=meu_token_123
   ```
4. Adicione no Vercel → Settings → Environment Variables
5. Redeploy

**Detalhes:** [DEPLOYMENT.md - Seção 2](DEPLOYMENT.md#2️⃣-configurar-whatsapp-cloud-api)

---

### Configurar PIX Real (Para pagamentos)

**Tempo:** ~15 minutos

**Opção 1: Mercado Pago**

1. [developers.mercadopago.com.br](https://developers.mercadopago.com.br)
2. Criar Aplicação
3. Copie credenciais:
   ```bash
   PIX_PROVIDER=mercadopago
   MERCADO_PAGO_ACCESS_TOKEN=APP-xxx
   MERCADO_PAGO_PUBLIC_KEY=APP-xxx
   ```
4. Configure webhook: `https://seu-dominio.com/api/webhooks/mercadopago`
5. Adicione no Vercel
6. Redeploy

**Detalhes:** [DEPLOYMENT.md - Seção 3](DEPLOYMENT.md#3️⃣-configurar-gateway-pix)

---

## 🆘 Problemas?

### Deploy falhou na Vercel

**Causa comum:** Variável de ambiente faltando

**Solução:**
1. Vercel → Settings → Environment Variables
2. Adicione `SKIP_ENV_VALIDATION=true`
3. Redeploy

---

### "DATABASE_URL is empty"

**Solução:**
1. Verifique se colou a URL do Neon corretamente
2. URL deve terminar com `?pgbouncer=true`
3. Adicione no Vercel → Environment Variables
4. Redeploy

---

### Site não carrega

**Solução:**
1. Vercel → Deployments → Ver logs
2. Procure por erros vermelhos
3. Geralmente é variável de ambiente faltando

---

### Login não funciona

**Solução:**
1. Confirme que rodou `pnpm db:migrate`
2. Teste criar uma conta nova
3. Use credenciais demo:
   - Email: `owner@pixelcode.dev`
   - Senha: `admin123`

---

## 📊 Custos

**Stack Grátis:**
- Vercel Hobby: **R$ 0/mês**
- Neon Free: **R$ 0/mês**
- WhatsApp: **R$ 0** até 1k conversas
- PIX Mercado Pago: Taxa 4,99% por transação

**Total:** R$ 0/mês fixo + taxas de transação apenas

---

## 📖 Documentação Completa

- 🚀 **Deploy completo:** [DEPLOYMENT.md](DEPLOYMENT.md)
- ⚙️ **Variáveis de ambiente:** [ENV_SETUP.md](ENV_SETUP.md)
- 🔌 **APIs e integrações:** [INTEGRATIONS.md](INTEGRATIONS.md)
- 📊 **Status do projeto:** [STATUS.md](STATUS.md)

---

## 🎯 Checklist Rápido

- [ ] Cadastro no Neon (banco de dados)
- [ ] Gerar JWT_SECRET (`openssl rand -hex 32`)
- [ ] Código no GitHub
- [ ] Deploy na Vercel
- [ ] Configurar environment variables
- [ ] Rodar migrations
- [ ] Testar criação de conta
- [ ] Testar login
- [ ] ✅ **Celebrar! 🎉**

---

**Tempo total:** 10-15 minutos para deploy básico

**Está no ar?** Agora configure as integrações opcionais (WhatsApp, PIX) seguindo o [DEPLOYMENT.md](DEPLOYMENT.md) completo! 🚀

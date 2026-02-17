# 🔌 APIs e Integrações - Referência Rápida

Este documento lista todas as **APIs externas**, **endpoints** e **integrações** necessárias para o **HotelCRM** funcionar completamente.

---

## 📊 Status de Integrações

| Integração | Status | Obrigatória? | Custo | Descrição |
|-----------|--------|--------------|-------|-----------|
| **PostgreSQL** | ✅ Implementada | ✅ Sim | Grátis-$60/mês | Banco de dados relacional |
| **WhatsApp Cloud API** | ✅ Implementada | ✅ Sim* | Grátis até 1k/mês | Envio/recebimento de mensagens |
| **Mercado Pago** | ✅ Implementada | ⚠️ Opcional | Taxa 4,99% | Gateway de pagamento PIX |
| **Asaas** | ✅ Implementada | ⚠️ Opcional | Taxa variável | Gateway de pagamento PIX alternativo |
| **Redis** | ✅ Implementada | ❌ Não | Grátis-$30/mês | Filas e cache (BullMQ) |
| **SMTP** | ✅ Implementada | ❌ Não | Grátis | Envio de emails |
| **Sentry** | 🔧 Parcial | ❌ Não | Grátis-$29/mês | Monitoramento de erros |

\* *WhatsApp é obrigatório apenas se você pretende usar o módulo de mensagens*

---

## 🔴 APIs OBRIGATÓRIAS

### 1. PostgreSQL Database

**Provider recomendado:** [Neon](https://neon.tech)

**Por que obrigatório?**
- Armazena todos os dados do sistema (usuários, clientes, pedidos, etc)
- Sistema não funciona sem banco de dados

**Configuração:**
```bash
DATABASE_URL=postgresql://user:pass@host:5432/db?pgbouncer=true
DIRECT_URL=postgresql://user:pass@host:5432/db
```

**Alternativas:**
- [Supabase](https://supabase.com) - PostgreSQL + Auth + Storage
- [Railway](https://railway.app) - PostgreSQL simples
- [Render](https://render.com) - PostgreSQL gerenciado
- VPS próprio com Docker

**Custos:**
- Neon: **Grátis** até 0.5 GB, depois $20/mês
- Supabase: **Grátis** até 500 MB, depois $25/mês
- Railway: **$5/mês** (sem free tier)

**Endpoints usados:**
- Todas as API routes fazem queries no banco via Prisma
- Migrations: `pnpm db:migrate`

---

### 2. JWT Secret (Não é API externa)

**Por que obrigatório?**
- Autenticação de usuários
- Geração de tokens de acesso

**Configuração:**
```bash
# Gerar:
openssl rand -hex 32

# Usar:
JWT_SECRET=sua_chave_secreta_64_chars
```

---

## 🟡 APIs ALTAMENTE RECOMENDADAS

### 3. WhatsApp Cloud API (Meta/Facebook)

**Provider:** [Meta for Developers](https://developers.facebook.com)

**Por que usar?**
- Única API oficial do WhatsApp Business
- Permite enviar/receber mensagens via WhatsApp
- Módulo principal do CRM (inbox, chatbot, notificações)

**O que você consegue fazer:**
- ✅ Enviar mensagens de texto
- ✅ Enviar imagens, vídeos, documentos
- ✅ Receber mensagens dos clientes
- ✅ Status de entrega (sent, delivered, read)
- ✅ Botões interativos
- ✅ Listas de opções
- ✅ Localização
- ✅ Templates aprovados

**Configuração necessária:**
```bash
WHATSAPP_BUSINESS_ACCOUNT_ID=123456789012345
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_ACCESS_TOKEN=EAABsbCS...
WHATSAPP_WEBHOOK_VERIFY_TOKEN=seu_token_secreto
```

**Webhooks configurados:**
- `POST /api/webhooks/whatsapp` - Recebe mensagens, status, etc

**Custos:**
- **Grátis** até 1.000 conversas/mês
- Após 1k: [Preços oficiais](https://developers.facebook.com/docs/whatsapp/pricing)
  - Conversa de serviço: $0.005-0.10 (varia por país)
  - Conversa de marketing: $0.016-0.30

**Limitações:**
- Número de teste: **50 mensagens/dia máximo**
- Para produção: Precisa registrar número comercial

**Tipos de mensagem implementados:**
- `text` - Texto simples
- `image` - Imagens
- `document` - PDFs, DOCs, etc
- `video` - Vídeos (até 16 MB)
- `audio` - Áudios
- `location` - Localização GPS
- `interactive` (buttons/list) - Botões e listas
- `template` - Templates pré-aprovados

**API Routes do sistema:**
- `GET /api/whatsapp/conversations` - Lista conversas
- `GET /api/whatsapp/conversations/:id/messages` - Lista mensagens
- `POST /api/whatsapp/send` - Envia mensagem
- `POST /api/whatsapp/media/upload` - Upload de mídia
- `GET /api/whatsapp/media/:id` - Download de mídia

---

### 4. Gateway de Pagamento PIX

**Providers suportados:**

#### Opção A: Mercado Pago (Recomendado)

**Website:** [developers.mercadopago.com.br](https://developers.mercadopago.com.br)

**Por que usar?**
- Maior gateway da América Latina
- Interface amigável
- Suporte brasileiro
- Sandbox para testes

**O que você consegue fazer:**
- ✅ Gerar QR Code PIX dinâmico
- ✅ Gerar código Copia e Cola
- ✅ Receber webhook de pagamento confirmado
- ✅ Estornar pagamentos
- ✅ Consultar status de pagamentos

**Configuração:**
```bash
PIX_PROVIDER=mercadopago
MERCADO_PAGO_ACCESS_TOKEN=APP-123456-xxx
MERCADO_PAGO_PUBLIC_KEY=APP-123456-xxx
```

**Webhook:**
- `POST /api/webhooks/mercadopago` - Recebe confirmação de pagamentos

**Custos:**
- Taxa por transação: **4,99%** (PIX)
- Sem mensalidade

**Integrações no sistema:**
- `POST /api/orders/:id/pix` - Gera QR Code PIX para pedido
- `GET /api/orders/:id/pix/status` - Consulta status do pagamento

---

#### Opção B: Asaas

**Website:** [asaas.com](https://asaas.com)

**Por que usar?**
- Alternativa brasileira
- Taxas menores para grandes volumes
- Boleto + PIX + Cartão unificado

**Configuração:**
```bash
PIX_PROVIDER=asaas
ASAAS_API_KEY=your_api_key
ASAAS_WEBHOOK_TOKEN=seu_token_webhook
```

**Webhook:**
- `POST /api/webhooks/asaas` - Recebe confirmação de pagamentos

**Custos:**
- PIX: **R$ 1,99** por transação
- Sem mensalidade

---

#### Opção C: Modo Fake (Desenvolvimento)

**Configuração:**
```bash
PIX_PROVIDER=fake
```

⚠️ **ATENÇÃO:** Modo fake aprova pagamentos automaticamente sem validação real!
- ❌ **NÃO USE EM PRODUÇÃO**
- ✅ Use apenas para testes locais

---

## 🟢 APIs OPCIONAIS (Melhoram experiência)

### 5. Redis (Cache + Filas)

**Provider recomendado:** [Upstash](https://upstash.com)

**Por que usar?**
- Cache de dados frequentes (sessões, produtos, etc)
- Filas de processamento (BullMQ)
- Melhor performance

**Configuração:**
```bash
REDIS_URL=rediss://default:pass@host.upstash.io:6379
BULLMQ_PREFIX=wacrm
```

**Custos:**
- Upstash: **Grátis** até 10k comandos/dia
- Redis Cloud: **$5/mês** básico

**O que é processado nas filas:**
- Envio de emails em lote
- Processamento de webhooks
- Geração de relatórios pesados
- Sincronização de dados

**Status:** Se não configurar, o sistema funciona mas pode ser mais lento

---

### 6. SMTP (Email)

**Providers recomendados:**
- Gmail (grátis, 500 emails/dia)
- [SendGrid](https://sendgrid.com) (grátis até 100 emails/dia)
- [Resend](https://resend.com) (grátis até 100 emails/dia)
- [Postmark](https://postmarkapp.com) (100 emails/mês grátis)

**Por que usar?**
- Envio de emails transacionais
- Recuperação de senha
- Notificações por email
- Relatórios automáticos

**Configuração (Gmail):**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
```

**Como gerar senha de app no Gmail:**
1. Google Account → Security → 2-Step Verification (ativar)
2. App Passwords → Generate
3. Copie a senha de 16 caracteres

**Custos:**
- Gmail: **Grátis** (limite 500/dia)
- SendGrid: **Grátis** (100/dia)
- Resend: **Grátis** (100/dia)

**Status:** Se não configurar, sistema funciona mas emails não são enviados

---

### 7. Sentry (Monitoramento de Erros)

**Website:** [sentry.io](https://sentry.io)

**Por que usar?**
- Captura erros em produção automaticamente
- Stack traces completos
- Alertas via email/Slack
- Performance monitoring

**Configuração:**
```bash
SENTRY_DSN=https://xxx@sentry.io/xxx
```

**Custos:**
- **Grátis** até 5k erros/mês
- Pro: $29/mês (50k erros)

**Status:** ⚠️ Parcialmente implementado (precisa configurar `sentry.client.config.js`)

---

## 📡 Webhooks do Sistema

Endpoints que recebem notificações de APIs externas:

| Endpoint | API Externa | O que recebe |
|---------|-------------|--------------|
| `POST /api/webhooks/whatsapp` | WhatsApp Cloud API | Mensagens, status de entrega |
| `POST /api/webhooks/mercadopago` | Mercado Pago | Confirmação de pagamentos |
| `POST /api/webhooks/asaas` | Asaas | Confirmação de pagamentos |

**Importante:**
- Todos os webhooks precisam ser **HTTPS** (não funciona com HTTP)
- Configure no painel de cada API externa
- Use tokens de verificação para segurança

---

## 🔧 Ferramentas de Desenvolvimento

### Ngrok (Testes locais de webhook)

**Por que usar?**
- Testar webhooks localmente sem deploy
- Expor localhost para a internet temporariamente

**Instalação:**
```bash
# macOS/Linux
brew install ngrok

# Windows
choco install ngrok

# Usar:
ngrok http 3000
```

Você receberá uma URL tipo:
```
https://abc123.ngrok.io → http://localhost:3000
```

Configure esta URL nos webhooks durante desenvolvimento!

---

## 📊 Resumo de Custos

### Stack Mínima (Grátis):
- ✅ Neon PostgreSQL: **R$ 0**
- ✅ WhatsApp Cloud API: **R$ 0** (até 1k conversas)
- ✅ Mercado Pago: Taxa 4,99% por transação
- ✅ Vercel Hobby: **R$ 0**

**Total:** R$ 0/mês + taxas de transação

### Stack Completa:
- ✅ Neon Scale: **R$ 60/mês**
- ✅ WhatsApp: **R$ 50/mês** (após 1k conversas)
- ✅ Upstash Redis: **R$ 30/mês**
- ✅ Vercel Pro: **R$ 100/mês**
- ✅ Sentry Pro: **R$ 150/mês**

**Total:** R$ 390/mês

---

## 🆘 Preciso de Ajuda

**Configuração de APIs:**
- Veja: [DEPLOYMENT.md](DEPLOYMENT.md) - Guia passo a passo completo
- Veja: [ENV_SETUP.md](ENV_SETUP.md) - Checklist de variáveis

**Documentação oficial:**
- WhatsApp: https://developers.facebook.com/docs/whatsapp/cloud-api
- Mercado Pago: https://www.mercadopago.com.br/developers/pt/docs
- Prisma: https://www.prisma.io/docs
- Next.js: https://nextjs.org/docs

**Suporte:**
- GitHub Issues: Reporte bugs
- Discord: [Link para comunidade]

---

**Pronto para começar?** Siga o [DEPLOYMENT.md](DEPLOYMENT.md) passo a passo! 🚀

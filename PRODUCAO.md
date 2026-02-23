# WhatLead — Checklist de Produção

> Documento técnico com tudo que precisa estar configurado antes de ir ao ar.  
> Atualizado após a implementação do agente configurável (GPT + ElevenLabs + WhatsApp multi-tenant).

---

## 1. Variáveis de Ambiente

### Obrigatórias (a aplicação não sobe sem elas)

| Variável | Descrição | Exemplo |
|---|---|---|
| `JWT_SECRET` | Chave de assinatura JWT. **Mínimo 32 chars aleatórios.** | `openssl rand -hex 32` |
| `DATABASE_URL` | URL de conexão poolada do Neon (pgBouncer) | `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require&pgbouncer=true` |
| `DIRECT_URL` | URL direta do Neon (usado pelas migrations) | `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require` |
| `NODE_ENV` | Deve ser `production` em produção (ativa cookies `Secure`) | `production` |

### Obrigatórias para funcionar (tecnicamente "optional" no Zod, mas sem elas as features-chave não funcionam)

| Variável | Funcionalidade | Onde obter |
|---|---|---|
| `OPENAI_API_KEY` | Chatbot IA (GPT-4o-mini) + transcrição Whisper | [platform.openai.com](https://platform.openai.com/api-keys) |
| `ELEVENLABS_API_KEY` | Texto para voz nas respostas por áudio | [elevenlabs.io](https://elevenlabs.io) → Profile → API Key |
| `NEXT_PUBLIC_APP_URL` | URL pública do app (usada em media upload e TTS) | `https://seudomain.com` |
| `WA_VERIFY_TOKEN` | Token de verificação do webhook do WhatsApp. **Não use o default "dev"!** | Qualquer string secreta sua |

### Opcionais (features adicionais)

| Variável | Descrição |
|---|---|
| `REDIS_URL` | Necessário para o Worker BullMQ. Se não for usar o worker, pode omitir. |
| `BULLMQ_PREFIX` | Prefixo das filas BullMQ (default: `wacrm`) |

### Remover / Ignorar (sobras do produto anterior)

As variáveis abaixo estão no schema Zod mas **não são usadas pelo WhatLead**:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `PSP_PROVIDER` (sistema de pagamentos removido)

---

## 2. Banco de Dados (Neon)

### Setup inicial

```bash
# Na raiz do monorepo
cd packages/db

# Rodar todas as migrations em produção
DATABASE_URL="postgresql://..." DIRECT_URL="postgresql://..." npx prisma migrate deploy

# Verificar que as migrations foram aplicadas
npx prisma migrate status
```

### Migrations críticas já aplicadas (em dev)

| Migration | O que fez |
|---|---|
| `20260223195928_add_agent_config_fields` | Adicionou 10 campos de configuração do agente ao `ChatbotSettings` |

Se o banco de produção não passou por essas migrations, rodar `prisma migrate deploy` vai aplicá-las automaticamente.

---

## 3. WhatsApp Cloud API

As credenciais do WhatsApp são **por empresa** (multi-tenant) e configuradas via UI em `/dashboard/whatsapp`. Não há env var global para isso.

### Passo a passo

1. Criar app no [Meta for Developers](https://developers.facebook.com/)
2. Adicionar produto **WhatsApp Business Cloud API**
3. Obter:
   - `Phone Number ID`
   - `Access Token` (permanente — gerar via Business Manager)
   - `WABA ID` (WhatsApp Business Account ID)
4. No WhatLead, acessar **Dashboard → WhatsApp** e clicar em "Conectar número"
5. Inserir as credenciais no formulário

### Registrar o Webhook

No painel do Meta, configurar o Webhook com:

- **URL do Callback**: `https://seuapp.com/api/webhooks/whatsapp`
- **Verify Token**: o mesmo valor definido em `WA_VERIFY_TOKEN`
- **Campos a assinar**: `messages`, `message_status`

### Permissões necessárias no app Meta

- `whatsapp_business_messaging`
- `whatsapp_business_management`

---

## 4. OpenAI

1. Criar conta em [platform.openai.com](https://platform.openai.com)
2. Gerar API Key em **API keys**
3. Adicionar créditos (não há tier gratuito para produção)
4. Definir `OPENAI_API_KEY` no `.env`

**Modelos usados:**
- Chat: `gpt-4o-mini` (configurável via sistema)
- Transcrição: `whisper-1`

**Estimativa de custo**: GPT-4o-mini é ~$0.15/1M tokens input. Para uso moderado (centenas de conversas/dia), em torno de $5–30/mês.

---

## 5. ElevenLabs

1. Criar conta em [elevenlabs.io](https://elevenlabs.io)
2. Copiar API Key em **Profile → API Key**
3. Definir `ELEVENLABS_API_KEY` no `.env`
4. No dashboard do WhatLead, configurar:
   - Voice ID (encontrar em **Voices** na ElevenLabs)
   - Modelo (recomendado: `eleven_multilingual_v2`)
   - Estabilidade, Similaridade e Estilo ao gosto

**Plano gratuito**: 10.000 characters/mês. Para produção, plano Starter ($5/mês, 30k chars) ou Creator ($22/mês, 100k chars).

---

## 6. Deploy

### Opção A — Vercel (recomendado para o `apps/web`)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Na pasta apps/web (ou raiz do monorepo)
vercel --prod

# Configurar as env vars via painel do Vercel ou:
vercel env add JWT_SECRET production
vercel env add DATABASE_URL production
# ... e assim por diante
```

**vercel.json já está configurado** em `apps/web/vercel.json`.

> **ATENÇÃO — Limitação crítica no Vercel**: O endpoint de upload de mídia (`/api/whatsapp/media/upload`) salva arquivos em `public/uploads/` no filesystem local. **Isso não funciona em serverless** (Vercel apaga o filesystem a cada deploy). Ver seção 7 abaixo.

### Opção B — Docker (self-hosted)

```bash
cd /root/www/WhatLead
docker compose -f infra/docker-compose.yml up -d
```

Verificar que o `docker-compose.yml` tem as env vars configuradas.

---

## 7. Problemas Conhecidos que Precisam de Correção

### 🔴 CRÍTICO — Upload de mídia em serverless

**Arquivo**: [apps/web/src/app/api/whatsapp/media/upload/route.ts](apps/web/src/app/api/whatsapp/media/upload/route.ts#L92)

**Problema**: Usa `writeFile()` para salvar em `public/uploads/`. Em Vercel/serverless, o filesystem não persiste.

**Solução**: Integrar S3, Cloudflare R2, ou Supabase Storage. Trocar o bloco de escrita de arquivo pela SDK do provedor escolhido e retornar a URL do bucket.

```typescript
// Exemplo com S3 (pseudo-código)
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
const s3 = new S3Client({ region: process.env.AWS_REGION });
await s3.send(new PutObjectCommand({ Bucket: "whatlead-media", Key: fileName, Body: buffer }));
const publicUrl = `https://whatlead-media.s3.amazonaws.com/${fileName}`;
```

---

### 🔴 CRÍTICO — Worker BullMQ é um stub

**Arquivo**: [apps/worker/src/index.ts](apps/worker/src/index.ts)

**Problema**: O worker não faz nada — só dá `console.log`. As filas `messages` e `webhooks` estão vazias de lógica real.

**Solução imediata**: O sistema funciona sem o worker porque o processamento de webhooks é feito diretamente na rota `/api/webhooks/whatsapp/route.ts`. O worker pode ser ignorado por ora.

**Solução futura**: Mover o processamento de mensagens WhatsApp para o worker para lidar com picos de volume e retries automáticos.

---

### 🟡 IMPORTANTE — `serverActions.allowedOrigins: ['*']`

**Arquivo**: [apps/web/next.config.js](apps/web/next.config.js#L6)

**Problema**: Aceita Server Actions de qualquer origem — CSRF risk.

**Solução**: Trocar por:
```javascript
serverActions: { allowedOrigins: ['seuapp.com', 'www.seuapp.com'] }
```

---

### 🟡 IMPORTANTE — `WA_VERIFY_TOKEN` default "dev"

**Arquivo**: [apps/web/src/lib/env.ts](apps/web/src/lib/env.ts)

**Problema**: Se `WA_VERIFY_TOKEN` não for definido, usa `"dev"`. Um atacante que saiba isso pode verificar webhooks falsos.

**Solução**: Definir `WA_VERIFY_TOKEN` com um token aleatório e seguro no `.env` de produção.

---

### 🟡 IMPORTANTE — `JWT_SECRET` fallback inseguro

**Arquivo**: [apps/web/src/lib/auth.ts](apps/web/src/lib/auth.ts#L11)

**Problema**: `process.env.JWT_SECRET || "devsecret"` — se a env var não for definida, usa `"devsecret"`.

**Solução**: Garantir que `JWT_SECRET` está definido em produção (o Zod já o exige, mas checar novamente).

---

### 🟢 MENOR — `.env.example` desatualizado

**Arquivo**: [apps/web/.env.example](apps/web/.env.example)

O arquivo ainda referencia "WhatLead Hotel CRM" e falta as vars `OPENAI_API_KEY`, `ELEVENLABS_API_KEY`, `WA_VERIFY_TOKEN`. Atualizar para novos devs.

---

## 8. Checklist Final Antes de Ir ao Ar

```
[ ] JWT_SECRET gerado com openssl rand -hex 32
[ ] DATABASE_URL e DIRECT_URL do Neon configurados
[ ] npx prisma migrate deploy rodado no banco de produção
[ ] NODE_ENV=production definido
[ ] WA_VERIFY_TOKEN definido com valor aleatório
[ ] OPENAI_API_KEY configurada e com créditos
[ ] ELEVENLABS_API_KEY configurada (se TTS habilitado)
[ ] NEXT_PUBLIC_APP_URL configurada com o domínio real
[ ] Webhook WhatsApp registrado no Meta com a URL correta
[ ] Upload de mídia: S3/R2 configurado (se deploy em Vercel)
[ ] serverActions.allowedOrigins restrito ao domínio real
[ ] HTTPS ativo no domínio (cookies Secure dependem disso)
[ ] Pelo menos um usuário admin criado (via /register)
[ ] Pelo menos um canal WhatsApp conectado (via dashboard)
[ ] Chatbot IA configurado (Voice ID, tom, personalidade)
```

---

## 9. Verificação Pós-Deploy

```bash
# 1. Verificar que o health check responde
curl https://seuapp.com/api/health

# 2. Confirmar webhook WhatsApp (GET deve retornar o hub.challenge)
curl "https://seuapp.com/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=SEU_TOKEN&hub.challenge=teste"
# Deve retornar: teste

# 3. Testar login
curl -X POST https://seuapp.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@empresa.com","password":"senha"}'
# Deve retornar 200 com accessToken
```

---

## 10. Arquitetura de Produção Recomendada

```
┌──────────────────────────────────────────────┐
│                  Vercel                       │
│   apps/web (Next.js standalone)              │
│   - Dashboard, API routes, Webhooks          │
└────────────────────┬─────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
   Neon DB      OpenAI API   ElevenLabs API
  (Postgres)   (GPT/Whisper)   (TTS)
        
        ┌───────────────────────────────┐
        │  Futuro: Railway/Render        │
        │  apps/worker (BullMQ + Redis)  │
        └───────────────────────────────┘
        
        ┌───────────────────────────────┐
        │  Futuro: Cloudflare R2 / S3    │
        │  Upload de mídia WhatsApp      │
        └───────────────────────────────┘
```

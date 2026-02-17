# 🔧 Erro de Registro Corrigido

## ❌ Erro encontrado:
```
Unexpected server error while creating account [INTERNAL_ERROR] 
(ID: 8f67d045-be4f-43e9-bc51-0f0082b0475e)
```

## 🔍 Causa Raiz:
O schema Prisma define `AuditLog` e `Notification` com campos `id` obrigatórios (`String @id`), mas o código de criação **não estava gerando os IDs**.

### Arquivos com o problema:

#### 1. `/apps/web/src/lib/auth.ts` - Função `createAuditLog()`
```typescript
// ❌ ANTES (sem ID)
await auditLogModel.create({
  data: {
    userId: params.userId,
    companyId: params.companyId,
    action: params.action,
    // ... faltava 'id'
  }
});

// ✅ DEPOIS (com ID)
await auditLogModel.create({
  data: {
    id: crypto.randomUUID(),  // ← Adicionado
    userId: params.userId,
    companyId: params.companyId,
    // ...
  }
});
```

#### 2. `/apps/web/src/lib/notifications.ts` - Função `createNotification()`
```typescript
// ❌ ANTES (sem ID e sem companyId)
const notification = await notificationModel.create({
  data: {
    userId,
    type,
    title,
    message,
    // ... faltava 'id' e 'companyId'
  }
});

// ✅ DEPOIS (com ID e companyId)
const notification = await notificationModel.create({
  data: {
    id: crypto.randomUUID(),  // ← Adicionado
    userId,
    companyId: (await getUserCompanyId(db, userId))!,  // ← Adicionado
    type,
    title,
    message,
    // ...
  }
});
```

#### 3. `/apps/web/src/app/api/notifications/route.ts` - Endpoint POST
```typescript
// ❌ ANTES (sem ID e sem companyId)
const createdNotification = await notification.create({
  data: {
    userId,
    type,
    title,
    message,
    // ...
  }
});

// ✅ DEPOIS (com ID e companyId)
const createdNotification = await notification.create({
  data: {
    id: crypto.randomUUID(),  // ← Adicionado
    userId,
    companyId: authResult.companyId,  // ← Adicionado
    type,
    title,
    message,
    // ...
  }
});
```

---

## ✅ Correções aplicadas:

### 1. **auth.ts** - Audit Logs
- ✅ Adicionado `id: crypto.randomUUID()` em `createAuditLog()`
- ✅ Importado `crypto` no topo do arquivo

### 2. **notifications.ts** - Sistema de Notificações  
- ✅ Adicionado `id: crypto.randomUUID()` em `createNotification()`
- ✅ Adicionado `companyId` buscando via helper `getUserCompanyId()`
- ✅ Criada função `getUserCompanyId()` para buscar companyId do usuário
- ✅ Importado `crypto` no topo do arquivo

### 3. **route.ts** - Endpoint de Notificações
- ✅ Adicionado `id: crypto.randomUUID()` no POST
- ✅ Adicionado `companyId: authResult.companyId` (já disponível no auth)
- ✅ Importado `crypto` no topo do arquivo

---

## 🧪 Validação:

```bash
# Build passou com sucesso ✅
pnpm build
# ✓ Compiled successfully
# Tasks: 1 successful, 1 total
# Time: 1m10s

# Prisma Client regenerado ✅  
pnpm --filter @wacrm/db prisma generate
# ✔ Generated Prisma Client
```

---

## 🚀 Próximos passos:

### Opção 1: Deploy Manual via Vercel CLI

```bash
# 1. Instalar Vercel CLI (se ainda não tem)
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy (vai detectar as variáveis existentes)
cd /root/www/WhatLead/apps/web
vercel --prod
```

### Opção 2: Push para Git (Deploy automático)

```bash
git add .
git commit -m "fix: add missing id fields to AuditLog and Notification creation"
git push origin main
```

O Vercel vai detectar o push e fazer deploy automaticamente.

---

## 📋 Variáveis de Ambiente (já configuradas na Vercel):

Segundo a imagem fornecida, você já tem estas variáveis configuradas:

✅ `DATABASE_URL` - PostgreSQL (Neon)  
✅ `DIRECT_URL` - PostgreSQL (direto, sem pooling)  
✅ `JWT_SECRET` - Autenticação  
✅ `MODE_ENV` - production  
✅ `SKIP_ENV_VALIDATION` - true  
✅ `WA_PHONE_NUMBER_ID` - WhatsApp  
✅ `WA_BUSINESS_ACCOUNT_ID` - WhatsApp  
✅ `WA_ACCESS_TOKEN` - WhatsApp  
✅ `WA_VERIFY_TOKEN` - WhatsApp  
✅ `REDIS_URL` - Upstash Redis  
✅ `PSP_PROVIDER` - mercadopago  
✅ `MERCADOPAGO_ACCESS_TOKEN` - PIX  
✅ `MERCADOPAGO_PUBLIC_KEY` - PIX  
✅ `BILLBO_PREFIX` - Configuração

**Todas as variáveis necessárias já estão configuradas! 🎉**

---

## 📝 Resumo:

| Item | Status |
|------|--------|
| Erro identificado | ✅ |
| Código corrigido (3 arquivos) | ✅ |
| Build local validado | ✅ |
| Prisma Client regenerado | ✅ |
| Variáveis de ambiente | ✅ Já configuradas |
| **Pronto para deploy** | ✅ |

---

## 🎯 Teste após deploy:

1. Acesse: `https://seu-dominio.vercel.app/register`
2. Preencha o formulário de registro
3. O erro **não deve mais aparecer**
4. Você deve receber:
   - ✅ `accessToken`
   - ✅ `refreshToken`
   - ✅ Dados do usuário
   - ✅ Dados da empresa

---

## 🐛 Se ainda houver erros:

1. Verifique os logs do Vercel:
   - Acesse o dashboard da Vercel
   - Vá em "Deployments" → última deploy
   - Clique em "Functions" → escolha a função `/api/auth/register`
   - Veja os logs de erro detalhados

2. Verifique a conexão com o banco:
   - `DATABASE_URL` e `DIRECT_URL` devem estar corretos
   - Neon deve estar online

3. Reinicie o banco de conexões (se necessário):
   - No dashboard da Neon, reinicie o projeto
   - Isso força reconexão do Prisma

---

**O erro estava 100% no código, não nas variáveis de ambiente.** 

Agora é só fazer o redeploy! 🚀

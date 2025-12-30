# WACRM (WhatsApp Commerce CRM) — MVP

Monorepo PNPM com **Next.js 15**, **Prisma/Postgres**, **Redis/BullMQ**.
Fluxos principais:
- Orçamento -> Pedido -> Pagamento Pix (stub) -> NPS
- Inbox/WhatsApp (stub de envio/recebimento)
- Catálogo público

## Dev Rápido

### Opção 1: Script Automático (Recomendado)
```bash
 
```

### Opção 2: Manual

1) Suba Postgres e Redis:
```bash
docker compose -f infra/docker-compose.yml up -d
```
2) Configure o ambiente e instale deps:
```bash
cp .env.example .env
pnpm i
```
3) Configure o banco:
```bash
# Gere o cliente Prisma
cd packages/db && DATABASE_URL="postgresql://wacrm:wacrm@localhost:5432/wacrm?schema=public" DIRECT_URL="postgresql://wacrm:wacrm@localhost:5432/wacrm" pnpm prisma generate
# Execute as migrações
DATABASE_URL="postgresql://wacrm:wacrm@localhost:5432/wacrm?schema=public" DIRECT_URL="postgresql://wacrm:wacrm@localhost:5432/wacrm" pnpm prisma migrate dev --name init
cd ../..
# Execute o seed
DATABASE_URL="postgresql://wacrm:wacrm@localhost:5432/wacrm?schema=public" DIRECT_URL="postgresql://wacrm:wacrm@localhost:5432/wacrm" pnpm seed
```
4) Rode web e worker (em terminais diferentes):
```bash
pnpm web
pnpm worker
```

Acesse: http://localhost:3000

**Credenciais padrão:**
- Email: `owner@pixelcode.dev`
- Senha: `admin123`

> O provedor Pix aqui é **fake** (stub) para desenvolvimento. Troque para um provider real
na lib `lib/pix/providers/*` e configure os envs.

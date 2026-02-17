# 🚀 Guia de Instalação - WhatLead CRM

Este guia fornece instruções passo a passo para configurar o WhatLead em ambientes de desenvolvimento e produção.

---

## 📋 Pré-requisitos

### Obrigatório

- **Node.js** 18.17+ ou 20+ ([Download](https://nodejs.org/))
- **pnpm** 8+ (`npm install -g pnpm`)
- **PostgreSQL** 14+ ou Docker
- **Git** para clonar o repositório

### Recomendado

- **Docker** (para rodar PostgreSQL localmente)
- **VSCode** com extensões:
  - Prisma
  - ESLint
  - Tailwind CSS IntelliSense
  - Pretty TypeScript Errors

---

## 🏁 Instalação Rápida (Desenvolvimento)

### 1. Clone o Repositório

```bash
git clone https://github.com/seu-usuario/WhatLead.git
cd WhatLead
```

### 2. Instale as Dependências

```bash
pnpm install
```

### 3. Configure o Banco de Dados

**Opção A: Docker (Recomendado)**

```bash
# Inicie o PostgreSQL via Docker
docker-compose up -d

# Aguarde alguns segundos para o banco iniciar
```

**Opção B: PostgreSQL Local/Remoto**

Se você já tem PostgreSQL instalado ou usa um serviço remoto (Neon, Supabase, etc.), pule este passo.

### 4. Configure as Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:

```env
# Database (ajuste se necessário)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/whatlead"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/whatlead"

# Auth (gere secrets seguros)
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-min-32-chars"

# WhatsApp Cloud API (opcional para dev, mas necessário para usar WhatsApp)
WA_PHONE_NUMBER_ID=""
WA_ACCESS_TOKEN=""
WA_VERIFY_TOKEN="my-verify-token-123"
WA_BUSINESS_ACCOUNT_ID=""

# PIX Gateways (opcional para dev)
PSP_PROVIDER="fake"  # Use "fake" para testes sem gateway real
MERCADOPAGO_ACCESS_TOKEN=""
ASAAS_API_KEY=""

# URLs
NEXT_PUBLIC_API_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Como gerar secrets seguros:**
```bash
# No terminal
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Execute as Migrations

```bash
pnpm db:migrate:dev
```

Isso criará todas as tabelas no banco de dados.

### 6. (Opcional) Popule o Banco com Dados de Teste

```bash
pnpm db:seed
```

Isso criará:
- Uma empresa de exemplo
- Um usuário admin (email: `admin@example.com`, senha: `Admin123!`)
- Alguns clientes, produtos e pedidos de exemplo

### 7. Inicie o Servidor de Desenvolvimento

```bash
pnpm dev
```

Acesse: **http://localhost:3000**

**Login de teste:**
- Email: `admin@example.com`
- Senha: `Admin123!`

---

## ⚙️ Configuração Avançada

### WhatsApp Cloud API

Para usar a integração com WhatsApp, você precisa configurar o WhatsApp Business Platform.

**Siga o guia completo:** [WHATSAPP_SETUP.md](./WHATSAPP_SETUP.md)

**Resumo:**
1. Crie uma app no Facebook Developers
2. Configure o WhatsApp Business Platform
3. Obtenha credenciais (Phone Number ID, Access Token, etc.)
4. Configure o webhook apontando para `https://seu-dominio.com/api/webhooks/whatsapp`

### PIX Gateways

Para aceitar pagamentos via PIX, configure um dos gateways suportados.

**Siga o guia completo:** [PIX_SETUP.md](./PIX_SETUP.md)

**Gateways Suportados:**
- **Mercado Pago** (recomendado para iniciantes)
- **Asaas** (mais opções de personalização)
- **Fake** (apenas para testes locais)

**Configuração Mercado Pago:**
```env
PSP_PROVIDER="mercadopago"
MERCADOPAGO_ACCESS_TOKEN="APP_USR-xxxxx"
```

**Configuração Asaas:**
```env
PSP_PROVIDER="asaas"
ASAAS_API_KEY="xxxxx"
```

### SMTP para E-mails (Opcional)

Se quiser enviar e-mails de verificação/recuperação de senha:

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="seu-email@gmail.com"
SMTP_PASSWORD="sua-senha-app"
SMTP_FROM="noreply@seu-dominio.com"
```

---

## 🏗️ Instalação para Produção

### 1. Clone e Instale

```bash
git clone https://github.com/seu-usuario/WhatLead.git
cd WhatLead
pnpm install --frozen-lockfile
```

### 2. Configure Variáveis de Ambiente

Crie `.env.production` ou configure diretamente no seu provedor de hospedagem:

```env
# Database (use URLs de produção)
DATABASE_URL="postgresql://user:pass@host:5432/whatlead?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://user:pass@host:5432/whatlead"

# Auth (CRÍTICO: use secrets fortes e únicos)
JWT_SECRET="[GERE UM SECRET SEGURO DE 64+ CARACTERES]"
JWT_REFRESH_SECRET="[GERE OUTRO SECRET DIFERENTE]"

# WhatsApp Cloud API (obrigatório)
WA_PHONE_NUMBER_ID="seu-phone-number-id"
WA_ACCESS_TOKEN="seu-access-token-permanente"
WA_VERIFY_TOKEN="token-para-validar-webhook"
WA_BUSINESS_ACCOUNT_ID="seu-business-account-id"

# PIX Gateway (obrigatório)
PSP_PROVIDER="mercadopago"  # ou "asaas"
MERCADOPAGO_ACCESS_TOKEN="seu-token-producao"
# OU
ASAAS_API_KEY="sua-api-key-producao"

# URLs
NEXT_PUBLIC_API_URL="https://seu-dominio.com"
NEXT_PUBLIC_APP_URL="https://seu-dominio.com"

# Monitoring (opcional mas recomendado)
SENTRY_DSN="https://..."
```

### 3. Execute as Migrations

```bash
pnpm db:migrate:deploy
```

**⚠️ IMPORTANTE:** Nunca rode `db:reset` ou `db:migrate:dev` em produção!

### 4. Build da Aplicação

```bash
pnpm build
```

Isso compila:
- Next.js (otimizado para produção)
- Prisma Client
- Worker (se configurado)

### 5. Inicie o Servidor

```bash
pnpm start
```

Ou use PM2 para process management:

```bash
npm install -g pm2
pm2 start pnpm --name "whatlead" -- start
pm2 save
pm2 startup
```

---

## ☁️ Deploy em Plataformas

### Vercel (Recomendado)

**Vantagens:** Deploy automático, edge functions, fácil configuração

**Passos:**
1. Conecte seu repositório GitHub à Vercel
2. Configure as variáveis de ambiente no painel da Vercel
3. Ajuste `vercel.json` se necessário
4. Deploy automático em cada push

**Configuração do Database:**
- Use Neon, Supabase ou Vercel Postgres
- Configure `DATABASE_URL` e `DIRECT_URL` nas variáveis de ambiente

**Build Settings:**
```
Build Command: pnpm build
Output Directory: apps/web/.next
Install Command: pnpm install --frozen-lockfile
```

### Railway

**Vantagens:** Database incluído, fácil configuração, preço justo

**Passos:**
1. Crie um novo projeto no Railway
2. Adicione PostgreSQL service
3. Conecte seu repositório GitHub
4. Configure variáveis de ambiente
5. Deploy automático

### AWS / Digital Ocean / VPS

**Para servidores customizados:**

1. **Setup inicial:**
```bash
# Instale dependências
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pnpm pm2

# Clone e configure
git clone https://github.com/seu-usuario/WhatLead.git
cd WhatLead
pnpm install --frozen-lockfile
```

2. **Configure Nginx como reverse proxy:**
```nginx
server {
    listen 80;
    server_name seu-dominio.com;

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

3. **Configure SSL com Certbot:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com
```

4. **Inicie com PM2:**
```bash
pnpm build
pm2 start pnpm --name "whatlead" -- start
pm2 save
pm2 startup
```

---

## 🔧 Comandos Úteis

### Desenvolvimento

```bash
# Inicia dev server (hot reload)
pnpm dev

# Roda apenas o app web
pnpm --filter web dev

# Abre Prisma Studio (GUI do banco)
pnpm db:studio

# Gera Prisma Client (após alterar schema)
pnpm db:generate

# Cria nova migration
pnpm db:migrate:dev --name descrição_da_mudança

# Reseta banco e aplica seed
pnpm db:reset

# Roda seed manualmente
pnpm db:seed

# Checa erros TypeScript
pnpm typecheck

# Roda linter
pnpm lint

# Formata código
pnpm format
```

### Produção

```bash
# Build otimizado
pnpm build

# Inicia servidor
pnpm start

# Deploy migrations
pnpm db:migrate:deploy

# Visualiza schema atualizado
pnpm db:studio
```

### Database

```bash
# Backup database
pg_dump -U postgres whatlead > backup.sql

# Restore database
psql -U postgres whatlead < backup.sql

# Conectar ao banco via CLI
psql -U postgres -d whatlead
```

---

## 🐛 Troubleshooting

### Erro: "Can't reach database server"

**Causa:** PostgreSQL não está rodando ou credenciais incorretas

**Solução:**
```bash
# Se usando Docker
docker-compose up -d
docker-compose logs postgres

# Se usando PostgreSQL local
sudo systemctl status postgresql
sudo systemctl start postgresql

# Teste conexão manualmente
psql -U postgres -h localhost -p 5432 -d whatlead
```

### Erro: "P1001: Can't reach database server"

**Causa:** Database URL incorreta ou firewall bloqueando

**Solução:**
- Verifique `DATABASE_URL` no `.env`
- Certifique-se que o host/porta estão corretos
- No Neon/Supabase, habilite "pooling" e use `?pgbouncer=true`

### Erro: "JWT secret must be at least 32 characters"

**Solução:**
```bash
# Gere um secret seguro
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Erro: "Port 3000 already in use"

**Solução:**
```bash
# Encontre o processo
lsof -ti:3000

# Mate o processo
kill -9 $(lsof -ti:3000)

# Ou use outra porta
PORT=3001 pnpm dev
```

### Migrations não aplicam

**Solução:**
```bash
# Resete o Prisma Migrations folder (CUIDADO: apenas em dev!)
rm -rf packages/db/prisma/migrations
pnpm db:migrate:dev --name init

# Em produção, nunca delete migrations!
# Use migrate:deploy para aplicar pendentes
pnpm db:migrate:deploy
```

### Build falha com "heap out of memory"

**Solução:**
```bash
# Aumente memória do Node.js
NODE_OPTIONS="--max-old-space-size=4096" pnpm build
```

### WhatsApp webhook não recebe mensagens

**Checklist:**
1. URL do webhook está acessível publicamente (use ngrok em dev)
2. Verify Token está correto
3. Webhook está subscrito aos eventos corretos
4. Access Token tem permissões necessárias

**Debug:**
```bash
# Teste webhook localmente
curl -X POST http://localhost:3000/api/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -d '{"entry":[{"changes":[{"value":{"messages":[{"from":"5511999999999","text":{"body":"Test"}}]}}]}]}'
```

---

## 📚 Próximos Passos

Após instalar e rodar o projeto:

1. **Configure WhatsApp:** Siga [WHATSAPP_SETUP.md](./WHATSAPP_SETUP.md)
2. **Configure PIX:** Siga [PIX_SETUP.md](./PIX_SETUP.md)
3. **Leia a Arquitetura:** [ARCHITECTURE.md](./ARCHITECTURE.md)
4. **Otimize Performance:** [PERFORMANCE.md](./PERFORMANCE.md)
5. **Contribua:** [CONTRIBUTING.md](./CONTRIBUTING.md)

---

## 🆘 Precisa de Ajuda?

- **Documentação:** Confira os outros arquivos em `/docs`
- **Issues:** Abra uma issue no GitHub
- **Discussões:** Use GitHub Discussions para perguntas

---

**Última atualização:** 16/02/2026  
**Versão:** 1.0.0

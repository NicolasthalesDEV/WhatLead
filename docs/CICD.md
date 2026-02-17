# 🚀 Guia de CI/CD - WhatLead CRM

Este guia explica como configurar e usar o pipeline de CI/CD automatizado do WhatLead com GitHub Actions.

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Workflows Disponíveis](#workflows-disponíveis)
- [Configuração Inicial](#configuração-inicial)
- [Deploy Automático](#deploy-automático)
- [Ambientes](#ambientes)
- [Secrets e Variáveis](#secrets-e-variáveis)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O WhatLead utiliza **GitHub Actions** para automação completa de CI/CD:

- ✅ **Lint & Type Check** em cada push/PR
- ✅ **Build** automatizado
- ✅ **Testes** de database migrations
- ✅ **Security audit** com Trivy
- ✅ **Deploy automático** para staging (develop) e production (main)
- ✅ **PR checks** com comentários automáticos

**Fluxo típico:**
```
Push/PR → Lint → Build → Tests → Security → Deploy
```

---

## 📦 Workflows Disponíveis

### 1. CI/CD Pipeline ([.github/workflows/ci-cd.yml](../../.github/workflows/ci-cd.yml))

**Triggers:**
- Push para `main` ou `develop`
- Pull requests para `main` ou `develop`
- Manual via workflow_dispatch

**Jobs:**
1. **Lint & Type Check** - ESLint + TypeScript
2. **Build** - Compila Next.js e gera artifacts
3. **Tests** - Testes unitários (quando implementados)
4. **Migration Check** - Valida migrations Prisma
5. **Security Audit** - Scan de vulnerabilidades
6. **Deploy Staging** - Deploy automático para staging (branch develop)
7. **Deploy Production** - Deploy para produção com aprovação (branch main)
8. **Notify Failure** - Notifica falhas

### 2. PR Checks ([.github/workflows/pr-checks.yml](../../.github/workflows/pr-checks.yml))

**Triggers:**
- Pull requests (opened, synchronize, reopened)

**Jobs:**
1. **Quick Checks** - Lint, type check, build
2. **PR Status** - Status final do PR
3. **PR Comment** - Comenta resultado no PR

---

## ⚙️ Configuração Inicial

### 1. Habilitar GitHub Actions

1. Vá para **Settings** → **Actions** → **General**
2. Marque **Allow all actions and reusable workflows**
3. Salve as configurações

### 2. Configurar Environments

#### Staging Environment

1. Vá para **Settings** → **Environments**
2. Clique em **New environment**
3. Nome: `staging`
4. **Environment URL**: `https://staging.seu-dominio.com`
5. **Deployment protection rules**: Nenhuma (deploy automático)

#### Production Environment

1. Crie novo environment: `production`
2. **Environment URL**: `https://seu-dominio.com`
3. **Deployment protection rules**:
   - ✅ **Required reviewers** - Adicione revisor(es)
   - ✅ **Wait timer** - 5 minutos (opcional)
4. Isso garante que deploys para produção precisam de aprovação

### 3. Configurar CodeQL (Segurança)

1. Vá para **Security** → **Code scanning**
2. Clique em **Set up code scanning**
3. Escolha **CodeQL Analysis**
4. Commit o arquivo gerado

---

## 🚀 Deploy Automático

### Com Vercel (Recomendado)

#### 1. Criar Projeto no Vercel

```bash
# Instale Vercel CLI
npm i -g vercel

# Login
vercel login

# Link projeto (na pasta apps/web)
cd apps/web
vercel link
```

#### 2. Obter Tokens

```bash
# Obter token de deploy
# Vá para: https://vercel.com/account/tokens
# Crie um token com escopo do seu projeto

# Obter IDs do projeto
vercel project ls
vercel teams ls # Para org ID
```

#### 3. Adicionar Secrets no GitHub

Vá para **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

```yaml
VERCEL_TOKEN: seu-token-aqui
VERCEL_ORG_ID: seu-org-id
VERCEL_PROJECT_ID: seu-project-id
```

#### 4. Ajustar Workflow

No arquivo `.github/workflows/ci-cd.yml`, ajuste as URLs dos environments:

```yaml
environment:
  name: production
  url: https://seu-dominio.vercel.app  # Ou domínio customizado
```

### Com Railway

#### 1. Criar Projeto no Railway

1. Acesse [railway.app](https://railway.app)
2. Conecte seu repositório GitHub
3. Adicione PostgreSQL service
4. Configure variáveis de ambiente

#### 2. Obter Token

1. Vá para **Account Settings** → **Tokens**
2. Crie um novo token

#### 3. Atualizar Workflow

Substitua step de deploy por:

```yaml
- name: Deploy to Railway
  run: |
    npm i -g @railway/cli
    railway up
  env:
    RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### Com AWS / VPS Customizado

Use SSH + rsync para deploy:

```yaml
- name: Deploy to VPS
  uses: appleboy/ssh-action@master
  with:
    host: ${{ secrets.SSH_HOST }}
    username: ${{ secrets.SSH_USER }}
    key: ${{ secrets.SSH_PRIVATE_KEY }}
    script: |
      cd /path/to/whatlead
      git pull origin main
      pnpm install --frozen-lockfile
      pnpm build
      pm2 restart whatlead
```

---

## 🌍 Ambientes

### Development (Local)

```bash
# Roda localmente
pnpm dev
```

**Características:**
- Hot reload
- Debug habilitado
- Database local (Docker)

### Staging (develop branch)

**URL**: `https://staging.seu-dominio.com`

**Trigger**: Push para branch `develop`

**Características:**
- Deploy automático (sem aprovação)
- Variáveis de ambiente de staging
- Database de teste
- Usado para QA antes de produção

### Production (main branch)

**URL**: `https://seu-dominio.com`

**Trigger**: Push para branch `main` (requer aprovação)

**Características:**
- Deploy requer aprovação manual
- Variáveis de ambiente de produção
- Database de produção
- Monitoramento ativo
- Backups automáticos

---

## 🔐 Secrets e Variáveis

### Repository Secrets

Configure em **Settings** → **Secrets and variables** → **Actions**:

#### Para Vercel Deploy
```yaml
VERCEL_TOKEN: # Token de autenticação Vercel
VERCEL_ORG_ID: # ID da organização/usuário
VERCEL_PROJECT_ID: # ID do projeto
```

#### Para Railway Deploy
```yaml
RAILWAY_TOKEN: # Token de autenticação Railway
```

#### Para VPS/SSH Deploy
```yaml
SSH_HOST: # IP ou domínio do servidor
SSH_USER: # Username SSH
SSH_PRIVATE_KEY: # Chave privada SSH (conteúdo completo)
```

#### Para Notificações (Opcional)
```yaml
SLACK_WEBHOOK_URL: # Webhook do Slack
DISCORD_WEBHOOK_URL: # Webhook do Discord
```

### Environment Variables

Configure variáveis específicas por ambiente:

**Staging:**
```env
DATABASE_URL=postgresql://...staging-db...
JWT_SECRET=staging-secret
WA_ACCESS_TOKEN=test-token
PSP_PROVIDER=fake
```

**Production:**
```env
DATABASE_URL=postgresql://...prod-db...
JWT_SECRET=super-secure-prod-secret
WA_ACCESS_TOKEN=production-token
PSP_PROVIDER=mercadopago
```

---

## 🔄 Workflow de Desenvolvimento

### Feature Development

```bash
# 1. Criar branch de feature
git checkout -b feature/nova-funcionalidade

# 2. Desenvolver e commitar
git add .
git commit -m "feat: adiciona nova funcionalidade"

# 3. Push e criar PR
git push origin feature/nova-funcionalidade
# Abrir PR no GitHub para 'develop'

# 4. CI/CD automático roda checks
# - Lint & Type Check ✅
# - Build ✅
# - PR Comment aparece

# 5. Após aprovação, merge para develop
# Deploy automático para staging

# 6. Testar em staging
# Acesse: https://staging.seu-dominio.com

# 7. Se OK, criar PR de develop → main
# Deploy para produção (requer aprovação)
```

### Hotfix (Urgente)

```bash
# 1. Criar branch de hotfix a partir de main
git checkout main
git checkout -b hotfix/correcao-urgente

# 2. Fazer correção
git add .
git commit -m "fix: corrige bug crítico"

# 3. PR direto para main
git push origin hotfix/correcao-urgente
# Abrir PR para 'main'

# 4. Após aprovação, merge
# Deploy para produção imediato

# 5. Merge back para develop
git checkout develop
git merge main
git push origin develop
```

---

## 📊 Monitoramento

### GitHub Actions Dashboard

Acesse **Actions** tab para ver:
- Runs em andamento
- Histórico de deploys
- Logs detalhados
- Tempo de execução

### Status Badges

Adicione ao README.md:

```markdown
![CI/CD](https://github.com/seu-usuario/WhatLead/actions/workflows/ci-cd.yml/badge.svg)
```

### Notifications

Configure notificações em **Settings** → **Notifications**:
- Email em falhas
- Slack/Discord integrations (via webhooks)

---

## 🐛 Troubleshooting

### Build Falhou

**Erro:** `Cannot find module`

**Solução:**
```bash
# Limpe cache e reinstale
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

**Erro:** `Type check failed`

**Solução:**
```bash
# Rode localmente para ver erros
pnpm typecheck

# Gere Prisma Client
pnpm db:generate
```

### Migration Check Falhou

**Erro:** `Database schema não está sincronizado`

**Solução:**
```bash
# Crie nova migration
pnpm db:migrate:dev --name fix_schema

# Commit e push migration
git add packages/db/prisma/migrations
git commit -m "chore: add missing migration"
git push
```

### Deploy Falhou

**Erro:** `VERCEL_TOKEN invalid`

**Solução:**
1. Gere novo token em vercel.com/account/tokens
2. Atualize secret no GitHub
3. Re-run workflow

**Erro:** `Build exceeded time limit`

**Solução:**
- Otimize build (reduza dependencies)
- Use cache efetivamente
- Considere build matrix

### Tests Falharam

**Erro:** `Connection to database failed`

**Solução:**
- Verifique service `postgres` no workflow
- Ajuste DATABASE_URL no teste
- Rode migrations antes dos testes

---

## 🎯 Best Practices

### 1. Branch Protection

Configure em **Settings** → **Branches** → **Add rule**:

**Para `main`:**
- ✅ Require pull request before merging
- ✅ Require status checks to pass (lint, build, tests)
- ✅ Require approvals (1+)
- ✅ Require linear history
- ✅ Include administrators

**Para `develop`:**
- ✅ Require status checks to pass
- ☐ Require approvals (opcional)

### 2. Conventional Commits

Use prefixos padronizados:
```
feat: nova funcionalidade
fix: correção de bug
docs: documentação
chore: manutenção
refactor: refatoração
test: testes
perf: performance
ci: CI/CD changes
```

### 3. Semantic Versioning

Siga semver (X.Y.Z):
- **X** (major): Breaking changes
- **Y** (minor): New features (backwards compatible)
- **Z** (patch): Bug fixes

### 4. Changelog Automático

Use [release-please](https://github.com/googleapis/release-please):

```yaml
# .github/workflows/release.yml
- uses: google-github-actions/release-please-action@v3
  with:
    release-type: node
    package-name: whatlead
```

---

## 📚 Recursos Adicionais

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Vercel CLI Docs](https://vercel.com/docs/cli)
- [Railway Docs](https://docs.railway.app)
- [Conventional Commits](https://www.conventionalcommits.org)

---

## 🆘 Suporte

Problemas com CI/CD?
- Revise os logs no GitHub Actions
- Consulte a documentação acima
- Abra issue no repositório

---

**Última atualização:** 16/02/2026  
**Versão:** 1.0.0

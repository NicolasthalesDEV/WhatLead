# 🔐 Guia de Segurança - WhatLead CRM

Este documento descreve todas as medidas de segurança implementadas no WhatLead e fornece diretrizes para manter o sistema seguro em produção.

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Segurança Implementada](#segurança-implementada)
- [Configuração para Produção](#configuração-para-produção)
- [Backup e Recuperação](#backup-e-recuperação)
- [Monitoramento de Segurança](#monitoramento-de-segurança)
- [Resposta a Incidentes](#resposta-a-incidentes)
- [Checklist de Segurança](#checklist-de-segurança)

---

## 🎯 Visão Geral

O WhatLead implementa múltiplas camadas de segurança seguindo as melhores práticas da indústria:

- **Autenticação robusta** com JWT e 2FA
- **Autorização granular** com RBAC
- **Proteção contra ataques** comuns (XSS, CSRF, SQL Injection)
- **Criptografia** de dados sensíveis
- **Auditoria completa** de ações
- **Backups automatizados** do banco de dados

**Status:** ✅ Pronto para produção

---

## 🛡️ Segurança Implementada

### 1. Autenticação

#### JWT (JSON Web Tokens)
- **Access Token**: Válido por 15 minutos
- **Refresh Token**: Válido por 7 dias, armazenado no banco
- **Algoritmo**: HS256 (HMAC with SHA-256)
- **Secret mínimo**: 32 caracteres (64+ recomendado)

**Implementação:**
```typescript
// apps/web/src/lib/auth.ts
export async function signJwt(payload: Claims, expiresIn: string)
export async function verifyJwt(token: string)
export async function createSession(userId: string, companyId: string, role: string, req: NextRequest)
export async function refreshSession(refreshToken: string)
export async function revokeSession(sessionId: string)
```

**Fluxo:**
1. Login → Gera accessToken + refreshToken
2. Cliente armazena tokens (httpOnly cookie recomendado)
3. Requisições incluem `Authorization: Bearer <accessToken>`
4. Token expira → Cliente chama `/api/auth/refresh` com refreshToken
5. Logout → Revoga sessão no banco

#### 2FA (Two-Factor Authentication)
- **Método**: TOTP (Time-based One-Time Password)
- **Algoritmo**: SHA-1
- **Período**: 30 segundos
- **Dígitos**: 6
- **Códigos de backup**: 8 códigos únicos

**Implementação:**
```typescript
// apps/web/src/lib/totp.ts
export function generateTotpSecret()
export function generateTotpToken(secret: string)
export function verifyTotpToken(secret: string, token: string)
export function generateBackupCodes()
```

**Fluxo:**
1. Usuário ativa 2FA → Sistema gera secret
2. QR Code exibido → Usuário escaneia no app (Google Authenticator, Authy)
3. Login → Requer senha + código TOTP
4. Códigos de backup para emergências

#### Recuperação de Senha
- **Token único**: Válido por 1 hora
- **Hash SHA-256** do token armazenado no banco
- **Rate limit**: Máximo 3 tentativas em 15 minutos
- **Envio via e-mail** (SMTP configurado)

**Fluxo:**
1. Usuário solicita reset → `/api/auth/forgot-password`
2. Token gerado e enviado por e-mail
3. Usuário clica no link → `/reset-password?token=...`
4. Define nova senha → Token invalidado

---

### 2. Autorização

#### RBAC (Role-Based Access Control)
Sistema de permissões granulares com 4 roles e 42+ permissões.

**Roles:**
- `OWNER` - Dono da empresa (acesso total)
- `ADMIN` - Administrador (gerencia usuários e configurações)
- `SELLER` - Vendedor (acesso aos seus clientes/pedidos)
- `SUPPORT` - Suporte (acesso a tickets)

**Permissões (exemplos):**
```typescript
// apps/web/src/lib/permissions.ts
'users:create', 'users:read', 'users:update', 'users:delete'
'orders:read', 'orders:read_all', 'orders:create', 'orders:update'
'customers:read', 'customers:create', 'customers:update'
'chatbot:create', 'chatbot:configure'
'webhooks:create', 'webhooks:delete'
'audit:read'
```

**Implementação:**
```typescript
// apps/web/src/lib/authorization.ts
export async function authorize(req: NextRequest, requiredPermissions?: Permission[])
export async function authorizeResource(req: NextRequest, resourceId: string, resourceType: string, permission: Permission)
export async function requireRole(req: NextRequest, allowedRoles: Role[])
```

**Uso:**
```typescript
// Em uma API route
const result = await authorize(req, ['orders:read']);
if (!result.authorized) {
  return result.response; // 403 Forbidden
}
const { user } = result.data;
```

#### Multi-tenant
- Isolamento completo de dados por `companyId`
- Todas as queries filtradas por empresa
- Impossível acessar dados de outra empresa

---

### 3. Proteção contra Ataques

#### CSRF (Cross-Site Request Forgery)
- **Token único** por sessão
- **Verificação dupla**: Cookie + Header
- **Proteção em**: POST, PUT, PATCH, DELETE

**Implementação:**
```typescript
// apps/web/src/lib/csrf.ts
export function generateCsrfToken(): string
export function verifyCsrfToken(req: NextRequest): boolean
export function requireCsrf(req: NextRequest)
```

**Fluxo:**
1. Frontend chama `/api/auth/csrf` → Recebe token
2. Token armazenado em cookie + enviado em header `x-csrf-token`
3. Servidor valida cookie === header

#### SQL Injection
- **Prisma ORM**: Proteção automática com prepared statements
- **Sem queries raw**: Todas as queries usam Prisma Client
- **Validação**: Todos os inputs validados com Zod

✅ **Proteção automática pelo Prisma**

#### XSS (Cross-Site Scripting)
- **React escaping**: Automático em todos os componentes
- **CSP Headers**: Content-Security-Policy configurado
- **Sanitização**: Inputs validados e escapados

✅ **Proteção automática pelo React + Headers**

#### Clickjacking
- **X-Frame-Options**: `DENY` (impede iframe)
- **CSP**: `frame-ancestors 'none'`

✅ **Headers configurados no middleware**

#### MIME Sniffing
- **X-Content-Type-Options**: `nosniff`

✅ **Headers configurados no middleware**

---

### 4. Security Headers

Todos os headers de segurança são aplicados automaticamente via middleware.

**Implementação:** [apps/web/src/middleware.ts](apps/web/src/middleware.ts)

```typescript
// Security Headers aplicados em todas as respostas:
'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
'X-Frame-Options': 'DENY'
'X-Content-Type-Options': 'nosniff'
'X-XSS-Protection': '1; mode=block'
'Referrer-Policy': 'strict-origin-when-cross-origin'
'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
'Content-Security-Policy': '...' // Configuração detalhada no arquivo
```

**O que cada header faz:**
- **HSTS**: Força HTTPS por 1 ano
- **X-Frame-Options**: Impede que o site seja carregado em iframe
- **X-Content-Type-Options**: Impede MIME sniffing
- **X-XSS-Protection**: Ativa filtro XSS do browser
- **Referrer-Policy**: Controla informações do referrer
- **Permissions-Policy**: Desabilita APIs perigosas (câmera, microfone)
- **CSP**: Controla quais recursos podem ser carregados

---

### 5. Criptografia

#### Senhas
- **Algoritmo**: bcrypt
- **Salt rounds**: 10 (2^10 iterações)
- **Nunca armazenadas em texto plano**

```typescript
import bcrypt from 'bcryptjs';

// Hash password
const hash = await bcrypt.hash(password, 10);

// Verify password
const valid = await bcrypt.compare(password, hash);
```

#### Tokens Sensíveis
- **Algoritmo**: SHA-256
- **Uso**: Reset password, email verification
- **Armazenamento**: Apenas hash no banco

```typescript
import crypto from 'crypto';

const token = crypto.randomBytes(32).toString('hex');
const hash = crypto.createHash('sha256').update(token).digest('hex');
// Armazena hash no banco, envia token ao usuário
```

#### HTTPS
- **Obrigatório em produção**
- **HSTS** força HTTPS por 1 ano
- **Certificado SSL/TLS** (Let's Encrypt recomendado)

---

### 6. Auditoria

Todas as ações importantes são registradas no `AuditLog`.

**Eventos auditados:**
- Login/logout
- Criação/edição/exclusão de entidades
- Mudanças de permissões
- Tentativas de acesso não autorizado
- Alterações de configurações
- Exportação de dados

**Modelo:**
```prisma
model AuditLog {
  id         String   @id @default(cuid())
  userId     String
  companyId  String
  action     String   // LOGIN, CREATE_ORDER, DELETE_CUSTOMER, etc.
  resource   String   // users, orders, customers, etc.
  resourceId String?  // ID do recurso afetado
  metadata   Json?    // Dados adicionais (JSON)
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime @default(now())
}
```

**Consultar logs:**
```typescript
const logs = await prisma.auditLog.findMany({
  where: {
    companyId: user.companyId,
    action: { contains: 'DELETE' },
  },
  orderBy: { createdAt: 'desc' },
  take: 100,
});
```

---

### 7. Rate Limiting

**Status**: ⏸️ Implementação básica (recomendada para produção)

**Recomendações:**
- Use **Upstash Redis** ou **Cloudflare Rate Limiting**
- Limites sugeridos:
  - Login: 5 tentativas / 15 minutos
  - API geral: 100 requisições / minuto
  - Webhooks: 1000 requisições / hora

**Exemplo com Upstash:**
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '15 m'),
});

const { success } = await ratelimit.limit(ip);
if (!success) {
  return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
}
```

---

## ⚙️ Configuração para Produção

### 1. Variáveis de Ambiente

**CRÍTICO:** Nunca comite secrets no repositório!

```bash
# Geração de secrets seguros
openssl rand -hex 32  # Para JWT_SECRET
openssl rand -hex 32  # Para JWT_REFRESH_SECRET
```

**Checklist:**
- [ ] `JWT_SECRET` - Mínimo 32 caracteres (64+ recomendado)
- [ ] `JWT_REFRESH_SECRET` - Diferente do JWT_SECRET
- [ ] `DATABASE_URL` - Connection string com SSL (`?sslmode=require`)
- [ ] `WA_ACCESS_TOKEN` - Token permanente do WhatsApp
- [ ] `MERCADOPAGO_ACCESS_TOKEN` - Token de produção (não sandbox)
- [ ] `SMTP_PASSWORD` - App password (não senha da conta)
- [ ] Todos os secrets únicos (não copiar de .env.example)

### 2. Database

**Configuração segura:**
```env
# Use SSL para conexões
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# Para Neon/Supabase com connection pooling
DATABASE_URL="postgresql://user:pass@host:5432/db?pgbouncer=true&sslmode=require"
DIRECT_URL="postgresql://user:pass@host:5432/db?sslmode=require"
```

**Recomendações:**
- ✅ Use bancos gerenciados (Neon, Supabase, AWS RDS)
- ✅ Habilite backups automáticos
- ✅ Configure replicação (se alto volume)
- ✅ Limite conexões por aplicação
- ✅ Use SSL/TLS obrigatório

### 3. Deploy

**Plataformas recomendadas:**
- **Vercel** - Fácil, integração com GitHub, SSL automático
- **Railway** - Database + app no mesmo lugar
- **AWS** - Controle total, mais complexo

**Checklist de deploy:**
- [ ] HTTPS obrigatório (SSL/TLS)
- [ ] Variáveis de ambiente configuradas
- [ ] Backups do banco configurados
- [ ] Monitoramento configurado (Sentry, etc.)
- [ ] Logs centralizados
- [ ] Health checks ativos
- [ ] Rate limiting configurado
- [ ] CDN para assets estáticos

---

## 💾 Backup e Recuperação

### Script de Backup Automatizado

**Localização:** [scripts/backup.sh](../scripts/backup.sh)

**Features:**
- Backups automáticos (diário, semanal, mensal)
- Compressão gzip
- Checksum SHA-256
- Retenção automática
- Restore com verificação

**Setup:**

```bash
# Tornar script executável
chmod +x scripts/backup.sh

# Teste manual
./scripts/backup.sh

# Configurar cron para backups automatizados
crontab -e

# Adicionar linhas:
0 2 * * * /path/to/whatlead/scripts/backup.sh --type daily    # Diário às 2h
0 3 * * 0 /path/to/whatlead/scripts/backup.sh --type weekly   # Semanal domingo 3h
0 4 1 * * /path/to/whatlead/scripts/backup.sh --type monthly  # Mensal dia 1 às 4h
```

**Política de retenção:**
- **Daily**: 7 dias
- **Weekly**: 4 semanas
- **Monthly**: 12 meses

**Restore:**
```bash
# Listar backups disponíveis
./scripts/backup.sh --list

# Restaurar backup
./scripts/backup.sh --restore /path/to/backup.sql.gz
```

### Backup em Cloud

**Recomendações:**
- Sincronize backups para S3/R2/GCS
- Configure versionamento
- Teste restore periodicamente
- Mantenha backups em múltiplas regiões

**Exemplo com AWS S3:**
```bash
# Sync backups to S3
aws s3 sync ./backups s3://my-bucket/whatlead-backups/ --exclude "*" --include "*.sql.gz"
```

---

## 📊 Monitoramento de Segurança

### 1. Dependabot

**Configuração:** [.github/dependabot.yml](../.github/dependabot.yml)

- ✅ Scan semanal de dependências
- ✅ Updates automáticos de segurança
- ✅ Grupos de dependências relacionadas
- ✅ Pull requests automáticos

**GitHub Actions:**
- Habilite "Dependabot alerts" no repositório
- Configure notificações de segurança

### 2. Logs de Auditoria

**Monitorar:**
- Tentativas de login falhadas
- Acessos não autorizados (403)
- Mudanças em permissões/roles
- Exportações de dados
- Exclusões em massa

**Query exemplo:**
```typescript
// Logins falhados nas últimas 24h
const failedLogins = await prisma.auditLog.findMany({
  where: {
    action: 'LOGIN_FAILED',
    createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  },
  orderBy: { createdAt: 'desc' },
});

// Agrupar por IP
const byIp = failedLogins.reduce((acc, log) => {
  acc[log.ipAddress] = (acc[log.ipAddress] || 0) + 1;
  return acc;
}, {});

// Alertar se > 10 tentativas do mesmo IP
for (const [ip, count] of Object.entries(byIp)) {
  if (count > 10) {
    console.warn(`Suspicious activity from IP: ${ip} (${count} failed logins)`);
    // Enviar alerta
  }
}
```

### 3. Sentry (Recomendado)

**Setup:**
```bash
pnpm add @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**O que monitora:**
- Erros em runtime
- Performance (APM)
- Transações lentas
- Alertas em tempo real

---

## 🚨 Resposta a Incidentes

### Plano de Ação

#### 1. Detecção
- Monitorar logs de auditoria
- Alertas Sentry/Datadog
- Relatórios de usuários
- Scan de vulnerabilidades

#### 2. Contenção
```bash
# Revogar todas as sessões de um usuário comprometido
await revokeAllUserSessions(userId);

# Desabilitar usuário
await prisma.user.update({
  where: { id: userId },
  data: { disabled: true },
});

# Em caso de ataque massivo: Desativar registros temporariamente
# Adicionar rate limit agressivo
# Bloquear IPs suspeitos no firewall
```

#### 3. Investigação
```typescript
// Buscar atividades suspeitas
const suspiciousActivity = await prisma.auditLog.findMany({
  where: {
    userId: compromisedUserId,
    createdAt: {
      gte: suspectedBreachTime,
    },
  },
  orderBy: { createdAt: 'asc' },
});

// Checar acessos de IPs estranhos
const ips = [...new Set(suspiciousActivity.map(log => log.ipAddress))];
```

#### 4. Remediação
- Forçar reset de senha para usuários afetados
- Revogar tokens comprometidos
- Aplicar patches de segurança
- Restaurar dados de backup se necessário

#### 5. Comunicação
- Notificar usuários afetados
- Documentar incidente
- Atualizar políticas de segurança
- Relatório para compliance (LGPD/GDPR)

---

## ✅ Checklist de Segurança

### Antes do Deploy

- [ ] **Secrets únicos** gerados (JWT, Database, APIs)
- [ ] **HTTPS configurado** e funcionando
- [ ] **Variables de ambiente** configuradas corretamente
- [ ] **Headers de segurança** ativos (verificar com curl)
- [ ] **Backups automáticos** configurados
- [ ] **Dependabot habilitado** no GitHub
- [ ] **Monitoramento** configurado (Sentry/Datadog)
- [ ] **Rate limiting** implementado
- [ ] **CSP headers** ajustados para domínio prod
- [ ] **Teste de penetração** básico realizado

### Após o Deploy

- [ ] **Teste de HTTPS** (verificar certificado)
- [ ] **Teste de headers** com [securityheaders.com](https://securityheaders.com)
- [ ] **Scan de vulnerabilidades** com [observatory.mozilla.org](https://observatory.mozilla.org)
- [ ] **Teste de login** e autenticação
- [ ] **Teste de 2FA**
- [ ] **Teste de CSRF** protection
- [ ] **Verificar logs** funcionando
- [ ] **Teste de backup** e restore
- [ ] **Teste de alertas** (Sentry/email)
- [ ] **Documentar** credenciais em gestor de senhas

### Manutenção Regular

- [ ] **Semanal**: Revisar logs de auditoria
- [ ] **Semanal**: Checar alerts do Dependabot
- [ ] **Mensal**: Testar restore de backup
- [ ] **Mensal**: Revisar permissões de usuários
- [ ] **Trimestral**: Audit de segurança completo
- [ ] **Anual**: Renovar certificados SSL (se manual)
- [ ] **Anual**: Revisar políticas de retenção de dados

---

## 📚 Referências

### Padrões de Segurança
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [CWE Top 25](https://cwe.mitre.org/top25/)

### Ferramentas de Teste
- [OWASP ZAP](https://www.zaproxy.org/) - Scanner de vulnerabilidades
- [Burp Suite](https://portswigger.net/burp) - Proxy para testes
- [Security Headers](https://securityheaders.com/) - Teste de headers
- [SSL Labs](https://www.ssllabs.com/ssltest/) - Teste de SSL/TLS
- [Mozilla Observatory](https://observatory.mozilla.org/) - Scan geral

### Compliance
- [LGPD](https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd)
- [GDPR](https://gdpr.eu/)

---

## 🆘 Suporte

Em caso de vulnerabilidade encontrada:
- **NÃO** abra issue público
- Envie e-mail para: security@seu-dominio.com
- Descreva a vulnerabilidade em detalhes
- Aguarde resposta em 48h

---

**Última atualização:** 16/02/2026  
**Versão:** 1.0.0  
**Status:** ✅ Pronto para produção

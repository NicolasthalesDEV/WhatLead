# 📊 Guia de Monitoramento - WhatLead CRM

Este guia explica como monitorar a saúde, performance e erros do WhatLead CRM em produção.

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Logging Estruturado](#logging-estruturado)
- [Health Checks](#health-checks)
- [Error Tracking](#error-tracking)
- [Performance Monitoring](#performance-monitoring)
- [Métricas e Alertas](#métricas-e-alertas)
- [Dashboard de Monitoramento](#dashboard-de-monitoramento)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O WhatLead implementa monitoramento em múltiplas camadas:

- 📝 **Structured Logging** - Logs estruturados com Pino
- 🏥 **Health Checks** - Endpoints `/health`, `/health/ready`, `/health/live`
- 🐛 **Error Tracking** - Integração com Sentry (opcional)
- ⚡ **Performance Monitoring** - APM e métricas de performance
- 📊 **Business Metrics** - Dashboards customizados

---

## 📝 Logging Estruturado

### Setup

O WhatLead usa **Pino** para logging estruturado de alta performance.

#### 1. Instalar Dependências

```bash
# Na raiz do projeto
pnpm install
```

O pacote `@whatlead/logger` já está configurado.

#### 2. Configurar Nível de Log

```env
# .env
LOG_LEVEL=info  # debug | info | warn | error
```

### Uso Básico

```typescript
import { logger } from '@whatlead/logger';

// Log simples
logger.info('Server started');
logger.error('Failed to connect to database');

// Log com contexto estruturado
logger.info({ userId: 123, action: 'login' }, 'User logged in');

// Log de erro com stack trace
try {
  throw new Error('Something went wrong');
} catch (error) {
  logger.error({ error }, 'Operation failed');
}
```

### Funções Especializadas

#### HTTP Requests/Responses

```typescript
import { logRequest, logResponse } from '@whatlead/logger';

// Log request
logRequest({
  method: 'POST',
  url: '/api/orders',
  headers: req.headers,
  userId: session.userId,
});

// Log response
const start = Date.now();
// ... process request ...
logResponse({
  statusCode: 200,
  duration: Date.now() - start,
  url: req.url,
});
```

#### Database Queries

```typescript
import { logQuery } from '@whatlead/logger';

const start = Date.now();
const orders = await db.order.findMany();
logQuery({
  operation: 'findMany',
  model: 'Order',
  duration: Date.now() - start,
});
```

#### External API Calls

```typescript
import { logExternalCall } from '@whatlead/logger';

const start = Date.now();
try {
  const response = await fetch('https://api.whatsapp.com/...');
  logExternalCall({
    service: 'WhatsApp',
    endpoint: '/messages',
    method: 'POST',
    duration: Date.now() - start,
    statusCode: response.status,
  });
} catch (error) {
  logExternalCall({
    service: 'WhatsApp',
    endpoint: '/messages',
    method: 'POST',
    duration: Date.now() - start,
    error,
  });
}
```

#### Business Events

```typescript
import { logEvent } from '@whatlead/logger';

// Log business-critical events
logEvent({
  name: 'order_created',
  userId: user.id,
  companyId: user.companyId,
  metadata: {
    orderId: order.id,
    total: order.total,
    paymentMethod: 'pix',
  },
});

logEvent({
  name: 'payment_received',
  companyId: order.companyId,
  metadata: {
    orderId: order.id,
    amount: payment.amount,
  },
});
```

#### Security Events

```typescript
import { logSecurityEvent } from '@whatlead/logger';

// Login attempts
logSecurityEvent({
  type: 'login_attempt',
  userId: user.id,
  ip: req.ip,
  userAgent: req.headers['user-agent'],
});

// Suspicious activity
logSecurityEvent({
  type: 'suspicious_activity',
  userId: user.id,
  metadata: {
    reason: 'too_many_requests',
    count: attemptCount,
  },
});
```

### Logger com Contexto

```typescript
import { createLogger } from '@whatlead/logger';

// Crie logger com contexto fixo
const authLogger = createLogger({ module: 'auth' });
authLogger.info('User logged in');
authLogger.error('Invalid credentials');

// Logger por request
export function createRequestLogger(req: NextRequest) {
  return createLogger({
    requestId: crypto.randomUUID(),
    userId: req.userId,
    companyId: req.companyId,
  });
}
```

### Visualizar Logs

#### Desenvolvimento

Logs são automaticamente formatados com `pino-pretty`:

```bash
pnpm dev
```

Output:
```
[10:30:45] INFO: User logged in
  userId: 123
  action: "login"
```

#### Produção

Em produção, logs são em formato JSON para fácil parsing:

```json
{
  "level": 30,
  "time": "2026-02-16T10:30:45.123Z",
  "env": "production",
  "service": "whatlead-crm",
  "userId": 123,
  "action": "login",
  "msg": "User logged in"
}
```

### Coletar e Analisar Logs

#### Com Docker

```bash
# Ver logs do container
docker logs -f whatlead-web

# Salvar logs em arquivo
docker logs whatlead-web > logs.txt
```

#### Com PM2

```bash
# Ver logs em tempo real
pm2 logs whatlead

# Logs de erro apenas
pm2 logs whatlead --err

# Últimas 100 linhas
pm2 logs whatlead --lines 100
```

#### Centralização com ELK Stack

```yaml
# docker-compose.yml
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
    ports:
      - "9200:9200"

  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
```

#### Com Datadog

```bash
# Instale Datadog agent
DD_API_KEY=<your-key> DD_SITE="datadoghq.com" bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_script.sh)"

# Configure log collection
# /etc/datadog-agent/conf.d/nodejs.d/conf.yaml
logs:
  - type: file
    path: /var/log/whatlead/*.log
    service: whatlead-crm
    source: nodejs
```

---

## 🏥 Health Checks

### Endpoints Disponíveis

O WhatLead fornece 3 endpoints de health check:

#### 1. Health Check Geral

**GET** `/api/health`

Verifica saúde geral da aplicação:
- API status
- Database connectivity
- Uptime
- Version info

```bash
curl http://localhost:3000/api/health
```

**Resposta (200 OK):**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "environment": "production",
  "timestamp": "2026-02-16T10:30:45.123Z",
  "checks": {
    "api": {
      "status": "healthy",
      "timestamp": "2026-02-16T10:30:45.123Z"
    },
    "database": {
      "status": "healthy",
      "latency": 0
    },
    "uptime": {
      "seconds": 3600
    }
  }
}
```

**Resposta (503 Unhealthy):**
```json
{
  "status": "unhealthy",
  "checks": {
    "database": {
      "status": "unhealthy",
      "error": "Connection refused"
    }
  }
}
```

#### 2. Readiness Check

**GET** `/api/health/ready`

Indica se a aplicação está **pronta** para receber tráfego.
Usado por load balancers (ALB, Nginx, Kubernetes).

```bash
curl http://localhost:3000/api/health/ready
```

**200** = Ready to serve traffic  
**503** = Not ready (warming up)

#### 3. Liveness Check

**GET** `/api/health/live`

Indica se a aplicação está **viva** e funcionando.
Usado por orchestrators para detectar deadlocks.

```bash
curl http://localhost:3000/api/health/live
```

**200** = Application alive  
**500** = Application dead (restart needed)

### Configurar Load Balancer

#### AWS Application Load Balancer

```hcl
# Terraform
resource "aws_lb_target_group" "whatlead" {
  health_check {
    enabled             = true
    path                = "/api/health"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    matcher             = "200"
  }
}
```

#### Nginx

```nginx
upstream whatlead {
  server localhost:3000;
  
  # Health check (requires ngx_http_upstream_hc_module)
  check interval=3000 rise=2 fall=3 timeout=1000 type=http;
  check_http_send "GET /api/health HTTP/1.0\r\n\r\n";
  check_http_expect_alive http_2xx;
}
```

#### Kubernetes

```yaml
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: whatlead
    image: whatlead:latest
    livenessProbe:
      httpGet:
        path: /api/health/live
        port: 3000
      initialDelaySeconds: 30
      periodSeconds: 10
    readinessProbe:
      httpGet:
        path: /api/health/ready
        port: 3000
      initialDelaySeconds: 5
      periodSeconds: 5
```

### Monitoramento Automático

#### UptimeRobot (Gratuito)

1. Acesse [uptimerobot.com](https://uptimerobot.com)
2. Adicione novo monitor:
   - Type: HTTP(s)
   - URL: `https://seu-dominio.com/api/health`
   - Interval: 5 minutes
3. Configure alertas (email, Slack, Discord)

#### Pingdom

```bash
# Via API
curl -X POST https://api.pingdom.com/api/3.1/checks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "WhatLead Health",
    "host": "seu-dominio.com",
    "type": "http",
    "url": "/api/health"
  }'
```

---

## 🐛 Error Tracking

### Setup Sentry (Recomendado)

O WhatLead tem suporte built-in para Sentry.

#### 1. Criar Conta Sentry

1. Acesse [sentry.io](https://sentry.io)
2. Crie novo projeto → Next.js
3. Copie o **DSN**

#### 2. Instalar Sentry

```bash
# Na pasta apps/web
cd apps/web
pnpm add @sentry/nextjs

# Executar wizard (configura automaticamente)
npx @sentry/wizard -i nextjs
```

#### 3. Configurar Variáveis

```env
# .env.local
SENTRY_DSN=https://xxxxx@o123456.ingest.sentry.io/123456
SENTRY_AUTH_TOKEN=your-auth-token
```

#### 4. Descomentar Código

Edite [apps/web/src/lib/monitoring/sentry.ts](../apps/web/src/lib/monitoring/sentry.ts) e descomente o código Sentry.

#### 5. Inicializar no App

```typescript
// apps/web/src/app/layout.tsx
import { initSentry } from '@/lib/monitoring/sentry';

// Initialize once
if (typeof window === 'undefined') {
  initSentry();
}
```

### Uso do Error Tracking

```typescript
import { captureError, captureMessage, setUser } from '@/lib/monitoring/sentry';

// Após login, identifique o usuário
setUser({
  id: user.id,
  email: user.email,
  username: user.name,
});

// Capture erros
try {
  await processPayment(order);
} catch (error) {
  captureError(error, {
    orderId: order.id,
    userId: user.id,
    paymentMethod: 'pix',
  });
  throw error;
}

// Capture mensagens importantes
captureMessage('Payment processing started', 'info');
captureMessage('Database migration needed', 'warning');
```

### Configurar Alertas

No dashboard do Sentry:

1. **Alerts** → **Create Alert**
2. Configure regras:
   - "When an issue is first seen"
   - "When error rate increases by 50%"
   - "When new release has >10 errors"
3. Configure notificações:
   - Email
   - Slack
   - Discord
   - PagerDuty

---

## ⚡ Performance Monitoring

### Sentry Performance

Com Sentry instalado, você obtém APM automático:

```typescript
import { startTransaction } from '@/lib/monitoring/sentry';

// Medir performance de operação
const transaction = startTransaction('process_order', 'task');

try {
  await processOrder(order);
  transaction?.setStatus('ok');
} catch (error) {
  transaction?.setStatus('internal_error');
  throw error;
} finally {
  transaction?.finish();
}
```

### Métricas Customizadas

```typescript
// apps/web/src/lib/monitoring/metrics.ts
export class Metrics {
  static async trackDatabaseQuery(model: string, operation: string, fn: () => Promise<any>) {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      
      logQuery({ model, operation, duration });
      
      // Alerta se query lenta
      if (duration > 1000) {
        captureMessage(`Slow query: ${model}.${operation} took ${duration}ms`, 'warning');
      }
      
      return result;
    } catch (error) {
      captureError(error, { model, operation });
      throw error;
    }
  }
  
  static async trackExternalCall(service: string, fn: () => Promise<any>) {
    const start = Date.now();
    try {
      const result = await fn();
      logExternalCall({
        service,
        endpoint: 'N/A',
        method: 'N/A',
        duration: Date.now() - start,
      });
      return result;
    } catch (error) {
      logExternalCall({
        service,
        endpoint: 'N/A',
        method: 'N/A',
        duration: Date.now() - start,
        error,
      });
      throw error;
    }
  }
}

// Uso
const orders = await Metrics.trackDatabaseQuery('Order', 'findMany', () =>
  db.order.findMany()
);
```

### Web Vitals

Next.js coleta Web Vitals automaticamente:

```typescript
// apps/web/src/app/layout.tsx
export function reportWebVitals(metric: any) {
  if (metric.label === 'web-vital') {
    logEvent({
      name: 'web_vital',
      metadata: {
        name: metric.name, // CLS, FID, FCP, LCP, TTFB
        value: metric.value,
        rating: metric.rating, // good | needs-improvement | poor
      },
    });
  }
}
```

---

## 📊 Métricas e Alertas

### Métricas Importantes

#### Aplicação
- **Request Rate** - Requests por segundo
- **Response Time** - P50, P95, P99
- **Error Rate** - % de erros
- **Availability** - Uptime %

#### Negócio
- **Orders Created** - Pedidos criados/hora
- **Payment Success Rate** - % de pagamentos bem-sucedidos
- **WhatsApp Response Time** - Tempo médio de resposta
- **Customer Satisfaction** - NPS médio

#### Infraestrutura
- **CPU Usage** - % de uso
- **Memory Usage** - MB usados
- **Database Connections** - Pool size
- **Disk Usage** - GB disponíveis

### Implementar Métricas

```typescript
// apps/web/src/lib/monitoring/metrics.ts
export const metrics = {
  ordersCreated: 0,
  paymentsProcessed: 0,
  whatsappMessagesSent: 0,
  
  increment(metric: string) {
    (this as any)[metric]++;
  },
  
  getAll() {
    return {
      ordersCreated: this.ordersCreated,
      paymentsProcessed: this.paymentsProcessed,
      whatsappMessagesSent: this.whatsappMessagesSent,
    };
  },
};

// Endpoint para expor métricas
// apps/web/src/app/api/metrics/route.ts
export async function GET() {
  return NextResponse.json(metrics.getAll());
}
```

### Alertas com Webhook

```typescript
// apps/web/src/lib/monitoring/alerts.ts
export async function sendAlert(message: string, severity: 'info' | 'warning' | 'error') {
  const webhookUrl = process.env.ALERT_WEBHOOK_URL;
  
  if (!webhookUrl) return;
  
  // Slack
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `[${severity.toUpperCase()}] ${message}`,
      attachments: [{
        color: severity === 'error' ? 'danger' : severity === 'warning' ? 'warning' : 'good',
        fields: [
          { title: 'Environment', value: process.env.NODE_ENV },
          { title: 'Timestamp', value: new Date().toISOString() },
        ],
      }],
    }),
  });
}

// Uso
if (errorRate > 0.05) {
  sendAlert('Error rate above 5%!', 'error');
}
```

---

## 📈 Dashboard de Monitoramento

### Grafana + Prometheus

```yaml
# docker-compose.yml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'whatlead'
    static_configs:
      - targets: ['host.docker.internal:3000']
    metrics_path: '/api/metrics'
    scrape_interval: 15s
```

### Datadog Dashboard

```bash
# Instalar integration
DD_API_KEY=<key> DD_SITE="datadoghq.com" \
  bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_script.sh)"
```

Dashboards pré-configurados:
- Next.js Performance
- Database Query Performance
- Error Tracking
- API Response Times

---

## 🔍 Troubleshooting

### Logs Não Aparecem

**Problema:** Nenhum log sendo gerado

**Soluções:**
```bash
# Verificar nível de log
echo $LOG_LEVEL

# Deve ser debug, info, warn, ou error
export LOG_LEVEL=info

# Verificar se logger está importado
grep -r "from '@whatlead/logger'" apps/web/src
```

### Health Check Retorna 503

**Problema:** `/api/health` retorna unhealthy

**Soluções:**
```bash
# Verificar database
docker ps | grep postgres
docker logs postgres-container

# Testar conexão direta
psql $DATABASE_URL -c "SELECT 1"

# Verificar variáveis de ambiente
echo $DATABASE_URL
```

### Sentry Não Captura Erros

**Problema:** Erros não aparecem no Sentry

**Soluções:**
```bash
# Verificar DSN
echo $SENTRY_DSN

# Testar manualmente
curl -X POST https://sentry.io/api/xxx/store/ \
  -H "X-Sentry-Auth: Sentry sentry_key=xxx" \
  -d '{"message":"test"}'

# Verificar se está habilitado em produção
# Sentry só envia erros em NODE_ENV=production
```

### Performance Degradada

**Problema:** Response time alto

**Diagnóstico:**
```typescript
// Adicionar logging de performance
const start = Date.now();
const result = await operation();
const duration = Date.now() - start;

if (duration > 1000) {
  logger.warn({ duration, operation: 'name' }, 'Slow operation');
}
```

**Soluções:**
- Verifique slow queries no database
- Adicione índices necessários
- Implemente caching (Redis)
- Profile com Sentry Performance
- Otimize N+1 queries

---

## 📚 Recursos Adicionais

- [Pino Documentation](https://getpino.io)
- [Sentry Next.js Guide](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Datadog APM](https://docs.datadoghq.com/tracing/)

---

**Última atualização:** 16/02/2026  
**Versão:** 1.0.0

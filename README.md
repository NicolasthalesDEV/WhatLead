# 🚀 WhatLead CRM

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.2-2D3748)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

**Plataforma CRM completa para gestão de vendas via WhatsApp com foco em automação, conversão e análise de métricas.**

WhatLead é uma solução moderna e escalável para empresas que vendem pelo WhatsApp. Gerencie clientes, pedidos, pagamentos PIX, funil de vendas, chatbot, tickets de suporte e muito mais - tudo em uma plataforma integrada.
> ⚡ **[QUICK START →](QUICKSTART.md)** - Deploy em 10 minutos (Vercel + Neon gratuito)
> > � **[STATUS DO PROJETO →](STATUS.md)** - O que está pronto, o que falta configurar
> 
> 🚀 **[GUIA DE DEPLOY →](DEPLOYMENT.md)** - Como colocar em produção (passo a passo completo)
> 
> ⚙️ **[CONFIGURAÇÃO →](ENV_SETUP.md)** - Checklist de variáveis de ambiente
> 
> 🔌 **[INTEGRAÇÕES →](INTEGRATIONS.md)** - APIs necessárias (WhatsApp, PIX, Redis)

---

## ✨ Principais Features

### 💬 WhatsApp Integrado
- **Inbox em tempo real** - Chat completo com polling automático
- **Cloud API** - Integração oficial Facebook/Meta (10+ tipos de mensagem)
- **Chatbot inteligente** - Automação com triggers e fluxos customizáveis
- **Respostas rápidas** - Agilize o atendimento
- **Status de leitura** - Visualize sent/delivered/read
- **Upload/download de mídias** - Imagens, vídeos, documentos

### 💰 Pagamentos PIX
- **Multi-gateway** - Mercado Pago, Asaas, ou modo Fake para testes
- **QR Code dinâmico** - Geração automática por pedido
- **Pix Copy & Paste** - Código copia e cola
- **Webhook automático** - Confirmação instantânea de pagamento
- **Atualização de status** - Ordem atualizada automaticamente

### 📊 Gestão Completa
- **CRM Robusto** - Clientes, produtos, orçamentos, pedidos
- **Funil Kanban** - Drag-and-drop visual para gestão de leads
- **NPS Integrado** - Pesquisas automáticas pós-venda via WhatsApp
- **Tickets de Suporte** - Sistema completo de atendimento
- **Relatórios** - Métricas de conversão, vendas e NPS

### 🤖 Automação
- **Chatbot Engine** - Fluxos com múltiplas etapas
- **Triggers** - Palavras-chave, horário, status do lead
- **Webhooks Outbound** - Integre com sistemas externos
- **Respostas automáticas** - Configure mensagens de ausência

### 🔐 Segurança & Controle
- **Autenticação JWT** - Access + refresh tokens
- **2FA (TOTP)** - Autenticação de dois fatores
- **RBAC** - 4 roles + 42 permissões granulares
- **Multi-tenant** - Isole dados por empresa
- **Auditoria** - Logs completos de todas as ações
- **CSRF Protection** - Proteção contra ataques

### 🔔 Notificações em Tempo Real
- **SSE Stream** - Server-Sent Events para updates instantâneos
- **Bell icon** - Badge com contador de não lidas
- **Centro de notificações** - Histórico completo
- **Preferências** - Configure quais notificações receber

### 🔍 Busca Global
- **Pesquisa unificada** - Clientes, produtos, pedidos, mensagens
- **Atalho de teclado** - Cmd/Ctrl + K
- **Debouncing** - Resultados em tempo real
- **Filtros** - Por tipo, data, status

---

## 🚀 Quick Start

### Pré-requisitos

- **Node.js** 18.17+ ou 20+
- **pnpm** 8+ (`npm install -g pnpm`)
- **PostgreSQL** 14+ ou Docker
- **Git**

### Instalação (5 minutos)

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/WhatLead.git
cd WhatLead

# 2. Instale as dependências
pnpm install

# 3. Configure o ambiente
cp .env.example .env
# Edite .env com suas credenciais

# 4. Inicie o banco de dados (Docker)
docker-compose up -d

# 5. Execute migrations e seed
pnpm db:migrate:dev
pnpm db:seed

# 6. Inicie o servidor
pnpm dev
```

**Acesse:** http://localhost:3000

**Login de teste:**
```
Email: admin@example.com
Senha: Admin123!
```

📖 **Guia completo:** [docs/INSTALL.md](docs/INSTALL.md)

---

## 📦 Estrutura do Projeto

```
WhatLead/                      # Monorepo Turborepo
├── apps/
│   ├── web/                   # Aplicação Next.js principal
│   │   ├── src/
│   │   │   ├── app/           # App Router (Pages + API Routes)
│   │   │   ├── components/    # Componentes React
│   │   │   ├── hooks/         # Custom Hooks
│   │   │   └── lib/           # Utilitários e bibliotecas
│   │   └── public/            # Assets estáticos
│   └── worker/                # Background jobs (estrutura)
│
├── packages/
│   └── db/                    # Package compartilhado
│       ├── prisma/
│       │   ├── schema.prisma  # Schema do banco (20+ models)
│       │   └── migrations/    # Migrações
│       └── src/               # Prisma Client export
│
├── docs/                      # Documentação completa
│   ├── ARCHITECTURE.md        # Arquitetura detalhada
│   ├── INSTALL.md             # Guia de instalação
│   ├── CONTRIBUTING.md        # Guia de contribuição
│   ├── PERFORMANCE.md         # Otimizações
│   ├── WHATSAPP_SETUP.md      # Setup WhatsApp API
│   ├── PIX_SETUP.md           # Setup gateways PIX
│   └── CHANGELOG.md           # Histórico de versões
│
├── infra/                     # Infraestrutura
│   └── docker-compose.yml     # PostgreSQL local
│
├── scripts/                   # Scripts auxiliares
│   ├── dev.seed.ts            # Seed de dados
│   └── setup.sh               # Setup automático
│
├── package.json               # Root package
├── pnpm-workspace.yaml        # Workspaces config
├── turbo.json                 # Turborepo config
└── tsconfig.base.json         # TypeScript base config
```

---

## 🛠️ Stack Tecnológico

### Frontend
- **Next.js 15** - App Router, Server Components, API Routes
- **React 19** - Biblioteca de UI
- **TypeScript 5.7** - Tipagem estática
- **Tailwind CSS** - Estilização utility-first
- **Shadcn/ui** - Componentes acessíveis
- **Lucide React** - Ícones SVG

### Backend
- **Next.js API Routes** - Backend serverless
- **Prisma 6.2** - ORM para PostgreSQL
- **Zod** - Validação de schemas
- **bcryptjs** - Hash de senhas
- **jsonwebtoken** - Autenticação JWT

### Database
- **PostgreSQL 14+** - Banco relacional
- **Prisma Migrations** - Versionamento do schema

### Integrações
- **WhatsApp Cloud API** - Mensagens (Facebook/Meta)
- **Mercado Pago** - Gateway PIX
- **Asaas** - Gateway PIX alternativo
- **Puppeteer** - Geração de PDFs

### DevOps
- **Turborepo** - Build system
- **pnpm** - Package manager
- **Docker** - PostgreSQL para dev
- **ESLint + Prettier** - Code quality

---

## 📚 Documentação

### 🚀 Guias de Início Rápido

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - **Guia Completo de Deploy** (passo a passo para colocar em produção)
- **[ENV_SETUP.md](ENV_SETUP.md)** - **Checklist de Configuração** (todas as variáveis de ambiente)
- **[INTEGRATIONS.md](INTEGRATIONS.md)** - **APIs e Integrações** (WhatsApp, PIX, Redis, SMTP)

### 📖 Documentação Técnica Completa

- �📐 **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Arquitetura detalhada (estrutura, tecnologias, fluxos)
- 🚀 **[INSTALL.md](docs/INSTALL.md)** - Instalação passo a passo (dev e produção)
- 🤝 **[CONTRIBUTING.md](docs/CONTRIBUTING.md)** - Como contribuir (código de conduta, workflow, padrões)
- ⚡ **[PERFORMANCE.md](docs/PERFORMANCE.md)** - Guia de otimização (Prisma, React, cache)
- 💬 **[WHATSAPP_SETUP.md](docs/WHATSAPP_SETUP.md)** - Configuração do WhatsApp Cloud API
- 💰 **[PIX_SETUP.md](docs/PIX_SETUP.md)** - Configuração dos gateways PIX
- 📝 **[CHANGELOG.md](docs/CHANGELOG.md)** - Histórico de versões

**Total:** 3500+ linhas de documentação

---

## 🎯 Casos de Uso

### 1. Venda via WhatsApp
```
1. Cliente envia mensagem → WhatsApp Inbox
2. Vendedor cria orçamento → Envia por WhatsApp
3. Cliente aceita → Converte para pedido
4. Gera cobrança PIX → Cliente paga
5. Webhook confirma → Pedido atualizado
6. Dispara NPS → Cliente avalia
```

### 2. Automação de Atendimento
```
1. Cliente: "Quero comprar"
2. Chatbot reconhece trigger
3. Executa fluxo → Envia catálogo
4. Cria lead no funil → Atribui vendedor
5. Notifica vendedor → Assume conversa
```

### 3. Gestão de Suporte
```
1. Cliente relata problema
2. Sistema cria ticket automaticamente
3. Atribui para equipe de suporte
4. Suporte responde via inbox
5. Resolve e fecha ticket
6. Cliente recebe NPS
```

---

## 🔧 Comandos Úteis

### Desenvolvimento
```bash
# Inicia dev server
pnpm dev

# Abre Prisma Studio (GUI do banco)
pnpm db:studio

# Cria nova migration
pnpm db:migrate:dev --name description

# Reseta banco e aplica seed
pnpm db:reset

# Checa erros TypeScript
pnpm typecheck

# Roda linter
pnpm lint
```

### Produção
```bash
# Build otimizado
pnpm build

# Inicia servidor
pnpm start

# Deploy migrations
pnpm db:migrate:deploy
```

---

## 🌐 Deploy

### Vercel (Recomendado)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

1. Conecte seu repositório
2. Configure variáveis de ambiente
3. Deploy automático

### Outras Plataformas

- **Railway** - Database + app incluídos
- **AWS / Digital Ocean** - VPS customizado
- **Heroku** - Dyno + Postgres addon

📖 **Guia completo:** [docs/INSTALL.md#deploy-em-plataformas](docs/INSTALL.md)

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, leia nosso [Guia de Contribuição](docs/CONTRIBUTING.md) antes de abrir PRs.

### Como Contribuir

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'feat: Add AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

**Código de Conduta:** Seja respeitoso e construtivo.

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 🚧 Status do Projeto

### ✅ v1.0.0 - MVP Completo (Pronto para Produção)

**🎉 Funcionalidades Implementadas: 20/20 grupos (100%)**

✅ **100% das features do produto** implementadas  
✅ **Testes completos** com Vitest + Playwright  
✅ **CI/CD completo** com GitHub Actions  
✅ **Monitoramento e observabilidade** configurado  
✅ **Performance otimizada** com índices compostos  
✅ **Documentação completa** (6500+ linhas em 11 guias)  
✅ **Segurança hardened** (headers, 2FA, RBAC, backup)  

**O projeto está 100% pronto para produção!** 🚀

---

## 🙏 Agradecimentos

- [Next.js](https://nextjs.org/) - Framework React
- [Prisma](https://www.prisma.io/) - ORM moderno
- [Shadcn/ui](https://ui.shadcn.com/) - Componentes UI
- [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api) - Integração WhatsApp
- [Mercado Pago](https://www.mercadopago.com.br/developers) - Gateway PIX

---

## 📞 Suporte

- **Documentação:** Confira os arquivos em `/docs`
- **Issues:** [GitHub Issues](https://github.com/seu-usuario/WhatLead/issues)
- **Discussões:** [GitHub Discussions](https://github.com/seu-usuario/WhatLead/discussions)

---

**Feito com ❤️ pela comunidade WhatLead**

---

<p align="center">
  <sub>⭐ Se este projeto foi útil, considere dar uma estrela!</sub>
</p>

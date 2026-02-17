# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

### 🎯 Em Progresso
- Testes unitários e E2E
- CI/CD pipeline
- Sistema de monitoramento avançado
- Compliance LGPD/GDPR

---

## [1.0.0] - 2026-02-16

### 🎉 Release Inicial - MVP Completo

Primeira versão estável do WhatLead CRM com todas as funcionalidades core implementadas.

### ✨ Features

#### Autenticação e Autorização
- Login/registro de usuários com JWT
- Autenticação de dois fatores (2FA/TOTP)
- Recuperação de senha via e-mail
- Verificação de e-mail
- Gestão de múltiplas sessões
- Logs de auditoria
- RBAC com 4 roles: OWNER, ADMIN, SELLER, SUPPORT
- Sistema de permissões granulares (42+ permissões)
- Proteção CSRF
- Rate limiting em rotas sensíveis

#### WhatsApp Cloud API
- Integração completa com Facebook/Meta Graph API v18.0
- Cliente WhatsApp com 10+ tipos de mensagem:
  - Texto
  - Imagem
  - Vídeo
  - Documento
  - Template messages
  - Interactive buttons
  - Interactive lists
  - Location
  - Contacts
  - Reações
- Webhook para receber mensagens e atualizações de status
- Download e upload de mídias
- Normalização de números de telefone
- Suporte multi-tenant (múltiplos canais)

#### Inbox/Chat WhatsApp
- Interface de chat em tempo real
- Lista de conversas com filtros e busca
- Envio de mensagens de texto e mídia
- Respostas rápidas personalizáveis
- Indicadores de mensagens não lidas
- Polling automático (3-5s) para novas mensagens
- Visualização de status de entrega (sent/delivered/read)
- Upload de imagens, vídeos e documentos
- Download de mídias recebidas
- Layout responsivo de 2 colunas

#### Gestão de Clientes
- CRUD completo de clientes
- Campos: nome, email, telefone, documento (CPF/CNPJ)
- Tags personalizadas
- Histórico de interações
- Integração com WhatsApp (link direto para conversa)
- Busca e filtros avançados
- Importação em lote (futuro)

#### Gestão de Produtos
- CRUD completo de produtos
- Catálogo de produtos
- Múltiplos preços por produto
- Imagens de produtos
- Estoque (opcional)
- Categorização
- SKU/código de barras
- Status (ativo/inativo)

#### Orçamentos (Quotes)
- Criação de orçamentos
- Adicionar múltiplos produtos
- Cálculo automático de totais
- Envio por WhatsApp
- Conversão para pedido
- Gestão de validade
- Status (rascunho, enviado, aceito, recusado, expirado)

#### Pedidos (Orders)
- CRUD completo de pedidos
- Múltiplos itens por pedido
- Cálculo de totais e descontos
- Histórico de mudanças de status
- Statuses: pending, paid, processing, shipped, delivered, cancelled
- Geração de PDF
- Envio de confirmação por WhatsApp
- Integração com pagamentos PIX

#### Pagamentos PIX
- Gateway multi-provider (strategy pattern):
  - Mercado Pago
  - Asaas
  - Fake (para testes)
- Geração de QR Code PIX
- PIX Copy & Paste (copia e cola)
- Webhook para confirmação automática
- Atualização automática de status do pedido
- Suporte a split de pagamento (futuro)
- Refund/estorno (futuro)

#### Funil de Vendas (Kanban)
- Interface drag-and-drop
- Estágios customizáveis
- Cards de leads/oportunidades
- Filtros por vendedor, data, valor
- Métricas de conversão
- Histórico de movimentações
- Atribuição de responsáveis
- Campos personalizados

#### Sistema de NPS
- Criação de pesquisas NPS
- Envio automático pós-pedido (X dias após entrega)
- Envio manual por WhatsApp
- Coleta de respostas (0-10 + comentário)
- Classificação automática (Promotor/Neutro/Detrator)
- Dashboard de análise:
  - Score NPS
  - Distribuição de respostas
  - Gráficos de tendência
  - Análise de sentimento
  - Word cloud dos comentários (futuro)
- Filtros por período e produto

#### Chatbot/Automação
- Engine de chatbot com fluxos customizáveis
- Triggers baseados em:
  - Palavras-chave
  - Horário
  - Dia da semana
  - Status do lead
- Ações automáticas:
  - Enviar mensagem
  - Criar lead no funil
  - Atribuir vendedor
  - Adicionar tag
  - Criar notificação
- Fluxos com múltiplas etapas
- Respostas rápidas compartilhadas
- Modo "fora do expediente"

#### Tickets de Suporte
- Sistema de tickets
- Prioridades (baixa, média, alta, urgente)
- Status (aberto, em andamento, aguardando, resolvido, fechado)
- Atribuição de responsáveis
- Comentários internos
- Histórico completo
- SLA tracking (futuro)
- Integração com WhatsApp

#### Webhooks Outbound
- Configuração de endpoints externos
- Eventos disponíveis:
  - order.created
  - order.paid
  - order.cancelled
  - customer.created
  - message.received
- Retry automático (até 5 tentativas)
- Logs de entregas
- Headers customizados
- Autenticação (Basic, Bearer)

#### Notificações em Tempo Real
- SSE (Server-Sent Events) para notificações
- Bell icon com badge de não lidas
- Tipos de notificação:
  - Nova mensagem WhatsApp
  - Pedido pago
  - Lead movido no funil
  - Ticket atribuído
  - Sistema (avisos gerais)
- Preferências configuráveis
- Marcar como lida individual/lote
- Centro de notificações com histórico

#### Busca Global
- Busca unificada no header
- Tipos de busca:
  - Clientes (nome, email, telefone, documento)
  - Produtos (nome, SKU, descrição)
  - Pedidos (número, status)
  - Mensagens WhatsApp (conteúdo)
- Debouncing (300ms)
- Resultados em tempo real
- Navegação rápida via teclado (Cmd/Ctrl + K)
- Limite de resultados por tipo

#### Relatórios e Métricas
- Dashboard principal com cards de KPIs:
  - Total de vendas do mês
  - Taxa de conversão
  - Tempo médio de resposta WhatsApp
  - NPS Score
  - Tickets abertos
- Relatório de conversão do funil
- Análise de vendas por período
- Métricas diárias armazenadas (para histórico)
- Exportação para CSV (futuro)
- Gráficos interativos (futuro)

#### Configurações da Empresa
- Dados da empresa
- Logo
- Cores da marca
- Configurações de WhatsApp
- Configurações de PIX
- Horário de atendimento
- Mensagens automáticas
- Regras de negócio

#### Perfil do Usuário
- Editar dados pessoais
- Upload de avatar
- Alterar senha
- Configurar 2FA
- Gerenciar sessões ativas
- Visualizar logs de auditoria pessoais

#### Quick Actions
- Ações rápidas acessíveis de qualquer página:
  - Criar novo cliente
  - Criar novo pedido
  - Enviar mensagem WhatsApp
  - Criar ticket
  - Criar lead no funil

### 🚀 Performance

#### Database Optimizations
- 10+ composite indexes adicionados:
  - WhatsMessage: 3 indexes (inbox queries)
  - Order: 2 indexes (dashboard filters)
  - FunnelCard: 3 indexes (drag-drop, filters)
  - Notification: 1 index (unread filtering)
  - AuditLog: 2 indexes (dashboard filters)
- SELECT otimizado em todas as queries (apenas campos necessários)
- Eager loading estratégico com includes
- Paginação em todas as listagens

#### React/Next.js Optimizations
- Server Components por padrão (Next.js 15)
- Client Components apenas quando necessário
- Dynamic imports para componentes pesados
- Image optimization (next/image)
- Lazy loading de tabs e modais
- Debouncing em buscas e autocompletes

### 📚 Documentação

#### Guias Completos
- **ARCHITECTURE.md** - Arquitetura detalhada do sistema (estrutura, tecnologias, fluxos)
- **INSTALL.md** - Guia de instalação passo a passo (dev e produção)
- **CONTRIBUTING.md** - Guia de contribuição (código de conduta, workflow, padrões)
- **PERFORMANCE.md** - Guia de otimização (Prisma, React, cache, build)
- **WHATSAPP_SETUP.md** - Setup do WhatsApp Cloud API
- **PIX_SETUP.md** - Setup dos gateways PIX
- **CHANGELOG.md** - Este arquivo

#### README Atualizado
- Badges de status
- Features destacadas
- Quick start
- Links para documentação
- Screenshots (futuro)

### 🛠️ Infraestrutura

#### Monorepo Setup
- Turborepo configurado
- pnpm workspaces
- Packages compartilhados:
  - `@wacrm/db` - Prisma + schemas
- Apps:
  - `web` - Next.js app principal
  - `worker` - Background jobs (estrutura criada)

#### Database
- PostgreSQL 14+
- Prisma ORM 5+
- 20+ models
- Migrations organizadas
- Seed script com dados de exemplo

#### DevOps
- Docker Compose para desenvolvimento
- Scripts de setup (`setup.sh`)
- Comandos pnpm organizados
- ESLint + Prettier configurados
- TypeScript strict mode
- VS Code settings e extensions recomendadas

### 🐛 Bug Fixes
- Corrigidas 34+ issues de TypeScript após implementação inicial
- Imports do package `@wacrm/db` corrigidos em 10+ arquivos
- Assinaturas de funções WhatsApp ajustadas para multi-tenant
- Tipos explícitos adicionados onde faltavam
- Queries do Prisma otimizadas (price → prices)
- Duplicação de variáveis resolvida
- Download de mídia WhatsApp corrigido

### 🔒 Security

#### Implementado
- CSRF protection em rotas sensíveis
- JWT com expiration curta (1h) + refresh tokens
- Bcrypt para hash de senhas (10 rounds)
- 2FA com TOTP
- Rate limiting básico
- Sanitização de inputs (Zod)
- Validação server-side em todas as APIs
- RBAC com permissões granulares
- SQL injection protection (Prisma ORM)
- XSS protection (React escaping)

#### Pendente
- CSP (Content Security Policy) headers
- HSTS headers
- Rate limiting avançado com Redis
- IP whitelist para webhooks
- Encryption at rest para dados sensíveis
- Security audits regulares

### ⚠️ Known Issues

Nenhum issue crítico conhecido. Projeto estável para produção.

### 📦 Dependencies

#### Main Dependencies
- **next**: 15.1.0
- **react**: 19.0.0
- **prisma**: 6.2.1
- **typescript**: 5.7.2
- **tailwindcss**: 3.4.17
- **zod**: 3.24.1
- **bcryptjs**: 2.4.3
- **jsonwebtoken**: 9.0.2
- **date-fns**: 4.1.0

#### Dev Dependencies
- **@types/node**: 22.10.2
- **@types/react**: 19.0.6
- **eslint**: 9.18.0
- **prettier**: 3.4.2
- **turbo**: 2.3.3

### 🔄 Migration Guide

Não aplicável - primeira release.

---

## Tipos de Mudanças

- **✨ Added** - Novas features
- **🔄 Changed** - Mudanças em funcionalidades existentes
- **🗑️ Deprecated** - Features que serão removidas
- **🐛 Fixed** - Bug fixes
- **🔒 Security** - Correções de segurança
- **🚀 Performance** - Melhorias de performance
- **📚 Docs** - Mudanças na documentação

---

## Semantic Versioning

- **MAJOR** (X.0.0) - Mudanças incompatíveis na API
- **MINOR** (1.X.0) - Novas funcionalidades compatíveis
- **PATCH** (1.0.X) - Bug fixes compatíveis

---

## Links

- [Repositório](https://github.com/seu-usuario/WhatLead)
- [Issues](https://github.com/seu-usuario/WhatLead/issues)
- [Pull Requests](https://github.com/seu-usuario/WhatLead/pulls)
- [Discussions](https://github.com/seu-usuario/WhatLead/discussions)

---

**Mantido por:** Equipe WhatLead  
**Última atualização:** 16/02/2026

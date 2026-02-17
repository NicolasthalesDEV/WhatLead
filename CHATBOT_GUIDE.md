# 🤖 Guia do Chatbot - WhatLead CRM

O chatbot do WhatLead está 100% funcional e integrado com o WhatsApp!

---

## ✅ O que está funcionando:

### 1. **Engine Completo**
- ✅ Execução de fluxos
- ✅ Processamento de mensagens
- ✅ Avaliação de condições
- ✅ Envio de mensagens automáticas
- ✅ Criação de pedidos via chatbot
- ✅ Criação de orçamentos via chatbot
- ✅ Atualização de dados do cliente
- ✅ Transferência para atendente humano
- ✅ Chamadas de API externa
- ✅ Delays programados
- ✅ Salvar variáveis
- ✅ Atribuir tags

### 2. **Sistema de Triggers**
- ✅ Trigger por palavra-chave
- ✅ Trigger quando nova mensagem chegar
- ✅ Trigger quando novo cliente for criado
- ✅ Trigger quando pedido for criado
- ✅ Trigger quando pagamento for confirmado
- ✅ Trigger por inatividade do cliente
- ✅ Trigger baseado em tempo
- ✅ Trigger por estágio do funil
- ✅ Trigger personalizado

### 3. **Database**
- ✅ ChatbotFlow - Fluxos de conversa
- ✅ ChatbotNode - Nós dos fluxos
- ✅ ChatbotExecution - Histórico de execuções
- ✅ ChatbotTrigger - Configuração de triggers
- ✅ ChatbotAnalytics - Métricas de performance
- ✅ QuickResponse - Respostas rápidas

### 4. **Integração WhatsApp**
- ✅ Recebe mensagens do cliente
- ✅ Identifica palavras-chave
- ✅ Inicia fluxo automaticamente
- ✅ Mantém contexto da conversa
- ✅ Retoma fluxo quando cliente responder
- ✅ Envia mensagens automáticas

---

## 🚀 Como usar:

### 1️⃣ Criar um fluxo de chatbot

Acesse: `/dashboard/chatbot`

**Via API:**
```bash
POST /api/chatbot/flows
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
  "name": "Boas-vindas",
  "description": "Mensagem automática para novos clientes",
  "triggers": ["oi", "olá", "hello"],
  "priority": 10
}
```

### 2️⃣ Adicionar nós ao fluxo

```bash
POST /api/chatbot/flows/{flowId}/nodes
Content-Type: application/json

{
  "nodes": [
    {
      "id": "node-1",
      "type": "TRIGGER",
      "name": "Início",
      "config": {},
      "position": { "x": 100, "y": 100 },
      "connections": [{ "targetNodeId": "node-2" }]
    },
    {
      "id": "node-2",
      "type": "MESSAGE",
      "name": "Saudação",
      "config": {
        "message": "Olá! Bem-vindo ao WhatLead 👋\n\nComo posso ajudar você hoje?"
      },
      "position": { "x": 100, "y": 200 },
      "connections": [{ "targetNodeId": "node-3" }]
    },
    {
      "id": "node-3",
      "type": "WAIT_INPUT",
      "name": "Aguardar resposta",
      "config": {},
      "position": { "x": 100, "y": 300 },
      "connections": [{ "targetNodeId": "node-4" }]
    }
  ]
}
```

### 3️⃣ Ativar o fluxo

```bash
PATCH /api/chatbot/flows/{flowId}

{
  "status": "ACTIVE"
}
```

---

## 📊 Tipos de Nós disponíveis:

### **TRIGGER** - Início do fluxo
```json
{
  "type": "TRIGGER",
  "config": {}
}
```

### **MESSAGE** - Enviar mensagem
```json
{
  "type": "MESSAGE",
  "config": {
    "message": "Olá {{customerName}}! Seu pedido está pronto."
  }
}
```

### **WAIT_INPUT** - Aguardar resposta do cliente
```json
{
  "type": "WAIT_INPUT",
  "config": {}
}
```

### **CONDITION** - Avaliar condição
```json
{
  "type": "CONDITION",
  "config": {
    "condition": "lastInput contains sim"
  },
  "connections": [
    { "targetNodeId": "node-yes", "condition": "true" },
    { "targetNodeId": "node-no", "condition": "false" }
  ]
}
```

### **ACTION** - Executar ação
```json
{
  "type": "ACTION",
  "config": {
    "action": "save_variable",
    "variable": "customerEmail"
  }
}
```

Ações disponíveis:
- `save_variable` - Salva a última entrada do usuário
- `create_quote` - Cria orçamento
- `create_order` - Cria pedido
- `update_customer` - Atualiza dados do cliente

### **DELAY** - Aguardar tempo
```json
{
  "type": "DELAY",
  "config": {
    "delay": 3000
  }
}
```

### **JUMP_TO_FLOW** - Pular para outro fluxo
```json
{
  "type": "JUMP_TO_FLOW",
  "config": {
    "flowId": "outro-fluxo-id"
  }
}
```

### **API_CALL** - Chamar API externa
```json
{
  "type": "API_CALL",
  "config": {
    "apiUrl": "https://api.example.com/data",
    "apiMethod": "GET"
  }
}
```

### **ASSIGN_TAGS** - Atribuir tags ao cliente
```json
{
  "type": "ASSIGN_TAGS",
  "config": {
    "tags": ["vip", "interessado"]
  }
}
```

### **HANDOFF** - Transferir para humano
```json
{
  "type": "HANDOFF",
  "config": {}
}
```

---

## 🎯 Exemplos práticos:

### Exemplo 1: Fluxo de Boas-vindas

```
TRIGGER → MESSAGE ("Olá!") → WAIT_INPUT → MESSAGE ("Obrigado!")
```

### Exemplo 2: Qualificação de Lead

```
TRIGGER 
  → MESSAGE ("Você é pessoa física ou jurídica?")
  → WAIT_INPUT
  → CONDITION
      → SE "física" → ASSIGN_TAGS [pf] → MESSAGE ("Ótimo!")
      → SE "jurídica" → ASSIGN_TAGS [pj] → MESSAGE ("Perfeito!")
```

### Exemplo 3: Criar Pedido Automático

```
TRIGGER
  → MESSAGE ("Qual produto deseja?")
  → WAIT_INPUT
  → ACTION (save_variable: productName)
  → MESSAGE ("Quantos?")
  → WAIT_INPUT
  → ACTION (save_variable: quantity)
  → ACTION (create_order)
  → MESSAGE ("Pedido criado! Seu número: {{orderId}}")
```

---

## 🔧 Configurar Triggers:

### Trigger por Palavra-chave

```bash
POST /api/chatbot/triggers

{
  "flowId": "flow-123",
  "name": "Trigger de vendas",
  "type": "KEYWORD",
  "conditions": {
    "keywords": ["preço", "valor", "quanto custa"]
  },
  "enabled": true,
  "priority": 10
}
```

### Trigger de Novo Cliente

```bash
POST /api/chatbot/triggers

{
  "flowId": "flow-welcome",
  "name": "Boas-vindas automático",
  "type": "NEW_CUSTOMER",
  "enabled": true,
  "priority": 15
}
```

### Trigger de Pedido Criado

```bash
POST /api/chatbot/triggers

{
  "flowId": "flow-order-confirmation",
  "name": "Confirmação de pedido",
  "type": "ORDER_CREATED",
  "enabled": true,
  "priority": 10
}
```

### Trigger de Pagamento Confirmado

```bash
POST /api/chatbot/triggers

{
  "flowId": "flow-thanks",
  "name": "Agradecimento pós-pagamento",
  "type": "ORDER_PAID",
  "enabled": true,
  "priority": 10
}
```

---

## 📊 Analytics:

O sistema automaticamente rastreia:
- Número de fluxos executados
- Número de fluxos completados
- Número de fluxos que falharam
- Tempo médio de execução
- Pedidos criados via chatbot
- Orçamentos criados via chatbot

Acesse: `/api/chatbot/analytics`

---

## 🧪 Testar o Chatbot:

### 1. Via WhatsApp (Produção):
1. Salve o número do WhatsApp Business
2. Envie uma mensagem com palavra-chave configurada
3. O chatbot responderá automaticamente

### 2. Via API (Desenvolvimento):
```bash
# Simular chegada de mensagem
POST /api/webhooks/whatsapp
Content-Type: application/json

{
  "entry": [{
    "changes": [{
      "value": {
        "contacts": [{
          "profile": { "name": "João" },
          "wa_id": "5511999998888"
        }],
        "messages": [{
          "id": "msg-123",
          "from": "5511999998888",
          "type": "text",
          "text": { "body": "oi" }
        }]
      }
    }]
  }]
}
```

---

## 💡 Dicas:

1. **Use variáveis** para personalizar mensagens: `{{customerName}}`, `{{orderId}}`
2. **Configure prioridades** nos triggers para controlar ordem de execução
3. **Use delays** para tornar conversas mais naturais
4. **Teste fluxos** antes de ativar em produção
5. **Monitore analytics** para otimizar seus fluxos
6. **Use HANDOFF** quando precisar transferir para humano

---

## 🎉 Próximos passos:

1. ✅ Crie seu primeiro fluxo de boas-vindas
2. ✅ Configure triggers por palavra-chave
3. ✅ Teste com cliente real
4. ✅ Monitore analytics
5. ✅ Crie fluxos avançados (pedidos, orçamentos)

**O chatbot está 100% funcional e pronto para uso em produção!** 🚀

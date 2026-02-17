# 🎨 Chatbot Personalizável - Guia Completo

O chatbot do WhatLead agora é **100% personalizável pelos usuários** sem necessidade de código!

---

## ✅ O que foi implementado:

### 1. **Sistema de Templates** 📋

7 templates prontos para usar:

| Template | Descrição | Categoria | Trigger |
|----------|-----------|-----------|---------|
| 👋 Boas-vindas | Saudação automática | Atendimento | oi, olá |
| 🎯 Qualificação de Lead | Coleta dados do cliente | Vendas | qualificação |
| 📦 Consulta de Pedido | Status de pedidos | Atendimento | pedido, status |
| 🛍️ Catálogo de Produtos | Mostra produtos | Vendas | produtos, catálogo |
| 🔧 Suporte Técnico | Triagem de problemas | Suporte | problema, erro |
| ⭐ Pesquisa NPS | Coleta feedback | Pesquisa | (após pagamento) |
| 🛒 Recuperação de Carrinho | Lembra carrinho abandonado | Vendas | (evento customizado) |

**Como usar:**
```bash
# Listar templates
GET /api/chatbot/templates

# Criar fluxo a partir de template
POST /api/chatbot/templates
{
  "templateId": "welcome",
  "name": "Meu Fluxo de Boas-vindas"
}
```

---

### 2. **Gerenciamento de Triggers** ⚡

Tipos de triggers disponíveis:
- **KEYWORD** - Por palavra-chave
- **NEW_CUSTOMER** - Novo cliente criado
- **ORDER_CREATED** - Pedido criado
- **ORDER_PAID** - Pagamento confirmado
- **MESSAGE_RECEIVED** - Qualquer mensagem
- **IDLE_CUSTOMER** - Cliente inativo
- **TIME_BASED** - Baseado em horário
- **FUNNEL_STAGE** - Mudança de estágio
- **CUSTOM_EVENT** - Evento personalizado

**APIs:**
```bash
# Listar triggers
GET /api/chatbot/triggers

# Criar trigger
POST /api/chatbot/triggers
{
  "name": "Trigger de vendas",
  "type": "KEYWORD",
  "flowId": "flow-123",
  "conditions": {
    "keywords": ["preço", "valor"]
  },
  "priority": 10,
  "enabled": true
}

# Atualizar trigger
PUT /api/chatbot/triggers
{
  "id": "trigger-123",
  "enabled": false
}

# Deletar trigger
DELETE /api/chatbot/triggers?id=trigger-123
```

---

### 3. **Editor Visual Melhorado** 🎨

Componentes disponíveis no editor:

| Tipo | Nome | Descrição |
|------|------|-----------|
| 🚀 TRIGGER | Início | Ponto de entrada do fluxo |
| 💬 MESSAGE | Mensagem | Envia mensagem ao cliente |
| ❓ QUESTION | Pergunta | Faz pergunta e salva resposta |
| 🔀 CONDITION | Condição | Avalia condição e ramifica |
| ⚙️ ACTION | Ação | Executa ação (salvar, criar pedido, etc) |
| ⏱️ DELAY | Delay | Aguarda tempo específico |
| 🏷️ ASSIGN_TAGS | Tags | Atribui tags ao cliente |
| 🔗 JUMP_TO_FLOW | Pular | Vai para outro fluxo |
| 📡 API_CALL | API Externa | Chama API externa |
| 👤 HANDOFF | Transferir | Passa para atendente humano |
| ⏹️ END_FLOW | Fim | Finaliza fluxo |

**Configuração de cada nó:**

#### MESSAGE - Mensagem
```json
{
  "type": "MESSAGE",
  "config": {
    "message": "Olá {{customerName}}! Como posso ajudar?"
  }
}
```
Suporta variáveis: `{{customerName}}`, `{{orderId}}`, `{{customVariable}}`

#### QUESTION - Pergunta
```json
{
  "type": "QUESTION",
  "config": {
    "message": "Qual é o seu nome?",
    "variable": "customerName"
  }
}
```
Salva resposta na variável especificada.

#### CONDITION - Condição
```json
{
  "type": "CONDITION",
  "config": {
    "condition": "lastInput contains sim"
  }
}
```
Condições suportadas:
- `lastInput contains texto`
- `variable == valor`
- `variable > 10`

#### ACTION - Ação
```json
{
  "type": "ACTION",
  "config": {
    "action": "create_order",
    "variable": "orderData"
  }
}
```
Ações disponíveis:
- `save_variable` - Salva variável
- `create_quote` - Cria orçamento
- `create_order` - Cria pedido
- `update_customer` - Atualiza cliente

#### DELAY - Aguardar
```json
{
  "type": "DELAY",
  "config": {
    "delay": 5000
  }
}
```
Delay em milissegundos (1000 = 1 segundo)

#### ASSIGN_TAGS - Tags
```json
{
  "type": "ASSIGN_TAGS",
  "config": {
    "tags": ["vip", "interessado"]
  }
}
```

#### API_CALL - API Externa
```json
{
  "type": "API_CALL",
  "config": {
    "apiUrl": "https://api.example.com/data",
    "apiMethod": "POST",
    "apiBody": {
      "customerId": "{{customerId}}"
    }
  }
}
```
Resultado fica em `{{apiResponse}}`

---

### 4. **Testador de Fluxos** 🧪

Teste fluxos antes de ativar!

```bash
POST /api/chatbot/test
{
  "flowId": "flow-123",
  "userMessage": "oi"
}

# Resposta
{
  "flowId": "flow-123",
  "userMessage": "oi",
  "botResponses": [
    {
      "nodeId": "node-1",
      "type": "MESSAGE",
      "content": "Olá! Bem-vindo!",
      "timestamp": "2026-02-17T20:00:00Z"
    }
  ],
  "status": "success",
  "executionTime": 245
}
```

---

### 5. **Importar/Exportar Fluxos** 📥📤

#### Exportar fluxo:
```bash
POST /api/chatbot/export
{
  "flowId": "flow-123"
}

# Resposta - arquivo JSON
{
  "version": "1.0",
  "exportedAt": "2026-02-17T20:00:00Z",
  "flow": {
    "name": "Boas-vindas",
    "description": "Fluxo de saudação",
    "triggerType": "KEYWORD",
    "triggerKeywords": ["oi", "olá"],
    "nodes": [...]
  }
}
```

#### Importar fluxo:
```bash
POST /api/chatbot/import
{
  "flowData": {
    "flow": {
      "name": "Fluxo Importado",
      "nodes": [...]
    }
  }
}
```

---

## 🎯 Como usar (Passo a passo):

### **Opção 1: Usar Template** (Mais rápido)

1. Acesse `/dashboard/chatbot`
2. Clique em "Novo Fluxo" → "Usar Template"
3. Escolha um template
4. Personalize as mensagens
5. Clique em "Salvar"
6. Ative o fluxo

### **Opção 2: Criar do Zero**

1. Acesse `/dashboard/chatbot`
2. Clique em "Novo Fluxo"
3. Dê um nome
4. Adicione componentes arrastando da biblioteca
5. Configure cada nó
6. Conecte os nós
7. Configure triggers
8. Teste o fluxo
9. Ative

---

## 📋 Interface do Dashboard:

### **Aba "Fluxos"**
- Lista todos os fluxos
- Status (Ativo/Pausado/Rascunho)
- Estatísticas (execuções, taxa de sucesso)
- Ações rápidas (Editar, Pausar, Deletar)

### **Aba "Templates"**
- Galeria visual com 7 templates
- Filtro por categoria
- Preview do fluxo
- Criar com 1 clique

### **Aba "Triggers"**
- Lista todos os triggers
- Criar/editar/deletar triggers
- Configurar condições
- Definir prioridade
- Ativar/desativar

### **Aba "Editor"**
- Biblioteca de componentes
- Canvas drag-and-drop
- Configuração de nós
- Visualização em fluxo
- Salvar/testar/publicar

### **Aba "Analytics"**
- Fluxos executados
- Taxa de conclusão
- Tempo médio
- Pedidos criados
- Gráficos em tempo real

---

## 🎨 Personalização Total:

### **Mensagens:**
- Texto livre
- Emojis
- Variáveis dinâmicas
- Formatação (negrito, itálico)
- Links
- Multi-linha

### **Condições:**
- Lógica customizada
- Comparações (==, !=, >, <)
- Contém texto
- Regex (avançado)

### **Ações:**
- Criar pedidos/orçamentos
- Atualizar clientes
- Chamar APIs externas
- Salvar variáveis
- Atribuir tags
- Enviar webhooks

### **Triggers:**
- Palavras-chave customizadas
- Eventos de sistema
- Horários específicos
- Condições complexas
- Priorização

---

## 💡 Exemplos Práticos:

### Exemplo 1: Fluxo de Vendas Personalizado
```
1. Cliente envia "preço"
2. Bot pergunta "Qual produto te interessa?"
3. Cliente responde
4. Bot busca preço na API externa
5. Bot mostra preço e desconto
6. Bot pergunta "Deseja comprar?"
7. Se sim → Cria pedido
8. Se não → Salva lead e agenda follow-up
```

### Exemplo 2: Suporte Automatizado
```
1. Cliente envia "problema"
2. Bot pergunta tipo de problema (múltipla escolha)
3. Bot coleta detalhes
4. Bot cria ticket
5. Bot envia número do ticket
6. Bot agenda notificação para equipe
```

### Exemplo 3: Follow-up Pós-vendas
```
Trigger: ORDER_PAID
1. Aguarda 7 dias
2. Bot envia "Como foi sua experiência?"
3. Coleta feedback (NPS)
4. Se nota < 7 → Transfere para gerente
5. Se nota >= 9 → Solicita avaliação pública
```

---

## 🚀 Recursos Avançados:

### **Variáveis Globais:**
- `{{customerName}}` - Nome do cliente
- `{{customerEmail}}` - Email
- `{{customerPhone}}` - Telefone
- `{{orderId}}` - Último pedido
- `{{orderTotal}}` - Valor do pedido
- `{{companyName}}` - Nome da empresa

### **Variáveis Customizadas:**
Salve qualquer dado:
```
ACTION → save_variable → "cor_preferida"
Depois use: {{cor_preferida}}
```

### **Condições Avançadas:**
```javascript
// Múltiplas condições
lastInput contains "sim" OR lastInput contains "yes"

// Comparação numérica
{{orderTotal}} > 1000

// Verificar variável
{{customerType}} == "vip"
```

### **Integração com APIs:**
```json
{
  "type": "API_CALL",
  "config": {
    "apiUrl": "https://api.example.com/check-stock",
    "apiMethod": "POST",
    "apiBody": {
      "productId": "{{productId}}"
    },
    "responseVariable": "stockData"
  }
}
```
Depois acesse: `{{stockData.quantity}}`

---

## 📊 Monitoramento:

### **Métricas automáticas:**
- Total de execuções
- Taxa de conclusão
- Taxa de abandono
- Tempo médio de conversação
- Conversões (pedidos/leads)
- Satisfação (NPS automático)

### **Logs detalhados:**
- Histórico de execuções
- Mensagens trocadas
- Decisões tomadas
- Erros encontrados
- Performance de cada nó

---

## 🎉 Resultado:

**Agora os usuários podem:**
- ✅ Criar fluxos sem código
- ✅ Usar templates prontos
- ✅ Personalizar completamente
- ✅ Testar antes de ativar
- ✅ Importar/exportar fluxos
- ✅ Monitorar performance
- ✅ Iterar e melhorar

**O chatbot é 100% personalizável visualmente!** 🚀

---

## 📖 Próximos passos recomendados:

1. ✅ Acesse o dashboard de chatbot
2. ✅ Crie seu primeiro fluxo usando um template
3. ✅ Personalize as mensagens com seu tom de voz
4. ✅ Configure triggers específicos
5. ✅ Teste o fluxo
6. ✅ Ative e monitore
7. ✅ Itere baseado em analytics

**Documentação adicional:**
- [CHATBOT_GUIDE.md](./CHATBOT_GUIDE.md) - Guia técnico completo
- [API Reference](./docs/API.md) - Todas as APIs disponíveis

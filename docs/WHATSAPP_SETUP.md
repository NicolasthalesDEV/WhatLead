# 📱 Guia de Configuração - WhatsApp Cloud API

Este guia mostra como configurar a integração com WhatsApp Cloud API para o WhatLead.

---

## 📋 Pré-requisitos

1. **Conta Facebook Business** - [Criar conta](https://business.facebook.com/)
2. **WhatsApp Business Account** - Vinculado à conta Business
3. **Número de telefone** - Para usar com WhatsApp Business (não pode estar em uso em outro WhatsApp)

---

## 🚀 Passo a Passo

### 1. Criar App no Meta for Developers

1. Acesse [Meta for Developers](https://developers.facebook.com/apps)
2. Clique em **"Criar App"**
3. Selecione o tipo **"Business"**
4. Preencha:
   - **Nome do app**: WhatLead (ou nome da sua empresa)
   - **Email de contato**: seu email
   - **Conta do Business Manager**: selecione sua conta
5. Clique em **"Criar app"**

### 2. Adicionar Produto WhatsApp

1. No dashboard do app, encontre **"WhatsApp"** nos produtos
2. Clique em **"Configurar"**
3. Siga o assistente de configuração

### 3. Configurar Número de Telefone

#### Opção A: Usar Número de Teste (Desenvolvimento)
- O Meta fornece um número de teste gratuito
- Pode enviar mensagens apenas para 5 números cadastrados
- Válido por tempo limitado

#### Opção B: Adicionar Número Real (Produção)
1. Vá em **WhatsApp > API Setup > Phone Numbers**
2. Clique em **"Add phone number"**
3. Insira seu número de telefone
4. Verifique via SMS/chamada
5. **IMPORTANTE**: Este número não pode estar em uso no WhatsApp normal

### 4. Obter Credenciais

#### 4.1. Phone Number ID

1. Vá em **WhatsApp > API Setup**
2. Copie o **Phone Number ID** (número longo, ex: `123456789012345`)
3. Este é o `WA_PHONE_NUMBER_ID`

#### 4.2. Token de Acesso Temporário (Desenvolvimento)

1. Em **WhatsApp > API Setup**, copie o **Temporary Access Token**
2. Válido por 24 horas
3. Use apenas para testes iniciais

#### 4.3. Token de Acesso Permanente (Produção)

**Método 1: Via System User (Recomendado)**

1. Vá em [Business Settings](https://business.facebook.com/settings)
2. Clique em **"Users" > "System Users"**
3. Clique em **"Add"** para criar um novo System User
4. Nome: `WhatLead Server` (ou similar)
5. Role: **Admin**
6. Clique em **"Add Assets"**
7. Selecione **"Apps"** e adicione seu app
8. Selecione **"Full Control"**
9. Clique em **"Generate New Token"**
10. Selecione o app
11. Selecione permissões:
    - `whatsapp_business_management`
    - `whatsapp_business_messaging`
12. Copie o token gerado
13. Este é o `WA_ACCESS_TOKEN`

**Método 2: Via Graph API Explorer (Alternativa)**

1. Acesse [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Selecione seu app
3. Em "User or Page", selecione "Get Token" > "Get System User Access Token"
4. Selecione as permissões necessárias
5. Copie o token

#### 4.4. Business Account ID (Opcional)

1. Em **WhatsApp > API Setup**, procure por **WhatsApp Business Account ID**
2. Este é o `WA_BUSINESS_ACCOUNT_ID`

### 5. Configurar Webhook

O webhook é necessário para receber mensagens dos clientes.

1. Vá em **WhatsApp > Configuration > Webhook**
2. Clique em **"Edit"**
3. Preencha:
   - **Callback URL**: `https://seu-dominio.com/api/webhooks/whatsapp`
   - **Verify Token**: qualquer string segura (ex: `meutoken123`)
     - Este será o `WA_VERIFY_TOKEN`
4. Clique em **"Verify and Save"**

**IMPORTANTE**: 
- A URL precisa ser HTTPS (não funciona com HTTP)
- O servidor precisa estar rodando e acessível
- Para desenvolvimento local, use [ngrok](https://ngrok.com/) ou similar

#### Usando ngrok para Desenvolvimento

```bash
# Instale ngrok
npm install -g ngrok

# Inicie o túnel (assumindo que sua app roda na porta 3000)
ngrok http 3000

# Use a URL gerada (ex: https://abc123.ngrok.io)
# Webhook URL: https://abc123.ngrok.io/api/webhooks/whatsapp
```

5. **Subscrever campos do webhook**:
   - Marque a opção **"messages"** (obrigatório para receber mensagens)
   - Marque **"message_status"** (opcional, para status de entrega)

### 6. Configurar Variáveis de Ambiente

Edite o arquivo `.env` (ou `.env.local`) e adicione:

```bash
# WhatsApp Cloud API - PRODUÇÃO
WA_PHONE_NUMBER_ID=123456789012345
WA_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WA_VERIFY_TOKEN=meutoken123
WA_BUSINESS_ACCOUNT_ID=123456789012345
WA_API_VERSION=v18.0
```

---

## 🧪 Testando a Integração

### 1. Testar Envio de Mensagem

Você pode testar direto via API ou usar o playground do Meta:

**Via cURL:**

```bash
curl -X POST "https://graph.facebook.com/v18.0/SEU_PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "5511999999999",
    "type": "text",
    "text": {
      "body": "Olá! Esta é uma mensagem de teste."
    }
  }'
```

**Via código (WhatLead):**

```typescript
import { sendWhatsText } from '@/lib/wa/client';

// Enviar mensagem
const result = await sendWhatsText('5511999999999', 'Olá! Teste de integração.');
console.log('Message ID:', result.messages[0].id);
```

### 2. Testar Recebimento de Mensagem

1. Envie uma mensagem para o número do WhatsApp Business via app do WhatsApp
2. Verifique os logs do servidor:
   - Deve aparecer `WhatsApp Webhook: {...}`
   - A mensagem deve ser salva no banco de dados
   - O chatbot deve processar se houver flow configurado

### 3. Verificar Status de Mensagem

No banco de dados, tabela `Message`:
- `status`: `SENT`, `DELIVERED`, `READ`, `FAILED`
- `deliveredAt`: timestamp de entrega
- `readAt`: timestamp de leitura

---

## 📞 Números de Teste

Durante o desenvolvimento, você pode adicionar números de teste:

1. Vá em **WhatsApp > API Setup > Phone numbers**
2. Role até **"To"**
3. Clique em **"Manage phone number list"**
4. Adicione até 5 números de telefone para receber mensagens de teste

**Formato**: Inclua código do país (ex: `+55 11 99999-9999` para Brasil)

---

## 🔒 Segurança

### Proteger o Access Token

- **NUNCA** comite o token no Git
- Use variáveis de ambiente
- Rotacione tokens periodicamente
- Use System User tokens (não tokens de usuário pessoal)

### Validar Webhooks

O código já implementa validação automática:
- Compara `hub.verify_token` com `WA_VERIFY_TOKEN`
- Retorna o `challenge` apenas se válido

### Rate Limits

WhatsApp Cloud API tem limites:
- **Tier 1**: 1.000 conversas/dia (padrão)
- **Tier 2**: 10.000 conversas/dia (após aprovação)
- **Tier 3**: 100.000 conversas/dia (após aprovação)
- **Unlimited**: Sem limite (após aprovação e histórico)

Para aumentar o tier, envie mensagens com qualidade e sem reclamações.

---

## 📨 Tipos de Mensagens Suportadas

### ✅ Implementado

1. **Texto simples** - `sendWhatsText()`
2. **Imagem** - `sendWhatsImage()`
3. **Documento** - `sendWhatsDocument()`
4. **Vídeo** - `sendWhatsVideo()`
5. **Template** - `sendWhatsTemplate()`
6. **Marcar como lida** - `markMessageAsRead()`

### Recebimento

O webhook processa:
- Mensagens de texto
- Imagens (com caption)
- Documentos
- Áudios
- Vídeos
- Localização
- Contatos

---

## 🐛 Troubleshooting

### Erro: "Invalid phone number"

- Certifique-se de usar formato E.164 sem `+`: `5511999999999`
- Use a função `normalizePhoneNumber()` do cliente

### Erro: "Webhook verification failed"

- Verifique se `WA_VERIFY_TOKEN` está correto
- URL do webhook deve ser HTTPS
- Servidor deve estar acessível

### Erro: "(#100) The parameter messaging_product is required"

- Verifique se está usando a versão correta da API
- Atualize `WA_API_VERSION` se necessário

### Não recebo mensagens no webhook

1. Verifique se o webhook está configurado e verificado
2. Confirme que subscreveu o campo "messages"
3. Teste com ngrok para desenvolvimento local
4. Verifique logs do servidor

### Erro: "Invalid OAuth access token"

- Token expirado (se for temporário)
- Gere um token permanente via System User
- Verifique se o token tem as permissões corretas

---

## 📚 Documentação Oficial

- [WhatsApp Cloud API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Primeiros Passos](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)
- [Envio de Mensagens](https://developers.facebook.com/docs/whatsapp/cloud-api/messages/text-messages)
- [Webhooks](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/components)
- [Referência da API](https://developers.facebook.com/docs/whatsapp/cloud-api/reference)

---

## 💡 Dicas

1. **Comece com número de teste** - Use o número fornecido pelo Meta para desenvolvimento
2. **Use ngrok** - Facilita muito o desenvolvimento local com webhooks
3. **Monitore o dashboard** - O Meta fornece métricas de uso e qualidade
4. **Templates** - Mensagens proativas (fora da janela de 24h) requerem templates aprovados
5. **Qualidade** - Mantenha baixa taxa de bloqueio para aumentar limites

---

**Última atualização**: 16/02/2026

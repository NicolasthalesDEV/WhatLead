# 📱 Tutorial de Configuração do WhatsApp - WhatLead CRM

## 🎉 Para Novos Usuários

Quando você cria uma conta nova no WhatLead, dois tutoriais aparecem automaticamente:

### 1️⃣ Tour Interativo do Sistema (2 minutos)
- Apresentação de todas as funcionalidades
- Navegação guiada pelas principais áreas
- Destacado: Centro de mensagens WhatsApp

### 2️⃣ Wizard de Configuração do WhatsApp (15-20 minutos)
- Guia completo passo a passo
- 5 etapas simples e claras
- Como criar conta no Meta for Developers
- Como obter suas credenciais
- Como configurar no sistema
- Como enviar sua primeira mensagem

---

## 🚀 Como Acessar os Tutoriais

### Tour do Sistema
1. Clique no menu do usuário (canto superior direito)
2. Selecione **"Ver Tutorial Novamente"**

### Wizard do WhatsApp
1. Vá em **Configurações** (menu lateral)
2. Role até a seção **WhatsApp**
3. Clique em **"🚀 Abrir Guia de Configuração"**

---

## 📖 Guia Rápido: Configuração Manual

Se preferir configurar manualmente sem o wizard, siga estes passos:

### Passo 1: Meta for Developers
1. Acesse [developers.facebook.com](https://developers.facebook.com/apps)
2. Crie um app tipo "Business"
3. Adicione o produto WhatsApp

### Passo 2: Obter Credenciais
Você precisa de 3 informações:
- **Phone Number ID** (WA_PHONE_NUMBER_ID)
- **Access Token** (WA_ACCESS_TOKEN)
- **Business Account ID** (WA_BUSINESS_ACCOUNT_ID)

### Passo 3: Configurar no Sistema

#### Via Interface (Recomendado):
1. **Configurações** → **Integrações** → **WhatsApp**
2. Cole as credenciais nos campos
3. Clique em **Salvar**

#### Via Arquivo .env (Desenvolvimento):
```bash
WA_PHONE_NUMBER_ID=seu_phone_number_id
WA_ACCESS_TOKEN=seu_access_token
WA_BUSINESS_ACCOUNT_ID=seu_business_account_id
WA_VERIFY_TOKEN=qualquer_senha_segura
WA_API_VERSION=v18.0
```

### Passo 4: Testar
1. Vá em **WhatsApp** no menu
2. Crie um novo contato
3. Envie uma mensagem de teste

---

## 💬 Como Enviar Sua Primeira Mensagem

### Via Interface:

1. **WhatsApp** (menu lateral)
2. Clique em **"+ Novo Contato"**
3. Preencha:
   - Nome do contato
   - Número (formato: +5511999999999)
4. Clique em **Salvar**
5. Selecione o contato na lista
6. Digite sua mensagem
7. Clique em **Enviar** ou pressione Enter

### Tipos de mensagem suportados:
- ✅ Texto
- ✅ Imagens
- ✅ Vídeos
- ✅ Documentos (PDF, DOC, etc)
- ✅ Áudio
- ✅ Localização
- ✅ Contatos

---

## 🤖 Automatizar Conversas

Depois de configurar o WhatsApp, você pode:

### 1. Respostas Rápidas
**Configurações** → **Mensagens Automáticas**
- Configure mensagens de boas-vindas
- Mensagens fora do horário
- Mensagens de ausência

### 2. Chatbot Inteligente
**Chatbot** (menu lateral)
- Crie fluxos de atendimento
- Configure perguntas frequentes
- Automatize respostas comuns
- Use templates prontos

### 3. Gatilhos Automáticos
- Enviar confirmação após pagamento
- Notificar sobre status de pedido
- Pesquisas de satisfação (NPS)
- Follow-up automático

---

## 🔧 Troubleshooting

### Problema: "Access token is required"
**Solução**: Verifique se o token foi copiado corretamente. Token temporário expira em 24h.

### Problema: "Phone number not found"
**Solução**: Certifique-se que copiou o Phone Number ID, não o número de telefone.

### Problema: "Unsupported get request"
**Solução**: Normal. A API do WhatsApp usa POST para mensagens, não GET.

### Problema: Mensagem não enviada
**Solução**: 
1. Verifique se o número está no formato E.164 (+5511999999999)
2. Certifique-se que o número está registrado como teste no Meta
3. Verifique se as credenciais estão corretas

---

## 📚 Documentação Completa

Para informações mais detalhadas, consulte:

- **[STATUS_INTEGRACOES.md](STATUS_INTEGRACOES.md)** - Status e testes completos
- **[docs/WHATSAPP_SETUP.md](docs/WHATSAPP_SETUP.md)** - Guia técnico detalhado
- **[INTEGRATIONS.md](INTEGRATIONS.md)** - Todas as integrações disponíveis

---

## 🆘 Precisa de Ajuda?

1. **Tutorial Interativo**: Use o wizard no sistema (mais fácil!)
2. **Documentação**: Consulte os arquivos .md listados acima
3. **Logs**: Verifique o console do navegador para erros
4. **Meta Developers**: [developers.facebook.com/docs/whatsapp](https://developers.facebook.com/docs/whatsapp)

---

## ✨ Recursos Avançados

Depois de configurado, explore:

- **Templates de Mensagem**: Crie templates para aprovação do WhatsApp
- **Webhooks**: Receba mensagens dos clientes automaticamente
- **API**: Integre com outros sistemas
- **Analytics**: Acompanhe métricas de conversas
- **Multi-atendente**: Adicione sua equipe

---

**🎯 Objetivo**: Que você consiga enviar sua primeira mensagem do WhatsApp em menos de 20 minutos!

**✅ Status Atual**: Tutorial automático ativo para todos os novos usuários.

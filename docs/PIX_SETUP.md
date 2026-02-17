# 💳 Guia de Configuração - Gateway de Pagamento PIX

Este guia mostra como configurar os gateways de pagamento PIX suportados pelo WhatLead.

---

## 🏦 Provedores Suportados

O WhatLead suporta os seguintes provedores de pagamento PIX:

1. **Fake** - Para desenvolvimento (não processa pagamentos reais)
2. **Mercado Pago** - Gateway mais popular do Brasil
3. **Asaas** - Solução completa para gestão financeira
4. **Efí** (ex-Gerencianet) - Integração direta com Banco Central
5. **Pagar.me** (em desenvolvimento)

---

## 🚀 Configuração Geral

### 1. Escolher Provedor

Defina a variável de ambiente `PSP_PROVIDER`:

```bash
# Desenvolvimento
PSP_PROVIDER=fake

# Produção - escolha um:
PSP_PROVIDER=mercadopago
PSP_PROVIDER=asaas
PSP_PROVIDER=efi
```

### 2. Configurar Webhook

Todos os provedores requerem configuração de webhook para receber notificações de pagamento:

**URL do Webhook**: `https://seu-dominio.com/api/webhooks/pix`

**IMPORTANTE**: 
- A URL deve ser HTTPS (não funciona com HTTP)
- O servidor deve estar acessível publicamente
- Para desenvolvimento local, use [ngrok](https://ngrok.com/)

---

## 💰 Mercado Pago

### Criar Conta

1. Acesse [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
2. Crie uma aplicação
3. Obtenha suas credenciais

### Obter Credenciais

1. Vá em **Suas integrações** > Sua aplicação
2. Copie:
   - **Access Token** (Produção)
   - **Public Key** (opcional, para frontend)

### Configurar Variáveis de Ambiente

```bash
PSP_PROVIDER=mercadopago
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxxx
MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxxxxxxxxxxx
```

### Configurar Webhook

1. Acesse [Integrações > Webhooks](https://www.mercadopago.com.br/developers/panel/webhooks)
2. Clique em **"Adicionar"**
3. Preencha:
   - **URL de produção**: `https://seu-dominio.com/api/webhooks/pix`
   - **Eventos**: Selecione `payment`
4. Salve

### Testar

```bash
curl -X POST "https://seu-dominio.com/api/orders/ORDER_ID/payments/pix" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Documentação Oficial

- [Mercado Pago - PIX](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-configuration/pix)
- [Webhooks](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks)

---

## 🔷 Asaas

### Criar Conta

1. Acesse [Asaas](https://www.asaas.com/)
2. Crie uma conta
3. Complete o cadastro da empresa

### Obter Credenciais

1. Acesse o [Painel Asaas](https://www.asaas.com/)
2. Vá em **Integrações** > **API**
3. Copie sua **API Key**

### Modo Sandbox (Desenvolvimento)

1. Acesse [Sandbox Asaas](https://sandbox.asaas.com/)
2. Crie uma conta de testes
3. Obtenha a API Key do sandbox

### Configurar Variáveis de Ambiente

```bash
PSP_PROVIDER=asaas

# Produção
ASAAS_API_KEY=$aact_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ASAAS_SANDBOX=false

# Sandbox (Desenvolvimento)
ASAAS_API_KEY=$aact_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ASAAS_SANDBOX=true
```

### Configurar Webhook

1. Acesse **Integrações** > **Webhooks**
2. Clique em **"Adicionar webhook"**
3. Preencha:
   - **URL de notificação**: `https://seu-dominio.com/api/webhooks/pix`
   - **Eventos**: Selecione `PAYMENT_RECEIVED` e `PAYMENT_CONFIRMED`
4. Salve

### Recursos Extras

O Asaas oferece funcionalidades adicionais:
- Gestão de clientes (criação automática)
- Boletos bancários
- Cartão de crédito
- Assinatura recorrente
- Split de pagamento

### Testar no Sandbox

O Asaas fornece um simulador de pagamentos no sandbox:

1. Crie uma cobrança PIX
2. Acesse [Simulador de Pagamentos](https://sandbox.asaas.com/simulador)
3. Informe o ID da cobrança
4. Clique em "Pagar"

### Documentação Oficial

- [Asaas - Documentação](https://docs.asaas.com/)
- [PIX](https://docs.asaas.com/reference/pix)
- [Webhooks](https://docs.asaas.com/reference/webhooks)

---

## 🟢 Efí (ex-Gerencianet)

### Criar Conta

1. Acesse [Efí](https://sejaefi.com.br/)
2. Crie uma conta empresarial
3. Complete o cadastro

### Obter Credenciais

1. Acesse o [Painel Efí](https://app.sejaefi.com.br/)
2. Vá em **API** > **Aplicações**
3. Crie uma nova aplicação
4. Copie:
   - **Client ID**
   - **Client Secret**
5. Baixe o **Certificado** (.p12)

### Configurar Variáveis de Ambiente

```bash
PSP_PROVIDER=efi
EFI_CLIENT_ID=Client_Id_xxxxx
EFI_CLIENT_SECRET=Client_Secret_xxxxx
EFI_CERTIFICATE_PATH=/path/to/certificate.p12
EFI_SANDBOX=false  # true para homologação
```

### Configurar Webhook

1. Acesse **API** > **Webhooks**
2. Configure:
   - **URL**: `https://seu-dominio.com/api/webhooks/pix`
   - **Chave PIX**: Sua chave PIX cadastrada

### Ambiente de Homologação

A Efí oferece um ambiente de testes:

```bash
EFI_SANDBOX=true
```

### Documentação Oficial

- [Efí - Documentação](https://dev.efipay.com.br/)
- [PIX](https://dev.efipay.com.br/docs/api-pix/pix-endpoints)
- [Webhooks](https://dev.efipay.com.br/docs/api-pix/webhooks)

**NOTA**: A implementação completa da Efí requer biblioteca adicional devido ao certificado. Em desenvolvimento.

---

## 🧪 Modo Fake (Desenvolvimento)

Para desenvolvimento local, use o provedor fake:

```bash
PSP_PROVIDER=fake
```

### Características

- ✅ Não requer credenciais
- ✅ Não processa pagamentos reais
- ✅ Gera QR Code visual (SVG)
- ✅ Retorna dados mockados

### Simular Pagamento

Como o provedor fake não processa pagamentos reais, você pode simular manualmente:

```bash
curl -X POST "https://seu-dominio.com/api/webhooks/pix" \
  -H "Content-Type: application/json" \
  -d '{
    "chargeId": "fake_1234567890_ORDER_ID",
    "status": "paid",
    "paidAt": "2026-02-16T10:30:00Z",
    "paidAmount": 10000
  }'
```

---

## 📊 Fluxo de Pagamento

### 1. Cliente faz pedido

```typescript
// Frontend cria o pedido
const order = await fetch('/api/orders', {
  method: 'POST',
  body: JSON.stringify({
    customerId: 'customer-id',
    items: [
      { productId: 'product-id', quantity: 2, unitPrice: 5000 }
    ]
  })
});
```

### 2. Gera cobrança PIX

```typescript
// Frontend solicita pagamento PIX
const payment = await fetch(`/api/orders/${orderId}/payments/pix`, {
  method: 'POST'
});

// Retorna:
// {
//   paymentId: "...",
//   chargeId: "...",
//   qrCodeImage: "data:image/png;base64,...",
//   copiaECola: "00020126580...",
//   expiresAt: "2026-02-16T10:45:00Z",
//   amount: 10000,
//   status: "pending"
// }
```

### 3. Cliente paga

O cliente escaneia o QR Code ou copia e cola o código PIX no app do banco.

### 4. Webhook notifica pagamento

O gateway envia uma notificação para `/api/webhooks/pix`:

```json
{
  "type": "payment.updated",
  "data": {
    "id": "charge-id"
  }
}
```

### 5. Sistema processa

1. Busca o pagamento no banco
2. Atualiza status para `PAID`
3. Atualiza pedido para `PAID`
4. Envia notificação para vendedor
5. (Opcional) Envia mensagem de confirmação via WhatsApp

### 6. Consultar status manualmente

```typescript
// Verificar status do pagamento
const status = await fetch(`/api/orders/${orderId}/payments/pix`);

// Retorna:
// {
//   paymentId: "...",
//   chargeId: "...",
//   status: "paid",
//   amount: 10000,
//   paidAt: "2026-02-16T10:30:00Z",
//   paidAmount: 10000
// }
```

---

## 🔒 Segurança

### Proteger Credenciais

- **NUNCA** comite tokens/keys no Git
- Use variáveis de ambiente
- Rotacione credenciais periodicamente
- Use secrets managers em produção (AWS Secrets Manager, Google Secret Manager, etc.)

### Validar Webhooks

Alguns provedores permitem validar assinatura do webhook:

**Mercado Pago**: Valide o header `x-signature`
**Asaas**: Valide o header `asaas-access-token`

```typescript
// Exemplo: validação Mercado Pago
const signature = req.headers.get('x-signature');
const validSignature = validateMercadoPagoSignature(body, signature);
if (!validSignature) {
  return new Response('Invalid signature', { status: 401 });
}
```

### Rate Limits

Respeite os limites de cada provedor:
- **Mercado Pago**: ~500 req/min por token
- **Asaas**: ~100 req/min
- **Efí**: ~60 req/min

---

## 🐛 Troubleshooting

### Erro: "Invalid credentials"

- Verifique se `PSP_PROVIDER` está correto
- Confirme que as credenciais estão corretas
- Verifique se está usando produção vs sandbox

### Webhook não recebe notificações

1. Confirme que a URL está correta e acessível
2. Verifique logs do servidor
3. Use ngrok para desenvolvimento local
4. Teste com webhook tester (ex: webhook.site)

### QR Code não gera

- Verifique se o valor é maior que zero
- Confirme que o provedor está configurado corretamente
- Veja logs para mensagens de erro específicas

### Pagamento não atualiza

1. Verifique se o webhook está configurado
2. Confirme que os eventos corretos estão subscritos
3. Veja logs do webhook no painel do provedor
4. Teste webhook manualmente com cURL

---

## 💡 Dicas

1. **Comece com Fake** - Desenvolva toda a lógica antes de integrar provedor real
2. **Use Sandbox** - Teste exaustivamente em ambiente de homologação
3. **Monitore Webhooks** - Configure alertas para falhas de webhook
4. **Taxas** - Compare taxas dos provedores antes de escolher
5. **SLA** - Considere SLA de cada provedor
6. **Suporte** - Avalie qualidade do suporte técnico

### Comparação Rápida

| Provedor | Taxa PIX | Taxa Boleto | Setup | Suporte |
|----------|----------|-------------|-------|---------|
| Mercado Pago | 0,99% | 3,49% | Fácil | Bom |
| Asaas | 0,69% | 1,99% | Médio | Ótimo |
| Efí | 0% * | 1,49% | Difícil | Bom |

\* Taxas podem variar conforme plano contratado

---

## 📚 Próximos Passos

- [ ] Implementar suporte a Pagar.me
- [ ] Adicionar validação de assinatura de webhooks
- [ ] Implementar reembolso/estorno
- [ ] Adicionar suporte a cartão de crédito
- [ ] Implementar split de pagamento (marketplace)

---

**Última atualização**: 16/02/2026

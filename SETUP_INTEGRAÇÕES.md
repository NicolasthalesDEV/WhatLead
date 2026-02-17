# 🚀 Setup de Integrações - Redis + PIX

**Tempo estimado: 20 minutos**

Este guia te leva passo a passo para configurar Redis (filas) e Gateway PIX (pagamentos reais).

---

## 1️⃣ Redis (Upstash) - 5 minutos ⚡

### O que o Redis faz no WhatLead?
- Processa envio em massa de mensagens no WhatsApp
- Gera relatórios pesados em background  
- Processa webhooks sem bloquear requisições

### Passo a passo:

#### 1. Criar conta grátis no Upstash
👉 Acesse: https://upstash.com

- Clique em **"Sign Up"**
- Use sua conta Google/GitHub ou email
- **Plano Free**: 10.000 comandos/dia (suficiente para começar)

#### 2. Criar banco Redis
1. No dashboard, clique em **"Create Database"**
2. Configure:
   - **Name**: `whatlead-production`
   - **Type**: Regional
   - **Region**: `us-east-1` (mesma região do seu Neon)
   - **Primary**: Habilitado
   - **TLS**: Habilitado ✅
3. Clique em **"Create"**

#### 3. Copiar URL de conexão
1. Na página do banco criado, você verá várias abas de conexão
2. **IMPORTANTE**: Ignore a aba "REST API" 
3. Clique na aba **"Redis"** ou **"Connect"**
4. Procure pela seção **"Redis Connection String"** ou **"Connect your client"**
5. Você verá uma URL assim:
   ```
   rediss://default:AbCdEf123456@moral-falcon-12061.upstash.io:6379
   ```
6. **Copie essa URL completa** (começa com `rediss://` - com dois 's')

#### 4. Configurar no WhatLead
Abra o arquivo `.env` e cole a URL:

```bash
REDIS_URL=rediss://default:SuaSenhaAqui@us1-xxxx.upstash.io:6379
BULLMQ_PREFIX=wacrm
```

✅ **Pronto!** Redis configurado.

---

## 2️⃣ Gateway PIX - 15-30 minutos 💳

Escolha uma das opções abaixo (recomendo começar com **Mercado Pago**).

---

### OPÇÃO A: Mercado Pago (Recomendado) 🟦

#### Por que escolher?
- ✅ Interface mais amigável
- ✅ Documentação em português
- ✅ Sandbox para testes
- ✅ Suporte brasileiro
- ⚠️ Taxa: **4,99% por transação PIX**

#### Passo a passo:

##### 1. Criar conta de desenvolvedor
👉 Acesse: https://www.mercadopago.com.br/developers

1. Clique em **"Criar sua conta Mercado Pago"**
2. Use sua conta pessoal ou crie uma nova
3. Complete o cadastro (pode ser PF ou PJ)

##### 2. Criar aplicação
1. No menu, vá em **"Suas integrações"**
2. Clique em **"Criar aplicação"**
3. Preencha:
   - **Nome**: `WhatLead CRM`
   - **Produto**: Escolha **"Pagamentos online"**
   - **Modelo de integração**: Checkout API
4. Clique em **"Criar aplicação"**

##### 3. Obter credenciais de PRODUÇÃO
1. Na página da aplicação, clique em **"Credenciais de produção"**
2. Você verá duas chaves:
   - **Public Key**: `APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - **Access Token**: `APP_USR-1234567890123456-123456-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-1234567890`
3. **Copie o Access Token** (é uma string longa de ~100 caracteres)

##### 4. Configurar Webhook
1. No menu, vá em **"Integrações" > "Webhooks"**
2. Clique em **"Adicionar webhook"**
3. Preencha:
   - **URL de notificação**: `https://SEU-DOMINIO.vercel.apphttps://what-lead-web.vercel.app/api/webhooks/pix`
   - **Eventos**: Marque apenas `payment`
4. Clique em **"Salvar"**

⚠️ **IMPORTANTE**: Substitua `SEU-DOMINIO` pela URL real da sua aplicação no Vercel.

##### 5. Configurar no WhatLead
Abra o arquivo `.env` e adicione:

```bash
PSP_PROVIDER=mercadopago
MERCADOPAGO_ACCESS_TOKEN=APP_USR-1234567890123456-123456-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-1234567890
MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

✅ **Mercado Pago configurado!**

##### 6. Testar (opcional)
Você pode testar primeiro no **modo sandbox** antes de ir para produção:

1. Obtenha as credenciais de **teste** (não produção)
2. Use a mesma configuração
3. Para pagar, use os [cartões de teste](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/testing)

---

### OPÇÃO B: Asaas 💰

#### Por que escolher?
- ✅ Taxas menores para grandes volumes
- ✅ Plataforma completa (PIX + Boleto + Cartão)
- ✅ Gestão de assinaturas
- ⚠️ Taxa: **R$ 1,99 por transação PIX**
- ⚠️ Interface menos intuitiva que Mercado Pago

#### Passo a passo:

##### 1. Criar conta
👉 Acesse: https://www.asaas.com

1. Clique em **"Criar conta grátis"**
2. Preencha seus dados (PF ou PJ)
3. Confirme email
4. Complete o cadastro da empresa

##### 2. Obter API Key
1. Acesse o painel: https://www.asaas.com
2. No menu lateral, vá em **"Integrações" > "Chaves de API"**
3. Clique em **"Gerar nova chave"**
4. **Copie a chave** (começa com algo como `$aact_...`)

##### 3. Configurar Webhook
1. Ainda em **"Integrações"**, clique em **"Webhooks"**
2. Clique em **"Adicionar webhook"**
3. Preencha:
   - **URL**: `https://SEU-DOMINIO.vercel.app/api/webhooks/pix`
   - **Eventos**: Marque `PAYMENT_RECEIVED` e `PAYMENT_CONFIRMED`
4. Clique em **"Salvar"**

##### 4. Configurar no WhatLead
Abra o arquivo `.env` e adicione:

```bash
PSP_PROVIDER=asaas
ASAAS_API_KEY=$aact_sua_chave_api_aqui
```

✅ **Asaas configurado!**

##### 5. Modo Sandbox (Testes)
Para testar antes de ir para produção:

1. Acesse: https://sandbox.asaas.com
2. Crie uma conta separada (dados fictícios)
3. Obtenha a API Key do sandbox
4. Configure:
   ```bash
   ASAAS_SANDBOX=true
   ASAAS_API_KEY=sua_chave_sandbox
   ```

---

## 3️⃣ Verificar Configuração ✅

Depois de configurar, execute:

```bash
cd /root/www/WhatLead
pnpm build
```

Se tudo estiver correto, você verá:
```
✓ Compiled successfully
```

---

## 4️⃣ Testar em Produção 🎉

### Testar Redis:
1. O worker irá conectar automaticamente quando iniciar
2. Logs mostrarão: `Worker running...`

### Testar PIX:
1. Faça login no sistema
2. Crie um pedido
3. Clique em **"Gerar PIX"**
4. Você verá o QR Code e código Copia e Cola
5. Pague usando seu app de banco
6. Em ~10 segundos, o webhook irá confirmar o pagamento

---

## 🆘 Problemas?

### Redis não conecta
- ✅ Verifique se a URL começa com `rediss://` (com dois 's')
- ✅ Certifique-se de copiar a senha completa
- ✅ Teste a conexão em https://upstash.com/redis

### PIX não gera QR Code
- ✅ Verifique se o `PSP_PROVIDER` está correto
- ✅ Confirme que o Access Token/API Key está válido
- ✅ Veja os logs: `pnpm logs` ou no Vercel Dashboard

### Webhook não recebe pagamento
- ✅ URL do webhook deve ser HTTPS
- ✅ URL deve estar acessível publicamente
- ✅ No Mercado Pago, veja em "Integrações > Webhooks" os logs de entrega
- ✅ No Asaas, veja em "Integrações > Webhooks" o histórico

---

## 📊 Custos

### Redis (Upstash)
- **Free tier**: 10.000 comandos/dia
- Se ultrapassar: ~$0.20 por 100.000 comandos adicionais

### Mercado Pago
- **PIX**: 4,99% por transação
- **Sem mensalidade**
- **Sem setup fee**

### Asaas
- **PIX**: R$ 1,99 fixo por transação
- **Sem mensalidade** (até 10 cobranças/mês)
- **Acima de 10**: R$ 19,90/mês

---

## 🎯 Próximos Passos

Agora que Redis e PIX estão configurados:

1. ✅ Configure o domínio customizado na Vercel
2. ✅ Ative 2FA na sua conta
3. ✅ Configure backups automáticos do banco
4. ✅ Monitore os webhooks em produção

**Documentação completa:**
- [PIX_SETUP.md](./docs/PIX_SETUP.md) - Guia detalhado de PIX
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deploy completo
- [INTEGRATIONS.md](./INTEGRATIONS.md) - Todas as integrações

# 🎯 Guia Rápido - Erros Personalizados

## ✅ Status: Implementado

### 📦 Arquivo Principal:
[/apps/web/src/lib/errors.ts](apps/web/src/lib/errors.ts)

### ✨ Endpoints Atualizados:
- ✅ `/api/auth/register` - Registro com erros em português
- ✅ `/api/auth/login` - Login com erros em português  
- ✅ `/api/customers` - Clientes com validações customizadas

---

## 🚀 Uso Rápido

### 1️⃣ **Importar**
```typescript
import { errorResponse, DuplicateEmailError } from "@/lib/errors";
```

### 2️⃣ **Lançar Erro**
```typescript
if (emailExists) {
  throw new DuplicateEmailError();
}
```

### 3️⃣ **Capturar no catch**
```typescript
try {
  // código...
} catch (error) {
  return errorResponse(error as Error, "api/rota");
}
```

---

## 📋 Erros Mais Usados

### Autenticação
```typescript
throw new UnauthorizedError();
throw new InvalidCredentialsError();
throw new ExpiredTokenError();
```

### Validação
```typescript
throw new ValidationError("Mensagem customizada");
throw new InvalidEmailError();
throw new InvalidPhoneError();
throw new WeakPasswordError();
throw new MissingFieldError("nome");
```

### Conflitos
```typescript
throw new DuplicateEmailError();
throw new DuplicatePhoneError();
throw new DuplicateSlugError();
```

### Não Encontrado
```typescript
throw new CustomerNotFoundError();
throw new OrderNotFoundError();
throw new ProductNotFoundError();
throw new QuoteNotFoundError();
```

### Regras de Negócio
```typescript
throw new InsufficientStockError("Produto X", 5);
throw new InvalidOrderStatusError("PAID", "cancelar");
throw new QuoteExpiredError();
```

### Rate Limit
```typescript
throw new RateLimitError(3600); // segundos até permitir nova tentativa
```

### Integração
```typescript
throw new WhatsAppError("Mensagem opcional");
throw new PaymentGatewayError();
throw new DatabaseError();
```

---

## 🎨 Resposta Automática

Todos os erros retornam formato padronizado:

```json
{
  "error": {
    "code": "DUPLICATE_EMAIL",
    "message": "Este email já está em uso. Tente outro ou faça login"
  },
  "meta": {
    "requestId": "uuid-123",
    "timestamp": "2026-02-17T20:00:00.000Z",
    "handler": "api/auth/register"
  }
}
```

Status HTTP correto é definido automaticamente (401, 403, 404, 409, 422, etc.)

---

## 🛠️ Helpers de Validação

```typescript
import { validateEmail, validatePhone, validatePassword } from "@/lib/errors";

validateEmail(email);     // Lança InvalidEmailError se inválido
validatePhone(phone);     // Lança InvalidPhoneError se inválido
validatePassword(pass);   // Lança WeakPasswordError se fraca
```

---

## 📚 Documentação Completa

Ver [SISTEMA_ERROS.md](SISTEMA_ERROS.md) para:
- Lista completa de todas as classes
- Exemplos de código
- Guia de migração
- Benefícios do sistema

---

## 🎉 Benefícios

| Antes | Depois |
|-------|--------|
| `{ error: "Email already exists" }` | `"Este email já está em uso. Tente outro ou faça login"` |
| Status code manual | ✅ Status code automático |
| 10 linhas de código | ✅ 1 linha: `throw new DuplicateEmailError()` |
| Inglês misturado | ✅ 100% português |
| Sem rastreamento | ✅ RequestId único em cada erro |
| Logs genéricos | ✅ Logs estruturados |

---

## ✅ Build: Testado e Funcionando

```bash
pnpm build
# ✓ Compiled successfully
# Tasks: 1 successful, 1 total
# Time: 1m1s
# 84 páginas geradas
# 0 erros
```

---

**Criado em:** 17 de fevereiro de 2026  
**Status:** ✅ Pronto para uso  
**Próximo passo:** Aplicar em todos os endpoints restantes

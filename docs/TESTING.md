# 🧪 Guia de Testes - WhatLead CRM

Este guia explica como escrever e executar testes no WhatLead CRM.

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Testes Unitários (Vitest)](#testes-unitários-vitest)
- [Testes de Integração](#testes-de-integração)
- [Testes E2E (Playwright)](#testes-e2e-playwright)
- [Coverage](#coverage)
- [CI/CD Integration](#cicd-integration)
- [Best Practices](#best-practices)

---

## 🎯 Visão Geral

O WhatLead usa uma estratégia de testes em 3 camadas:

- **Unit Tests** - Funções e componentes isolados (Vitest)
- **Integration Tests** - API routes e database (Vitest)
- **E2E Tests** - Fluxos completos de usuário (Playwright)

### Stack de Testes

- 🟢 **Vitest** - Test runner rápido compatível com Vite
- ⚛️ **React Testing Library** - Testa componentes React
- 🎭 **Playwright** - Testes E2E cross-browser
- 📊 **Coverage V8** - Relatórios de cobertura de código

---

## 🟢 Testes Unitários (Vitest)

### Instalação

```bash
# Já incluído no projeto
pnpm install
```

### Executar Testes

```bash
# Roda todos os testes uma vez
pnpm test

# Watch mode (re-roda ao salvar)
pnpm test:watch

# Interface visual
pnpm test:ui

# Com coverage
pnpm test:coverage
```

### Estrutura de Arquivos

```
apps/web/src/
├── __tests__/
│   ├── setup.ts                    # Configuração global
│   ├── lib/
│   │   ├── utils.test.ts          # Testes de utils
│   │   └── auth.test.ts           # Testes de auth
│   ├── components/
│   │   └── ui/
│   │       └── button.test.tsx    # Testes de componentes
│   └── e2e/
│       └── auth.spec.ts           # Testes E2E
```

### Escrever Testes de Funções

```typescript
// src/__tests__/lib/utils.test.ts
import { describe, it, expect } from 'vitest';
import { formatCurrency } from '@/lib/utils';

describe('Utils - Currency Formatting', () => {
  it('should format BRL currency correctly', () => {
    expect(formatCurrency(1000)).toBe('R$ 1.000,00');
    expect(formatCurrency(0)).toBe('R$ 0,00');
    expect(formatCurrency(12.5)).toBe('R$ 12,50');
  });

  it('should handle negative values', () => {
    expect(formatCurrency(-50)).toBe('-R$ 50,00');
  });
});
```

### Escrever Testes de Componentes

```typescript
// src/__tests__/components/notification-bell.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationBell from '@/components/notification-bell';

describe('NotificationBell Component', () => {
  it('should display notification count badge', () => {
    render(<NotificationBell count={5} />);
    
    const badge = screen.getByText('5');
    expect(badge).toBeInTheDocument();
  });

  it('should open dropdown on click', async () => {
    const user = userEvent.setup();
    render(<NotificationBell count={3} />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeVisible();
    });
  });

  it('should call onMarkAllRead when button clicked', async () => {
    const user = userEvent.setup();
    const mockMarkAllRead = vi.fn();
    
    render(<NotificationBell count={2} onMarkAllRead={mockMarkAllRead} />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    const markAllButton = screen.getByText(/marcar todas como lidas/i);
    await user.click(markAllButton);
    
    expect(mockMarkAllRead).toHaveBeenCalledOnce();
  });
});
```

### Mocking

#### Mock de Módulos

```typescript
import { vi } from 'vitest';

// Mock módulo completo
vi.mock('@/lib/wa/client', () => ({
  sendMessage: vi.fn().mockResolvedValue({ success: true }),
  sendTemplate: vi.fn(),
}));

// Mock parcial (mantém implementação original do resto)
vi.mock('@/lib/auth', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    verifyToken: vi.fn().mockResolvedValue({ userId: 123 }),
  };
});
```

#### Mock de Fetch

```typescript
import { vi, beforeEach } from 'vitest';

beforeEach(() => {
  global.fetch = vi.fn();
});

it('should fetch data from API', async () => {
  const mockData = { id: 1, name: 'Test' };
  
  vi.mocked(global.fetch).mockResolvedValue({
    ok: true,
    json: async () => mockData,
  } as Response);
  
  const result = await fetchData();
  
  expect(fetch).toHaveBeenCalledWith('/api/data');
  expect(result).toEqual(mockData);
});
```

#### Mock do Prisma Client

```typescript
import { vi } from 'vitest';
import { db } from '@whatlead/db';

vi.mock('@whatlead/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    order: {
      findMany: vi.fn(),
    },
  },
}));

it('should fetch user by id', async () => {
  const mockUser = { id: 1, email: 'test@example.com' };
  
  vi.mocked(db.user.findUnique).mockResolvedValue(mockUser);
  
  const user = await getUserById(1);
  
  expect(db.user.findUnique).toHaveBeenCalledWith({
    where: { id: 1 },
  });
  expect(user).toEqual(mockUser);
});
```

---

## 🔄 Testes de Integração

Testes de integração verificam múltiplos módulos trabalhando juntos.

### Testar API Routes

```typescript
// src/__tests__/api/orders.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '@whatlead/db';

describe('POST /api/orders', () => {
  beforeAll(async () => {
    // Setup: criar usuário de teste
    await db.user.create({
      data: {
        email: 'test@example.com',
        password: 'hashed',
        name: 'Test User',
        companyId: 1,
      },
    });
  });

  afterAll(async () => {
    // Cleanup: limpar dados de teste
    await db.order.deleteMany();
    await db.user.deleteMany();
  });

  it('should create a new order', async () => {
    const orderData = {
      customerId: 1,
      total: 100,
      items: [{ productId: 1, quantity: 2, price: 50 }],
    };

    const response = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
      body: JSON.stringify(orderData),
    });

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.order).toBeDefined();
    expect(json.order.total).toBe(100);
  });
});
```

### Testar com Database Real

Para testes de integração, use um banco de dados de teste:

```env
# .env.test
DATABASE_URL="postgresql://test:test@localhost:5432/whatlead_test"
```

```typescript
// setup-test-db.ts
import { execSync } from 'child_process';

export async function setupTestDatabase() {
  // Roda migrations
  execSync('pnpm db:migrate:dev', {
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL_TEST },
  });
}

export async function teardownTestDatabase() {
  // Limpa dados
  execSync('pnpm db:reset', {
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL_TEST },
  });
}
```

---

## 🎭 Testes E2E (Playwright)

Testes End-to-End simulam interações reais de usuários.

### Instalação

```bash
# Instalar Playwright browsers
pnpm exec playwright install
```

### Executar Testes E2E

```bash
# Roda todos os testes E2E
pnpm test:e2e

# Interface visual (debug)
pnpm test:e2e:ui

# Rodar browser específico
pnpm exec playwright test --project=chromium

# Modo headed (visualizar navegador)
pnpm exec playwright test --headed
```

### Escrever Testes E2E

```typescript
// src/__tests__/e2e/orders.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Order Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login antes de cada teste
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@test.com');
    await page.getByLabel('Senha').fill('AdminTest123!');
    await page.getByRole('button', { name: 'Entrar' }).click();
    
    await expect(page).toHaveURL('/dashboard');
  });

  test('should create a new order', async ({ page }) => {
    // Navegar para orders
    await page.goto('/dashboard/orders');
    
    // Clicar em "Novo Pedido"
    await page.getByRole('button', { name: /novo pedido/i }).click();
    
    // Preencher formulário
    await page.getByLabel('Cliente').fill('João Silva');
    await page.getByLabel('Produto').fill('Produto A');
    await page.getByLabel('Quantidade').fill('2');
    
    // Submeter
    await page.getByRole('button', { name: /criar pedido/i }).click();
    
    // Verificar sucesso
    await expect(page.getByText(/pedido criado com sucesso/i)).toBeVisible();
  });

  test('should filter orders by status', async ({ page }) => {
    await page.goto('/dashboard/orders');
    
    // Selecionar filtro
    await page.getByLabel('Status').selectOption('pending');
    
    // Verificar que só aparecem pedidos pendentes
    const orders = page.locator('[data-testid="order-row"]');
    await expect(orders).toHaveCount(5);
    
    for (const order of await orders.all()) {
      await expect(order.getByText('Pendente')).toBeVisible();
    }
  });
});
```

### Fixtures (Helpers Reutilizáveis)

```typescript
// src/__tests__/e2e/fixtures.ts
import { test as base } from '@playwright/test';

type Fixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<Fixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Login automático
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@test.com');
    await page.getByLabel('Senha').fill('AdminTest123!');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await page.waitForURL('/dashboard');
    
    await use(page);
  },
});

// Uso
test('should access dashboard', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/dashboard/orders');
  // Já está autenticado!
});
```

### Visual Regression Testing

```typescript
test('homepage should match screenshot', async ({ page }) => {
  await page.goto('/');
  
  // Comparar com screenshot baseline
  await expect(page).toHaveScreenshot('homepage.png');
});
```

---

## 📊 Coverage

### Gerar Relatório de Coverage

```bash
# Gerar coverage
pnpm test:coverage

# Abre relatório HTML
open coverage/index.html
```

### Threshold de Coverage

Configurado em [vitest.config.ts](../apps/web/vitest.config.ts):

```typescript
coverage: {
  thresholds: {
    lines: 70,       // 70% das linhas cobertas
    functions: 70,   // 70% das funções cobertas
    branches: 70,    // 70% dos branches cobertos
    statements: 70,  // 70% dos statements cobertos
  },
}
```

Build falhará se coverage abaixo do threshold.

### Ignorar Arquivos

```typescript
coverage: {
  exclude: [
    'node_modules/',
    'src/__tests__/',
    '**/*.config.*',
    'dist/',
    '.next/',
  ],
}
```

---

## 🔄 CI/CD Integration

Os testes rodam automaticamente no CI/CD.

### GitHub Actions

Ver [.github/workflows/ci-cd.yml](../.github/workflows/ci-cd.yml):

```yaml
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v2
    - uses: actions/setup-node@v4
      with:
        node-version: 20
        cache: 'pnpm'
    
    - name: Install dependencies
      run: pnpm install --frozen-lockfile
    
    - name: Run unit tests
      run: pnpm test
    
    - name: Run E2E tests
      run: pnpm test:e2e
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        files: ./coverage/lcov.info
```

### Executar Localmente Antes de Push

```bash
# Script que simula CI
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

---

## ✅ Best Practices

### 1. Princípio AAA

Estruture testes em 3 partes:

```typescript
it('should do something', () => {
  // Arrange - preparar dados e mocks
  const input = 'test';
  const expected = 'TEST';
  
  // Act - executar a ação
  const result = toUpperCase(input);
  
  // Assert - verificar resultado
  expect(result).toBe(expected);
});
```

### 2. Testes Independentes

Cada teste deve rodar isoladamente:

```typescript
// ❌ Ruim - testes dependentes
let userId: number;

it('should create user', () => {
  userId = createUser(); // Próximo teste depende deste
});

it('should update user', () => {
  updateUser(userId); // Falha se teste anterior falhar
});

// ✅ Bom - testes independentes
it('should update user', () => {
  const userId = createUser(); // Cria próprio usuário
  updateUser(userId);
});
```

### 3. Descriptive Test Names

```typescript
// ❌ Ruim
it('works', () => { ... });

// ✅ Bom
it('should return user profile when valid token provided', () => { ... });
```

### 4. Não Teste Implementação, Teste Comportamento

```typescript
// ❌ Ruim - testa implementação interna
it('should call setState with correct value', () => {
  const spy = vi.spyOn(component, 'setState');
  component.handleClick();
  expect(spy).toHaveBeenCalledWith({ clicked: true });
});

// ✅ Bom - testa comportamento visível
it('should show success message after click', () => {
  render(<Component />);
  fireEvent.click(screen.getByRole('button'));
  expect(screen.getByText('Success!')).toBeVisible();
});
```

### 5. Use data-testid com Moderação

```typescript
// ✅ Melhor - usa roles semânticos
screen.getByRole('button', { name: /submit/i });
screen.getByLabelText('Email');

// ⚠️ OK quando não há alternativa
screen.getByTestId('custom-widget');
```

### 6. Evite Sleeps e Waits Fixos

```typescript
// ❌ Ruim - tempo fixo
await new Promise(resolve => setTimeout(resolve, 1000));

// ✅ Bom - espera até condição
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});
```

### 7. Mock no Nível Certo

```typescript
// ❌ Ruim - mock muito baixo nível
vi.mock('next/router');
vi.mock('react');
vi.mock('database');

// ✅ Bom - mock no nível da aplicação
vi.mock('@/lib/api', () => ({
  fetchUser: vi.fn().mockResolvedValue({ id: 1, name: 'Test' }),
}));
```

---

## 🐛 Debugging

### Vitest

```typescript
import { test } from 'vitest';

test.only('debug this test', () => {
  // Só este teste roda
  debugger; // Para no debugger
  console.log('Debug info');
});
```

### Playwright

```bash
# Debug mode
pnpm exec playwright test --debug

# Pause no teste
await page.pause();

# Trace viewer
pnpm exec playwright show-trace trace.zip
```

---

## 📚 Recursos

- [Vitest Documentation](https://vitest.dev)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Última atualização:** 16/02/2026  
**Versão:** 1.0.0

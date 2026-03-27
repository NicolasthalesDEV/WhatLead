import { test, expect, type Page, type APIRequestContext } from '@playwright/test';

/**
 * Authentication helper — calls the login API and sets the cookie on the page context.
 * Requires a seeded user in the test database: TEST_USER_EMAIL / TEST_USER_PASSWORD env vars,
 * falling back to defaults that match the seed script.
 */
async function authenticateUser(page: Page): Promise<void> {
  const email = process.env.TEST_USER_EMAIL || 'admin@whatlead.test';
  const password = process.env.TEST_USER_PASSWORD || 'TestPass123!';

  const response = await page.request.post('/api/auth/login', {
    data: { email, password },
  });

  if (!response.ok()) {
    throw new Error(`Login failed: ${response.status()} ${await response.text()}`);
  }

  const body = await response.json();
  const token = body.accessToken;

  if (token) {
    // Store token in cookie / localStorage as the app expects
    await page.context().addCookies([
      {
        name: 'auth_token',
        value: token,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        sameSite: 'Lax',
      },
    ]);
  }
}

test.describe('Dashboard (authenticated)', () => {
  test('should display dashboard overview', async ({ page }) => {
    await authenticateUser(page);
    await page.goto('/dashboard');

    // Should be on dashboard — not redirected to login
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should navigate to conversations page', async ({ page }) => {
    await authenticateUser(page);
    await page.goto('/dashboard/whatsapp');
    await expect(page).toHaveURL(/\/dashboard\/whatsapp/);
  });

  test('should navigate to customers page', async ({ page }) => {
    await authenticateUser(page);
    await page.goto('/dashboard/customers');
    await expect(page).toHaveURL(/\/dashboard\/customers/);
    // Page should contain the "Clientes" heading
    await expect(page.getByRole('heading', { name: /clientes/i })).toBeVisible();
  });

  test('should navigate to orders page', async ({ page }) => {
    await authenticateUser(page);
    await page.goto('/dashboard/orders');
    await expect(page).toHaveURL(/\/dashboard\/orders/);
    await expect(page.getByRole('heading', { name: /pedidos/i })).toBeVisible();
  });

  test('should navigate to chatbot page', async ({ page }) => {
    await authenticateUser(page);
    await page.goto('/dashboard/chatbot');
    await expect(page).toHaveURL(/\/dashboard\/chatbot/);
  });

  test('should navigate through sidebar menu items', async ({ page }) => {
    await authenticateUser(page);
    await page.goto('/dashboard');

    // Click "Clientes"
    await page.getByRole('link', { name: /clientes/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/customers/);

    // Click "Pedidos"
    await page.getByRole('link', { name: /pedidos/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/orders/);

    // Click "Produtos"
    await page.getByRole('link', { name: /produtos/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/products/);
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    // No auth — visit dashboard directly
    await page.goto('/dashboard');
    // Should be redirected to login page
    await expect(page).toHaveURL(/\/(login|auth)/);
  });
});

test.describe('Health Check', () => {
  test('should return healthy status', async ({ request }) => {
    const response = await request.get('/api/health');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const json = await response.json();
    expect(json.status).toBe('healthy');
    expect(json.checks).toBeDefined();
    expect(json.checks.api.status).toBe('healthy');
  });

  test('should return ready status', async ({ request }) => {
    const response = await request.get('/api/health/ready');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const json = await response.json();
    expect(json.status).toBe('ready');
  });

  test('should return alive status', async ({ request }) => {
    const response = await request.get('/api/health/live');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const json = await response.json();
    expect(json.status).toBe('alive');
  });
});

test.describe('API Authentication', () => {
  test('should reject requests without auth token', async ({ request }) => {
    const response = await request.get('/api/customers');
    expect([401, 403]).toContain(response.status());
  });

  test('login endpoint should reject invalid credentials', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: { email: 'notexist@example.com', password: 'wrong' },
    });
    expect([400, 401, 403]).toContain(response.status());
  });
});


test.describe('Health Check', () => {
  test('should return healthy status', async ({ request }) => {
    const response = await request.get('/api/health');
    
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    const json = await response.json();
    expect(json.status).toBe('healthy');
    expect(json.checks).toBeDefined();
    expect(json.checks.api.status).toBe('healthy');
  });
  
  test('should return ready status', async ({ request }) => {
    const response = await request.get('/api/health/ready');
    
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    const json = await response.json();
    expect(json.status).toBe('ready');
  });
  
  test('should return alive status', async ({ request }) => {
    const response = await request.get('/api/health/live');
    
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    const json = await response.json();
    expect(json.status).toBe('alive');
  });
});

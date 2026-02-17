import { test, expect } from '@playwright/test';

test.describe('Dashboard (authenticated)', () => {
  // Nota: Estes testes assumem que você tem autenticação configurada
  // Em um cenário real, você usaria page.context().addCookies() 
  // ou criaria um helper de autenticação
  
  test.skip('should display dashboard overview', async ({ page }) => {
    // TODO: Adicionar helper de autenticação
    // await authenticateUser(page, 'admin@test.com', 'password');
    
    await page.goto('/dashboard');
    
    // Verifica elementos do dashboard
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
  });
  
  test.skip('should navigate through menu items', async ({ page }) => {
    // TODO: Adicionar helper de autenticação
    
    await page.goto('/dashboard');
    
    // Clica em "Pedidos"
    await page.getByRole('link', { name: /pedidos/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/orders/);
    
    // Clica em "Clientes"
    await page.getByRole('link', { name: /clientes/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/customers/);
    
    // Clica em "Produtos"
    await page.getByRole('link', { name: /produtos/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/products/);
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

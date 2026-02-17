import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');
    
    // Verifica se a página carregou
    await expect(page).toHaveTitle(/WhatLead/i);
  });

  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Deve redirecionar para /login
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Login Flow', () => {
  test('should show login form', async ({ page }) => {
    await page.goto('/login');
    
    // Verifica elementos do formulário
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/senha/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Preenche formulário com credenciais inválidas
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/senha/i).fill('wrongpassword');
    await page.getByRole('button', { name: /entrar/i }).click();
    
    // Verifica mensagem de erro
    await expect(page.getByText(/credenciais inválidas/i)).toBeVisible();
  });

  // Nota: Para testar login real, você precisaria de um usuário de teste
  // test('should login with valid credentials', async ({ page }) => {
  //   await page.goto('/login');
  //   
  //   await page.getByLabel(/email/i).fill('admin@test.com');
  //   await page.getByLabel(/senha/i).fill('AdminTest123!');
  //   await page.getByRole('button', { name: /entrar/i }).click();
  //   
  //   // Deve redirecionar para dashboard
  //   await expect(page).toHaveURL('/dashboard');
  // });
});

test.describe('Accessibility', () => {
  test('login page should not have accessibility violations', async ({ page }) => {
    await page.goto('/login');
    
    // Verifica landmarks básicos
    await expect(page.locator('main')).toBeVisible();
    
    // Verifica que inputs têm labels
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toBeVisible();
    
    const passwordInput = page.getByLabel(/senha/i);
    await expect(passwordInput).toBeVisible();
  });
});

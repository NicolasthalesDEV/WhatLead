/**
 * Script de teste para integração WhatsApp e Mercado Pago
 * 
 * Uso: pnpm ts-node scripts/test-integrations.ts
 */

import 'dotenv/config';

// Cores para terminal
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
}

const results: TestResult[] = [];

function logResult(result: TestResult) {
  const icon = result.status === 'success' ? '✓' : result.status === 'error' ? '✗' : '⚠';
  const color = result.status === 'success' ? colors.green : result.status === 'error' ? colors.red : colors.yellow;
  
  console.log(`${color}${icon} ${result.name}${colors.reset}`);
  console.log(`  ${result.message}\n`);
  
  results.push(result);
}

async function testWhatsAppCredentials() {
  console.log(`${colors.blue}=== TESTE: WhatsApp Cloud API ===${colors.reset}\n`);

  // Verificar credenciais
  const phoneNumberId = process.env.WA_PHONE_NUMBER_ID;
  const accessToken = process.env.WA_ACCESS_TOKEN;
  const verifyToken = process.env.WA_VERIFY_TOKEN;

  if (!phoneNumberId || phoneNumberId === 'dev') {
    logResult({
      name: 'WA_PHONE_NUMBER_ID',
      status: 'error',
      message: 'Variável não configurada. Configure em .env',
    });
  } else {
    logResult({
      name: 'WA_PHONE_NUMBER_ID',
      status: 'success',
      message: `Configurado: ${phoneNumberId}`,
    });
  }

  if (!accessToken || accessToken === 'dev') {
    logResult({
      name: 'WA_ACCESS_TOKEN',
      status: 'error',
      message: 'Token não configurado. Configure em .env',
    });
  } else {
    logResult({
      name: 'WA_ACCESS_TOKEN',
      status: 'success',
      message: `Token configurado (${accessToken.substring(0, 20)}...)`,
    });

    // Testar API
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${phoneNumberId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        logResult({
          name: 'WhatsApp API Connection',
          status: 'success',
          message: `Conectado! Número: ${data.display_phone_number || data.id}`,
        });
      } else {
        const error = await response.json();
        logResult({
          name: 'WhatsApp API Connection',
          status: 'error',
          message: `Erro na API: ${error.error?.message || 'Desconhecido'}`,
        });
      }
    } catch (error: any) {
      logResult({
        name: 'WhatsApp API Connection',
        status: 'error',
        message: `Erro de conexão: ${error.message}`,
      });
    }
  }

  if (!verifyToken) {
    logResult({
      name: 'WA_VERIFY_TOKEN',
      status: 'warning',
      message: 'Token de verificação não configurado (necessário para webhooks)',
    });
  } else {
    logResult({
      name: 'WA_VERIFY_TOKEN',
      status: 'success',
      message: 'Token de verificação configurado',
    });
  }
}

async function testMercadoPagoCredentials() {
  console.log(`${colors.blue}=== TESTE: Mercado Pago ===${colors.reset}\n`);

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const publicKey = process.env.MERCADOPAGO_PUBLIC_KEY;

  if (!accessToken) {
    logResult({
      name: 'MERCADOPAGO_ACCESS_TOKEN',
      status: 'error',
      message: 'Token não configurado. Configure em .env',
    });
  } else {
    logResult({
      name: 'MERCADOPAGO_ACCESS_TOKEN',
      status: 'success',
      message: `Token configurado (${accessToken.substring(0, 20)}...)`,
    });

    // Testar API
    try {
      const response = await fetch('https://api.mercadopago.com/v1/account/settings', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        logResult({
          name: 'Mercado Pago API Connection',
          status: 'success',
          message: `Conectado! ID: ${data.id || 'Configurado'}`,
        });
      } else {
        const error = await response.json();
        logResult({
          name: 'Mercado Pago API Connection',
          status: 'error',
          message: `Erro na API: ${error.message || 'Token inválido'}`,
        });
      }
    } catch (error: any) {
      logResult({
        name: 'Mercado Pago API Connection',
        status: 'error',
        message: `Erro de conexão: ${error.message}`,
      });
    }
  }

  if (!publicKey) {
    logResult({
      name: 'MERCADOPAGO_PUBLIC_KEY',
      status: 'warning',
      message: 'Chave pública não configurada (necessária para checkout direto)',
    });
  } else {
    logResult({
      name: 'MERCADOPAGO_PUBLIC_KEY',
      status: 'success',
      message: `Chave configurada (${publicKey.substring(0, 20)}...)`,
    });
  }
}

async function testDatabaseConnection() {
  console.log(`${colors.blue}=== TESTE: Database ===${colors.reset}\n`);

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    logResult({
      name: 'DATABASE_URL',
      status: 'error',
      message: 'URL do banco não configurada',
    });
    return;
  }

  logResult({
    name: 'DATABASE_URL',
    status: 'success',
    message: 'URL configurada',
  });

  // Tentar conectar
  try {
    const { PrismaClient } = await import('@wacrm/db');
    const prisma = new PrismaClient();

    await prisma.$connect();
    
    // Contar empresas
    const count = await prisma.company.count();
    
    logResult({
      name: 'Database Connection',
      status: 'success',
      message: `Conectado! ${count} empresa(s) cadastrada(s)`,
    });

    await prisma.$disconnect();
  } catch (error: any) {
    logResult({
      name: 'Database Connection',
      status: 'error',
      message: `Erro: ${error.message}`,
    });
  }
}

async function summarizeResults() {
  console.log(`${colors.blue}=== RESUMO ===${colors.reset}\n`);

  const success = results.filter((r) => r.status === 'success').length;
  const errors = results.filter((r) => r.status === 'error').length;
  const warnings = results.filter((r) => r.status === 'warning').length;

  console.log(`${colors.green}✓ Sucessos: ${success}${colors.reset}`);
  console.log(`${colors.red}✗ Erros: ${errors}${colors.reset}`);
  console.log(`${colors.yellow}⚠ Avisos: ${warnings}${colors.reset}\n`);

  if (errors === 0) {
    console.log(`${colors.green}✓ TODAS AS INTEGRAÇÕES ESTÃO FUNCIONANDO!${colors.reset}\n`);
  } else {
    console.log(`${colors.red}✗ Há problemas nas integrações. Verifique os erros acima.${colors.reset}\n`);
  }
}

async function main() {
  console.clear();
  console.log(`${colors.blue}╔════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║   TESTE DE INTEGRAÇÕES - WhatLead CRM     ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════════╝${colors.reset}\n`);

  await testWhatsAppCredentials();
  await testMercadoPagoCredentials();
  await testDatabaseConnection();
  await summarizeResults();
}

main().catch(console.error);

/**
 * Script de seed para dados de teste de assinaturas
 * 
 * Uso:
 * cd /root/www/WhatLead/packages/db
 * pnpm tsx seed-subscription-test.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding subscription test data...');

  // Encontrar primeira empresa cadastrada
  const company = await prisma.company.findFirst({
    select: { id: true, name: true }
  });

  if (!company) {
    console.error('❌ Nenhuma empresa encontrada. Execute o seed principal primeiro.');
    return;
  }

  console.log(`📦 Atualizando empresa: ${company.name}`);

  // Criar assinatura de teste (Professional, expira em 30 dias)
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + 30);

  await prisma.company.update({
    where: { id: company.id },
    data: {
      plan: 'professional',
      planStatus: 'active',
      planStartedAt: now,
      planExpiresAt: expiresAt,
      billingCycle: 'monthly',
      paymentMethod: 'mercadopago',
      lastPaymentAt: now,
      mercadopagoSubscriptionId: 'test-sub-' + Math.random().toString(36).substring(7),
      mercadopagoCustomerId: 'test-cust-' + Math.random().toString(36).substring(7),
    }
  });

  console.log('✅ Assinatura de teste criada:');
  console.log(`   Plano: Professional`);
  console.log(`   Status: active`);
  console.log(`   Iniciado: ${now.toLocaleDateString('pt-BR')}`);
  console.log(`   Expira: ${expiresAt.toLocaleDateString('pt-BR')} (30 dias)`);
  console.log(`   Ciclo: Mensal (R$ 197)`);

  // Exemplos de outros cenários de teste

  console.log('\n📝 Para testar outros cenários, rode os comandos:');
  console.log('\n// Assinatura expirando (7 dias)');
  console.log('await prisma.company.update({');
  console.log('  where: { id: "' + company.id + '" },');
  console.log('  data: {');
  console.log('    planExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)');
  console.log('  }');
  console.log('});');

  console.log('\n// Assinatura expirada');
  console.log('await prisma.company.update({');
  console.log('  where: { id: "' + company.id + '" },');
  console.log('  data: {');
  console.log('    planStatus: "expired",');
  console.log('    planExpiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)');
  console.log('  }');
  console.log('});');

  console.log('\n// Assinatura cancelada (mas ainda ativa)');
  console.log('await prisma.company.update({');
  console.log('  where: { id: "' + company.id + '" },');
  console.log('  data: {');
  console.log('    planStatus: "cancelled",');
  console.log('    planExpiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)');
  console.log('  }');
  console.log('});');

  console.log('\n// Plano gratuito');
  console.log('await prisma.company.update({');
  console.log('  where: { id: "' + company.id + '" },');
  console.log('  data: {');
  console.log('    plan: "free",');
  console.log('    planStatus: "active",');
  console.log('    planExpiresAt: null,');
  console.log('    mercadopagoSubscriptionId: null');
  console.log('  }');
  console.log('});');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

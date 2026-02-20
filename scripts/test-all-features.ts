#!/usr/bin/env tsx
/**
 * Script de teste completo de todas as funcionalidades
 * Testa APIs, conexões e funcionalidades críticas
 */

import { prisma } from '@wacrm/db';

interface TestResult {
  feature: string;
  status: 'OK' | 'WARNING' | 'ERROR';
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function addResult(feature: string, status: 'OK' | 'WARNING' | 'ERROR', message: string, details?: any) {
  results.push({ feature, status, message, details });
  const icon = status === 'OK' ? '✅' : status === 'WARNING' ? '⚠️' : '❌';
  console.log(`${icon} ${feature}: ${message}`);
  if (details) {
    console.log('  ', JSON.stringify(details, null, 2));
  }
}

async function testDatabase() {
  console.log('\n🔍 Testando Conexão com Banco de Dados...');
  try {
    await prisma.$queryRaw`SELECT 1`;
    addResult('Database', 'OK', 'Conexão estabelecida com sucesso');
  } catch (error: any) {
    addResult('Database', 'ERROR', 'Falha na conexão', error.message);
    return false;
  }
  return true;
}

async function testCustomers() {
  console.log('\n🔍 Testando Funcionalidade de Clientes...');
  try {
    // Contar clientes
    const count = await prisma.customer.count();
    addResult('Clientes - Listagem', 'OK', `${count} clientes no sistema`);

    // Verificar estrutura
    const sample = await prisma.customer.findFirst();
    if (sample) {
      const hasRequiredFields = sample.id && sample.name && sample.phoneE164;
      if (hasRequiredFields) {
        addResult('Clientes - Estrutura', 'OK', 'Campos obrigatórios presentes');
      } else {
        addResult('Clientes - Estrutura', 'WARNING', 'Alguns campos obrigatórios ausentes');
      }
    }
  } catch (error: any) {
    addResult('Clientes', 'ERROR', 'Erro ao testar clientes', error.message);
  }
}

async function testProducts() {
  console.log('\n🔍 Testando Funcionalidade de Quartos/Produtos...');
  try {
    const count = await prisma.product.count();
    addResult('Produtos - Listagem', 'OK', `${count} produtos cadastrados`);

    // Verificar produtos com preço
    const productsWithPrice = await prisma.product.findMany({
      include: {
        Price: true,
      },
      take: 5,
    });

    const withPrice = productsWithPrice.filter((p: any) => p.Price && p.Price.length > 0).length;
    if (withPrice === productsWithPrice.length) {
      addResult('Produtos - Preços', 'OK', 'Todos os produtos têm preços definidos');
    } else {
      addResult('Produtos - Preços', 'WARNING', `${productsWithPrice.length - withPrice} produtos sem preço`);
    }

    // Verificar produtos ativos
    const activeCount = await prisma.product.count({ where: { active: true } });
    addResult('Produtos - Ativos', 'OK', `${activeCount} produtos ativos`);

  } catch (error: any) {
    addResult('Produtos', 'ERROR', 'Erro ao testar produtos', error.message);
  }
}

async function testOrders() {
  console.log('\n🔍 Testando Funcionalidade de Reservas/Pedidos...');
  try {
    const count = await prisma.order.count();
    addResult('Pedidos - Listagem', 'OK', `${count} pedidos no sistema`);

    // Contar por status
    const statusCounts = await prisma.order.groupBy({
      by: ['status'],
      _count: true,
    });

    addResult('Pedidos - Status', 'OK', 'Distribuição de status', 
      statusCounts.map((s: any) => `${s.status}: ${s._count}`).join(', '));

    // Verificar pedidos com itens
    const ordersWithItems = await prisma.order.findMany({
      include: {
        OrderItem: true,
      },
      take: 10,
    });

    const hasItems = ordersWithItems.every((o: any) => o.OrderItem.length > 0);
    if (hasItems || ordersWithItems.length === 0) {
      addResult('Pedidos - Itens', 'OK', 'Pedidos contêm itens');
    } else {
      addResult('Pedidos - Itens', 'WARNING', 'Alguns pedidos sem itens');
    }

  } catch (error: any) {
    addResult('Pedidos', 'ERROR', 'Erro ao testar pedidos', error.message);
  }
}

async function testChatbot() {
  console.log('\n🔍 Testando Funcionalidade de Chatbot...');
  try {
    // Verificar se tabelas existem
    const chatbotFlow = (prisma as any).chatbotFlow;
    
    if (!chatbotFlow) {
      addResult('Chatbot', 'WARNING', 'Tabelas de chatbot não disponíveis no schema');
      return;
    }

    const flowCount = await chatbotFlow.count();
    addResult('Chatbot - Flows', 'OK', `${flowCount} fluxos configurados`);

    // Verificar triggers
    const chatbotTrigger = (prisma as any).chatbotTrigger;
    if (chatbotTrigger) {
      const triggerCount = await chatbotTrigger.count();
      const activeTriggers = await chatbotTrigger.count({ where: { enabled: true } });
      addResult('Chatbot - Triggers', 'OK', `${triggerCount} triggers (${activeTriggers} ativos)`);
    }

    // Verificar flows ativos
    const activeFlows = await chatbotFlow.count({ where: { active: true } });
    addResult('Chatbot - Flows Ativos', 'OK', `${activeFlows} fluxos ativos`);

  } catch (error: any) {
    addResult('Chatbot', 'ERROR', 'Erro ao testar chatbot', error.message);
  }
}

async function testNotifications() {
  console.log('\n🔍 Testando Sistema de Notificações...');
  try {
    const notification = (prisma as any).notification;
    
    if (!notification) {
      addResult('Notificações', 'WARNING', 'Tabela de notificações não disponível no schema');
      return;
    }

    const count = await notification.count();
    const unread = await notification.count({ where: { read: false } });
    
    addResult('Notificações - Sistema', 'OK', `${count} notificações (${unread} não lidas)`);

  } catch (error: any) {
    addResult('Notificações', 'ERROR', 'Erro ao testar notificações', error.message);
  }
}

async function testPayments() {
  console.log('\n🔍 Testando Sistema de Pagamentos...');
  try {
    const count = await prisma.payment.count();
    addResult('Pagamentos - Total', 'OK', `${count} pagamentos registrados`);

    // Verificar por provider
    const byProvider = await prisma.payment.groupBy({
      by: ['provider'],
      _count: true,
    });

    addResult('Pagamentos - Providers', 'OK', 
      byProvider.map((p: any) => `${p.provider}: ${p._count}`).join(', ') || 'Nenhum pagamento');

    // Verificar por status
    const byStatus = await prisma.payment.groupBy({
      by: ['status'],
      _count: true,
    });

    addResult('Pagamentos - Status', 'OK', 
      byStatus.map((s: any) => `${s.status}: ${s._count}`).join(', ') || 'Nenhum pagamento');

    // Verificar pagamentos recentes
    const recentPayments = await prisma.payment.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        provider: true,
        status: true,
        amount: true,
        createdAt: true,
      },
    });

    if (recentPayments.length > 0) {
      addResult('Pagamentos - Recentes', 'OK', `${recentPayments.length} pagamentos recentes`);
    }

  } catch (error: any) {
    addResult('Pagamentos', 'ERROR', 'Erro ao testar pagamentos', error.message);
  }
}

async function testWhatsApp() {
  console.log('\n🔍 Testando Integração WhatsApp...');
  try {
    const messageCount = await prisma.whatsMessage.count();
    addResult('WhatsApp - Mensagens', 'OK', `${messageCount} mensagens no histórico`);

    // Verificar mensagens recentes
    const recentMessages = await prisma.whatsMessage.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        Customer: {
          select: {
            name: true,
            phoneE164: true,
          },
        },
      },
    });

    const incoming = recentMessages.filter((m: any) => m.incoming).length;
    const outgoing = recentMessages.length - incoming;
    
    addResult('WhatsApp - Direção', 'OK', `Recebidas: ${incoming}, Enviadas: ${outgoing}`);

    // Verificar channels
    const channels = await prisma.whatsChannel.count();
    addResult('WhatsApp - Canais', 'OK', `${channels} canal(is) configurado(s)`);

  } catch (error: any) {
    addResult('WhatsApp', 'ERROR', 'Erro ao testar WhatsApp', error.message);
  }
}

async function testCompany() {
  console.log('\n🔍 Testando Configurações da Empresa...');
  try {
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        plan: true,
        planStatus: true,
        planExpiresAt: true,
      },
    });

    addResult('Empresa - Total', 'OK', `${companies.length} empresa(s) cadastrada(s)`);

    for (const company of companies) {
      const planInfo = `${company.plan} (${company.planStatus})`;
      addResult(`Empresa - ${company.name}`, 'OK', planInfo);
    }

  } catch (error: any) {
    addResult('Empresa', 'ERROR', 'Erro ao testar empresa', error.message);
  }
}

async function testQuotes() {
  console.log('\n🔍 Testando Orçamentos...');
  try {
    const count = await prisma.quote.count();
    addResult('Orçamentos - Total', 'OK', `${count} orçamentos criados`);

    // Verificar por status
    const byStatus = await prisma.quote.groupBy({
      by: ['status'],
      _count: true,
    });

    addResult('Orçamentos - Status', 'OK', 
      byStatus.map((s: any) => `${s.status}: ${s._count}`).join(', ') || 'Nenhum orçamento');

  } catch (error: any) {
    addResult('Orçamentos', 'ERROR', 'Erro ao testar orçamentos', error.message);
  }
}

async function testFunnel() {
  console.log('\n🔍 Testando Funil de Vendas...');
  try {
    const funnelStage = (prisma as any).funnelStage;
    const funnelCard = (prisma as any).funnelCard;
    
    if (!funnelStage || !funnelCard) {
      addResult('Funil', 'WARNING', 'Tabelas de funil não disponíveis no schema');
      return;
    }

    const stageCount = await funnelStage.count();
    const cardCount = await funnelCard.count();
    
    addResult('Funil - Estágios', 'OK', `${stageCount} estágios configurados`);
    addResult('Funil - Cards', 'OK', `${cardCount} cards no funil`);

  } catch (error: any) {
    addResult('Funil', 'ERROR', 'Erro ao testar funil', error.message);
  }
}

async function testUsers() {
  console.log('\n🔍 Testando Usuários...');
  try {
    const userCount = await prisma.user.count();
    addResult('Usuários - Total', 'OK', `${userCount} usuário(s) cadastrado(s)`);

    // Verificar por role
    const byRole = await prisma.user.groupBy({
      by: ['role'],
      _count: true,
    });

    addResult('Usuários - Roles', 'OK', 
      byRole.map((r: any) => `${r.role}: ${r._count}`).join(', '));

  } catch (error: any) {
    addResult('Usuários', 'ERROR', 'Erro ao testar usuários', error.message);
  }
}

// Função principal
async function runAllTests() {
  console.log('🚀 Iniciando Teste Completo de Funcionalidades\n');
  console.log('=' . repeat(60));

  const dbOk = await testDatabase();
  
  if (!dbOk) {
    console.log('\n❌ Testes interrompidos devido a falha na conexão com o banco');
    return;
  }

  // Executar todos os testes
  await testCompany();
  await testUsers();
  await testCustomers();
  await testProducts();
  await testOrders();
  await testQuotes();
  await testPayments();
  await testWhatsApp();
  await testChatbot();
  await testNotifications();
  await testFunnel();

  // Resumo final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DOS TESTES\n');

  const okCount = results.filter(r => r.status === 'OK').length;
  const warningCount = results.filter(r => r.status === 'WARNING').length;
  const errorCount = results.filter(r => r.status === 'ERROR').length;

  console.log(`✅ Sucesso: ${okCount}`);
  console.log(`⚠️  Avisos: ${warningCount}`);
  console.log(`❌ Erros: ${errorCount}`);
  console.log('\nTotal de testes: ' + results.length);

  if (errorCount > 0) {
    console.log('\n❌ ERROS ENCONTRADOS:');
    results.filter(r => r.status === 'ERROR').forEach(r => {
      console.log(`  - ${r.feature}: ${r.message}`);
    });
  }

  if (warningCount > 0) {
    console.log('\n⚠️  AVISOS:');
    results.filter(r => r.status === 'WARNING').forEach(r => {
      console.log(`  - ${r.feature}: ${r.message}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  
  const successRate = ((okCount / results.length) * 100).toFixed(1);
  console.log(`\n🎯 Taxa de Sucesso: ${successRate}%\n`);

  // Retornar código de saída apropriado
  process.exit(errorCount > 0 ? 1 : 0);
}

// Executar
runAllTests()
  .catch(error => {
    console.error('Erro fatal:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });

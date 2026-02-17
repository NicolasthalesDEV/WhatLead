#!/usr/bin/env node
/**
 * Script para encontrar todos os .create() sem ID
 * e gerar as correções necessárias
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const rootDir = path.join(__dirname, '../apps/web/src');

// Modelos que precisam de ID manual (todos os 31)
const modelsNeedingId = [
  'Company', 'Customer', 'FunnelStage', 'FunnelCard', 'DailyMetric',
  'NPSResponse', 'NPSSurvey', 'Order', 'OrderItem', 'Payment', 'Price',
  'Product', 'Quote', 'QuoteItem', 'Ticket', 'User', 'Session', 'AuditLog',
  'Notification', 'NotificationPreference', 'ChatbotFlow', 'ChatbotNode',
  'ChatbotExecution', 'ChatbotTrigger', 'QuickResponse', 'ChatbotAnalytics',
  'WebhookDelivery', 'WebhookEndpoint', 'WhatsChannel', 'WhatsMessage', 'TicketComment',
  'OrderHistory'
];

function findCreatesWithoutId() {
  const files = glob.sync('**/*.ts', { cwd: rootDir, absolute: true });
  const results = [];

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Procurar por .create({ ou .create({
      if (line.includes('.create({')) {
        // Verificar se a próxima linha tem 'data:'
        if (lines[i + 1] && lines[i + 1].includes('data:')) {
          const dataLineIdx = i + 1;
          const dataStartIdx = i + 1;

          // Buscar as próximas 5 linhas para ver se tem 'id:'
          let hasId = false;
          for (let j = dataStartIdx; j < Math.min(dataStartIdx + 10, lines.length); j++) {
            if (lines[j].includes('}')) break; // fim do data object
            if (lines[j].trim().startsWith('id:')) {
              hasId = true;
              break;
            }
          }

          if (!hasId) {
            results.push({
              file: file.replace(rootDir, ''),
              line: i + 1,
              code: lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 8)).join('\n')
            });
          }
        }
      }
    }
  });

  return results;
}

console.log('🔍 Buscando .create() sem ID...\n');
const results = findCreatesWithoutId();

if (results.length === 0) {
  console.log('✅ Nenhum .create() sem ID encontrado!');
} else {
  console.log(`⚠️  Encontrados ${results.length} locais sem ID:\n`);
  results.forEach((r, i) => {
    console.log(`${i + 1}. ${r.file}:${r.line}`);
    console.log('```typescript');
    console.log(r.code);
    console.log('```\n');
  });
}

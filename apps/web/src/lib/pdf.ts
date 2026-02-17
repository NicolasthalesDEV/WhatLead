import puppeteer from 'puppeteer';

export interface PdfGenerationOptions {
  html: string;
  filename?: string;
  format?: 'A4' | 'Letter';
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
}

/**
 * Generate a PDF from HTML content using Puppeteer
 */
export async function generatePdf(options: PdfGenerationOptions): Promise<Buffer> {
  const {
    html,
    format = 'A4',
    margin = {
      top: '20mm',
      right: '20mm',
      bottom: '20mm',
      left: '20mm',
    },
  } = options;

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format,
      margin,
      printBackground: true,
      preferCSSPageSize: false,
    });

    return Buffer.from(pdf);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Generate quote PDF HTML template
 */
export function generateQuoteHtml(quote: any, company: any): string {
  const items = quote.items || [];
  const total = quote.total || 0;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Arial', sans-serif;
          font-size: 12px;
          color: #333;
          padding: 20px;
        }
        
        .header {
          border-bottom: 3px solid #3b82f6;
          padding-bottom: 20px;
          margin-bottom: 30px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        
        .company-info {
          flex: 1;
        }
        
        .company-name {
          font-size: 24px;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 10px;
        }
        
        .company-details {
          color: #666;
          line-height: 1.6;
        }
        
        .quote-info {
          text-align: right;
        }
        
        .quote-title {
          font-size: 28px;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 10px;
        }
        
        .quote-number {
          font-size: 14px;
          color: #666;
          margin-bottom: 5px;
        }
        
        .quote-date {
          font-size: 12px;
          color: #999;
        }
        
        .customer-section {
          background: #f3f4f6;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 30px;
        }
        
        .section-title {
          font-size: 14px;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 10px;
        }
        
        .customer-name {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        
        thead {
          background: #3b82f6;
          color: white;
        }
        
        th {
          text-align: left;
          padding: 12px 10px;
          font-weight: bold;
        }
        
        td {
          padding: 10px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        tbody tr:hover {
          background: #f9fafb;
        }
        
        .text-right {
          text-align: right;
        }
        
        .text-center {
          text-align: center;
        }
        
        .totals {
          display: flex;
          justify-content: flex-end;
          margin-top: 20px;
        }
        
        .totals-box {
          width: 300px;
          border: 2px solid #3b82f6;
          border-radius: 5px;
          padding: 15px;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .total-row:last-child {
          border-bottom: none;
          font-size: 18px;
          font-weight: bold;
          color: #1e40af;
          padding-top: 15px;
        }
        
        .notes {
          margin-top: 30px;
          padding: 15px;
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          border-radius: 3px;
        }
        
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          text-align: center;
          color: #666;
          font-size: 11px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-info">
          <div class="company-name">${company.name || 'Empresa'}</div>
          <div class="company-details">
            ${company.email ? `<div>Email: ${company.email}</div>` : ''}
            ${company.phone ? `<div>Telefone: ${company.phone}</div>` : ''}
            ${company.address ? `<div>${company.address}</div>` : ''}
            ${company.city || company.state ? `<div>${company.city || ''}${company.city && company.state ? ', ' : ''}${company.state || ''}</div>` : ''}
          </div>
        </div>
        <div class="quote-info">
          <div class="quote-title">ORÇAMENTO</div>
          <div class="quote-number">#${quote.id.slice(-8).toUpperCase()}</div>
          <div class="quote-date">${new Date(quote.createdAt).toLocaleDateString('pt-BR')}</div>
        </div>
      </div>
      
      <div class="customer-section">
        <div class="section-title">CLIENTE</div>
        <div class="customer-name">${quote.customer?.name || 'Cliente'}</div>
        ${quote.customer?.email ? `<div>Email: ${quote.customer.email}</div>` : ''}
        ${quote.customer?.phoneE164 ? `<div>Telefone: ${quote.customer.phoneE164}</div>` : ''}
      </div>
      
      <table>
        <thead>
          <tr>
            <th style="width: 50%">Produto/Serviço</th>
            <th class="text-center" style="width: 15%">Qtd.</th>
            <th class="text-right" style="width: 17.5%">Preço Unit.</th>
            <th class="text-right" style="width: 17.5%">Total</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item: any) => `
            <tr>
              <td>
                <strong>${item.product?.title || 'Produto'}</strong>
                ${item.product?.description ? `<br><small style="color: #666;">${item.product.description}</small>` : ''}
              </td>
              <td class="text-center">${item.quantity}</td>
              <td class="text-right">R$ ${(item.priceCents / 100).toFixed(2)}</td>
              <td class="text-right"><strong>R$ ${((item.quantity * item.priceCents) / 100).toFixed(2)}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="totals">
        <div class="totals-box">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>R$ ${(total / 100).toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span><strong>TOTAL:</strong></span>
            <span><strong>R$ ${(total / 100).toFixed(2)}</strong></span>
          </div>
        </div>
      </div>
      
      ${quote.notes ? `
        <div class="notes">
          <div class="section-title" style="margin-bottom: 10px;">OBSERVAÇÕES</div>
          <div>${quote.notes}</div>
        </div>
      ` : ''}
      
      <div class="footer">
        <div>Este orçamento tem validade de 30 dias a partir da data de emissão.</div>
        <div style="margin-top: 10px;">
          ${company.name || 'Empresa'} - ${company.document ? `CNPJ: ${company.document}` : ''}
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate order PDF HTML template
 */
export function generateOrderHtml(order: any, company: any): string {
  const items = order.items || [];
  const total = order.total || 0;

  const statusLabels: Record<string, string> = {
    PENDING: 'Pendente',
    CONFIRMED: 'Confirmado',
    PROCESSING: 'Em Processamento',
    SHIPPED: 'Enviado',
    DELIVERED: 'Entregue',
    CANCELLED: 'Cancelado',
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Arial', sans-serif;
          font-size: 12px;
          color: #333;
          padding: 20px;
        }
        
        .header {
          border-bottom: 3px solid #10b981;
          padding-bottom: 20px;
          margin-bottom: 30px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        
        .company-info {
          flex: 1;
        }
        
        .company-name {
          font-size: 24px;
          font-weight: bold;
          color: #059669;
          margin-bottom: 10px;
        }
        
        .company-details {
          color: #666;
          line-height: 1.6;
        }
        
        .order-info {
          text-align: right;
        }
        
        .order-title {
          font-size: 28px;
          font-weight: bold;
          color: #059669;
          margin-bottom: 10px;
        }
        
        .order-number {
          font-size: 14px;
          color: #666;
          margin-bottom: 5px;
        }
        
        .order-date {
          font-size: 12px;
          color: #999;
        }
        
        .status-badge {
          display: inline-block;
          padding: 5px 15px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: bold;
          margin-top: 10px;
        }
        
        .status-CONFIRMED {
          background: #d1fae5;
          color: #065f46;
        }
        
        .status-PENDING {
          background: #fef3c7;
          color: #92400e;
        }
        
        .status-PROCESSING {
          background: #dbeafe;
          color: #1e40af;
        }
        
        .status-SHIPPED {
          background: #e0e7ff;
          color: #3730a3;
        }
        
        .status-DELIVERED {
          background: #d1fae5;
          color: #065f46;
        }
        
        .status-CANCELLED {
          background: #fee2e2;
          color: #991b1b;
        }
        
        .customer-section {
          background: #f3f4f6;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 30px;
        }
        
        .section-title {
          font-size: 14px;
          font-weight: bold;
          color: #059669;
          margin-bottom: 10px;
        }
        
        .customer-name {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        
        thead {
          background: #10b981;
          color: white;
        }
        
        th {
          text-align: left;
          padding: 12px 10px;
          font-weight: bold;
        }
        
        td {
          padding: 10px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        tbody tr:hover {
          background: #f9fafb;
        }
        
        .text-right {
          text-align: right;
        }
        
        .text-center {
          text-align: center;
        }
        
        .totals {
          display: flex;
          justify-content: flex-end;
          margin-top: 20px;
        }
        
        .totals-box {
          width: 300px;
          border: 2px solid #10b981;
          border-radius: 5px;
          padding: 15px;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .total-row:last-child {
          border-bottom: none;
          font-size: 18px;
          font-weight: bold;
          color: #059669;
          padding-top: 15px;
        }
        
        .notes {
          margin-top: 30px;
          padding: 15px;
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          border-radius: 3px;
        }
        
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          text-align: center;
          color: #666;
          font-size: 11px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-info">
          <div class="company-name">${company.name || 'Empresa'}</div>
          <div class="company-details">
            ${company.email ? `<div>Email: ${company.email}</div>` : ''}
            ${company.phone ? `<div>Telefone: ${company.phone}</div>` : ''}
            ${company.address ? `<div>${company.address}</div>` : ''}
            ${company.city || company.state ? `<div>${company.city || ''}${company.city && company.state ? ', ' : ''}${company.state || ''}</div>` : ''}
          </div>
        </div>
        <div class="order-info">
          <div class="order-title">PEDIDO</div>
          <div class="order-number">#${order.id.slice(-8).toUpperCase()}</div>
          <div class="order-date">${new Date(order.createdAt).toLocaleDateString('pt-BR')}</div>
          <div class="status-badge status-${order.status}">
            ${statusLabels[order.status] || order.status}
          </div>
        </div>
      </div>
      
      <div class="customer-section">
        <div class="section-title">CLIENTE</div>
        <div class="customer-name">${order.customer?.name || 'Cliente'}</div>
        ${order.customer?.email ? `<div>Email: ${order.customer.email}</div>` : ''}
        ${order.customer?.phoneE164 ? `<div>Telefone: ${order.customer.phoneE164}</div>` : ''}
      </div>
      
      <table>
        <thead>
          <tr>
            <th style="width: 50%">Produto/Serviço</th>
            <th class="text-center" style="width: 15%">Qtd.</th>
            <th class="text-right" style="width: 17.5%">Preço Unit.</th>
            <th class="text-right" style="width: 17.5%">Total</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item: any) => `
            <tr>
              <td>
                <strong>${item.product?.title || 'Produto'}</strong>
                ${item.product?.description ? `<br><small style="color: #666;">${item.product.description}</small>` : ''}
              </td>
              <td class="text-center">${item.quantity}</td>
              <td class="text-right">R$ ${(item.unitPrice / 100).toFixed(2)}</td>
              <td class="text-right"><strong>R$ ${((item.quantity * item.unitPrice) / 100).toFixed(2)}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="totals">
        <div class="totals-box">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>R$ ${(total / 100).toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span><strong>TOTAL:</strong></span>
            <span><strong>R$ ${(total / 100).toFixed(2)}</strong></span>
          </div>
        </div>
      </div>
      
      ${order.notes ? `
        <div class="notes">
          <div class="section-title" style="margin-bottom: 10px;">OBSERVAÇÕES</div>
          <div>${order.notes}</div>
        </div>
      ` : ''}
      
      <div class="footer">
        <div>Obrigado pela sua preferência!</div>
        <div style="margin-top: 10px;">
          ${company.name || 'Empresa'} - ${company.document ? `CNPJ: ${company.document}` : ''}
        </div>
      </div>
    </body>
    </html>
  `;
}

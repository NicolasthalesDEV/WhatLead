/**
 * Gateway de Pagamento PIX
 * 
 * Provedores suportados:
 * - mercadopago: Mercado Pago
 * - asaas: Asaas
 * 
 * Configure via variável de ambiente PSP_PROVIDER
 */

// Tipos
export type PixCharge = {
  chargeId: string;
  emv: string; // PIX copia e cola (código EMV)
  qrCodeImage: string; // URL da imagem do QR Code ou data URL
  expiresAt: string; // ISO 8601
  amount: number;
  status?: 'pending' | 'paid' | 'expired' | 'cancelled';
};

export type PixChargeStatus = {
  chargeId: string;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  paidAt?: string;
  paidAmount?: number;
};

export type PixWebhookData = {
  chargeId: string;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  paidAt?: Date;
  paidAmount?: number;
  externalId?: string;
  metadata?: Record<string, any>;
};

export interface PixProvider {
  /**
   * Cria uma cobrança PIX
   * @param orderId - ID do pedido (para rastreamento)
   * @param amount - Valor em centavos (ex: 10000 = R$ 100,00)
   * @param description - Descrição da cobrança
   * @param customer - Dados do cliente (opcional)
   */
  createCharge(
    orderId: string,
    amount: number,
    description: string,
    customer?: {
      name?: string;
      email?: string;
      phone?: string;
      document?: string;
    }
  ): Promise<PixCharge>;

  /**
   * Consulta o status de uma cobrança
   * @param chargeId - ID da cobrança retornado por createCharge
   */
  getChargeStatus(chargeId: string): Promise<PixChargeStatus>;

  /**
   * Cancela uma cobrança (se suportado)
   * @param chargeId - ID da cobrança
   */
  cancelCharge?(chargeId: string): Promise<void>;

  /**
   * Processa dados do webhook
   * @param payload - Payload do webhook
   */
  processWebhook?(payload: any): Promise<PixWebhookData | null>;
}

// =============================================================================
// MERCADO PAGO
// =============================================================================

class MercadoPagoPixProvider implements PixProvider {
  private accessToken: string;
  private apiUrl = 'https://api.mercadopago.com/v1';

  constructor() {
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!token) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN not configured');
    }
    this.accessToken = token;
  }

  async createCharge(
    orderId: string,
    amount: number,
    description: string,
    customer?: any
  ): Promise<PixCharge> {
    const payload = {
      transaction_amount: amount / 100, // Mercado Pago usa reais
      description,
      payment_method_id: 'pix',
      external_reference: orderId,
      payer: customer ? {
        email: customer.email,
        first_name: customer.name?.split(' ')[0],
        last_name: customer.name?.split(' ').slice(1).join(' '),
        identification: customer.document ? {
          type: customer.document.length === 11 ? 'CPF' : 'CNPJ',
          number: customer.document,
        } : undefined,
      } : undefined,
    };

    const response = await fetch(`${this.apiUrl}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Mercado Pago Error:', data);
      throw new Error(`Mercado Pago Error: ${data.message || 'Unknown error'}`);
    }

    return {
      chargeId: data.id.toString(),
      emv: data.point_of_interaction.transaction_data.qr_code,
      qrCodeImage: data.point_of_interaction.transaction_data.qr_code_base64 
        ? `data:image/png;base64,${data.point_of_interaction.transaction_data.qr_code_base64}`
        : '',
      expiresAt: data.date_of_expiration || new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      amount,
      status: 'pending',
    };
  }

  async getChargeStatus(chargeId: string): Promise<PixChargeStatus> {
    const response = await fetch(`${this.apiUrl}/payments/${chargeId}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Mercado Pago Error: ${data.message || 'Unknown error'}`);
    }

    const statusMap: Record<string, PixChargeStatus['status']> = {
      'pending': 'pending',
      'approved': 'paid',
      'authorized': 'paid',
      'in_process': 'pending',
      'in_mediation': 'pending',
      'rejected': 'cancelled',
      'cancelled': 'cancelled',
      'refunded': 'cancelled',
      'charged_back': 'cancelled',
    };

    return {
      chargeId,
      status: statusMap[data.status] || 'pending',
      paidAt: data.date_approved,
      paidAmount: data.status === 'approved' ? data.transaction_amount * 100 : undefined,
    };
  }

  async processWebhook(payload: any): Promise<PixWebhookData | null> {
    if (payload.type !== 'payment') {
      return null;
    }

    const paymentId = payload.data?.id;
    if (!paymentId) {
      return null;
    }

    const status = await this.getChargeStatus(paymentId.toString());

    return {
      chargeId: status.chargeId,
      status: status.status,
      paidAt: status.paidAt ? new Date(status.paidAt) : undefined,
      paidAmount: status.paidAmount,
      externalId: paymentId.toString(),
      metadata: payload,
    };
  }
}

// =============================================================================
// ASAAS
// =============================================================================

class AsaasPixProvider implements PixProvider {
  private apiKey: string;
  private apiUrl = 'https://www.asaas.com/api/v3';

  constructor() {
    const key = process.env.ASAAS_API_KEY;
    if (!key) {
      throw new Error('ASAAS_API_KEY not configured');
    }
    this.apiKey = key;

    // Sandbox mode
    if (process.env.ASAAS_SANDBOX === 'true') {
      this.apiUrl = 'https://sandbox.asaas.com/api/v3';
    }
  }

  async createCharge(
    orderId: string,
    amount: number,
    description: string,
    customer?: any
  ): Promise<PixCharge> {
    // 1. Criar ou buscar cliente no Asaas
    let asaasCustomerId: string;

    if (customer?.email || customer?.document) {
      const searchParams = new URLSearchParams();
      if (customer.email) searchParams.set('email', customer.email);
      if (customer.document) searchParams.set('cpfCnpj', customer.document);

      const searchResponse = await fetch(`${this.apiUrl}/customers?${searchParams}`, {
        headers: {
          'access_token': this.apiKey,
        },
      });

      const searchData = await searchResponse.json();

      if (searchData.data && searchData.data.length > 0) {
        asaasCustomerId = searchData.data[0].id;
      } else {
        // Criar cliente
        const createCustomerResponse = await fetch(`${this.apiUrl}/customers`, {
          method: 'POST',
          headers: {
            'access_token': this.apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: customer.name || 'Cliente',
            email: customer.email,
            phone: customer.phone,
            cpfCnpj: customer.document,
          }),
        });

        const createCustomerData = await createCustomerResponse.json();
        asaasCustomerId = createCustomerData.id;
      }
    } else {
      // Cliente genérico
      const defaultCustomer = await fetch(`${this.apiUrl}/customers`, {
        method: 'POST',
        headers: {
          'access_token': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Cliente',
          cpfCnpj: '00000000000',
        }),
      });
      const data = await defaultCustomer.json();
      asaasCustomerId = data.id;
    }

    // 2. Criar cobrança PIX
    const payload = {
      customer: asaasCustomerId,
      billingType: 'PIX',
      value: amount / 100, // Asaas usa reais
      dueDate: new Date(Date.now() + 15 * 60 * 1000).toISOString().split('T')[0],
      description,
      externalReference: orderId,
    };

    const response = await fetch(`${this.apiUrl}/payments`, {
      method: 'POST',
      headers: {
        'access_token': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Asaas Error:', data);
      throw new Error(`Asaas Error: ${data.errors?.[0]?.description || 'Unknown error'}`);
    }

    // 3. Obter QR Code PIX
    const qrCodeResponse = await fetch(`${this.apiUrl}/payments/${data.id}/pixQrCode`, {
      headers: {
        'access_token': this.apiKey,
      },
    });

    const qrCodeData = await qrCodeResponse.json();

    return {
      chargeId: data.id,
      emv: qrCodeData.payload,
      qrCodeImage: qrCodeData.encodedImage 
        ? `data:image/png;base64,${qrCodeData.encodedImage}`
        : '',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      amount,
      status: 'pending',
    };
  }

  async getChargeStatus(chargeId: string): Promise<PixChargeStatus> {
    const response = await fetch(`${this.apiUrl}/payments/${chargeId}`, {
      headers: {
        'access_token': this.apiKey,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Asaas Error: ${data.errors?.[0]?.description || 'Unknown error'}`);
    }

    const statusMap: Record<string, PixChargeStatus['status']> = {
      'PENDING': 'pending',
      'RECEIVED': 'paid',
      'CONFIRMED': 'paid',
      'OVERDUE': 'expired',
      'REFUNDED': 'cancelled',
      'RECEIVED_IN_CASH': 'paid',
      'REFUND_REQUESTED': 'cancelled',
    };

    return {
      chargeId,
      status: statusMap[data.status] || 'pending',
      paidAt: data.paymentDate,
      paidAmount: data.value ? data.value * 100 : undefined,
    };
  }

  async processWebhook(payload: any): Promise<PixWebhookData | null> {
    const event = payload.event;
    const paymentId = payload.payment?.id;

    if (!paymentId || !['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED'].includes(event)) {
      return null;
    }

    const status = await this.getChargeStatus(paymentId);

    return {
      chargeId: status.chargeId,
      status: status.status,
      paidAt: status.paidAt ? new Date(status.paidAt) : undefined,
      paidAmount: status.paidAmount,
      externalId: paymentId,
      metadata: payload,
    };
  }
}

// =============================================================================
// PROVIDER FACTORY
// =============================================================================

export function getPixProvider(): PixProvider {
  const provider = process.env.PSP_PROVIDER || 'mercadopago';

  switch (provider.toLowerCase()) {
    case 'mercadopago':
      return new MercadoPagoPixProvider();
    
    case 'asaas':
      return new AsaasPixProvider();
    
    default:
      throw new Error(`PSP_PROVIDER "${provider}" não suportado. Use: mercadopago, asaas`);
  }
}


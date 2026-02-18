/**
 * Mercado Pago Subscription Client
 * 
 * Gerencia assinaturas recorrentes via Mercado Pago
 * Documentação: https://www.mercadopago.com.br/developers/pt/docs/subscriptions/integration
 */

const MP_API_URL = 'https://api.mercadopago.com/preapproval';
const MP_API_VERSION = 'v1';

interface MercadoPagoSubscription {
  id: string;
  payer_id: number;
  payer_email: string;
  back_url: string;
  collector_id: number;
  application_id: number;
  status: 'pending' | 'authorized' | 'paused' | 'cancelled';
  reason: string;
  external_reference: string;
  date_created: string;
  last_modified: string;
  init_point: string;
  auto_recurring: {
    frequency: number;
    frequency_type: 'days' | 'months';
    transaction_amount: number;
    currency_id: string;
    start_date?: string;
    end_date?: string;
  };
}

interface CreateSubscriptionParams {
  reason: string; // Nome do plano
  auto_recurring: {
    frequency: number; // 1
    frequency_type: 'months' | 'days'; // 'months'
    transaction_amount: number; // 197.00
    currency_id: string; // 'BRL'
    start_date?: string;
  };
  back_url: string;
  external_reference: string; // companyId
  payer_email: string;
}

export class MercadoPagoSubscriptionClient {
  private accessToken: string;

  constructor() {
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!token) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN not configured');
    }
    this.accessToken = token;
  }

  /**
   * Cria uma assinatura recorrente
   */
  async createSubscription(params: CreateSubscriptionParams): Promise<MercadoPagoSubscription> {
    const response = await fetch(MP_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Mercado Pago Subscription Error:', data);
      throw new Error(data.message || 'Erro ao criar assinatura no Mercado Pago');
    }

    return data;
  }

  /**
   * Obtém informações de uma assinatura
   */
  async getSubscription(subscriptionId: string): Promise<MercadoPagoSubscription> {
    const response = await fetch(`${MP_API_URL}/${subscriptionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao buscar assinatura');
    }

    return data;
  }

  /**
   * Pausa uma assinatura
   */
  async pauseSubscription(subscriptionId: string): Promise<void> {
    const response = await fetch(`${MP_API_URL}/${subscriptionId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'paused' }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Erro ao pausar assinatura');
    }
  }

  /**
   * Cancela uma assinatura
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    const response = await fetch(`${MP_API_URL}/${subscriptionId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'cancelled' }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Erro ao cancelar assinatura');
    }
  }
}

// Planos disponíveis
export const PLANS = {
  free: {
    id: 'free',
    name: 'Gratuito',
    price: 0,
    features: [
      'Até 100 contatos',
      'Até 500 mensagens/mês',
      '1 usuário',
      'Funil básico',
    ],
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 97, // em reais
    priceMonthly: 97,
    priceYearly: 970, // 10 meses
    features: [
      'Até 1.000 contatos',
      'Mensagens ilimitadas',
      'Até 3 usuários',
      'Funil completo',
      'Chatbot básico',
      'Respostas rápidas',
    ],
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    price: 197,
    priceMonthly: 197,
    priceYearly: 1970,
    features: [
      'Até 10.000 contatos',
      'Mensagens ilimitadas',
      'Até 10 usuários',
      'Funil avançado',
      'Chatbot avançado',
      'Automações',
      'Integrações',
      'Suporte prioritário',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 497,
    priceMonthly: 497,
    priceYearly: 4970,
    features: [
      'Contatos ilimitados',
      'Mensagens ilimitadas',
      'Usuários ilimitados',
      'Tudo do Professional',
      'API dedicada',
      'White label',
      'Gerente de conta',
      'SLA 99.9%',
    ],
  },
};

export type PlanId = keyof typeof PLANS;

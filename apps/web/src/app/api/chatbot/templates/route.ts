import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

// Templates pré-configurados de fluxos de chatbot
const TEMPLATES = [
  {
    id: "welcome",
    name: "Boas-vindas",
    description: "Saudação automática para novos clientes",
    category: "Atendimento",
    icon: "👋",
    nodes: [
      {
        id: "node-1",
        type: "TRIGGER",
        name: "Início",
        config: {},
        position: { x: 100, y: 50 },
        order: 0,
      },
      {
        id: "node-2",
        type: "MESSAGE",
        name: "Mensagem de boas-vindas",
        config: {
          message:
            "Olá! 👋 Bem-vindo ao nosso atendimento.\n\nEu sou o assistente virtual e estou aqui para ajudar você!",
        },
        position: { x: 100, y: 150 },
        order: 1,
      },
      {
        id: "node-3",
        type: "MESSAGE",
        name: "Opções",
        config: {
          message:
            "Como posso ajudar você hoje?\n\n1️⃣ Ver produtos\n2️⃣ Fazer um pedido\n3️⃣ Falar com atendente",
        },
        position: { x: 100, y: 250 },
        order: 2,
      },
      {
        id: "node-4",
        type: "WAIT_INPUT",
        name: "Aguardar resposta",
        config: {},
        position: { x: 100, y: 350 },
        order: 3,
      },
    ],
    triggers: ["oi", "olá", "hello", "ola"],
    triggerType: "KEYWORD",
  },
  {
    id: "qualification",
    name: "Qualificação de Lead",
    description: "Coleta informações do cliente automaticamente",
    category: "Vendas",
    icon: "🎯",
    nodes: [
      {
        id: "node-1",
        type: "TRIGGER",
        name: "Início",
        config: {},
        position: { x: 100, y: 50 },
        order: 0,
      },
      {
        id: "node-2",
        type: "MESSAGE",
        name: "Apresentação",
        config: {
          message:
            "Olá! Vou fazer algumas perguntas rápidas para entender melhor como posso ajudar você. Isso vai levar apenas 1 minuto! 😊",
        },
        position: { x: 100, y: 150 },
        order: 1,
      },
      {
        id: "node-3",
        type: "MESSAGE",
        name: "Pergunta 1",
        config: {
          message: "Qual é o seu nome?",
        },
        position: { x: 100, y: 250 },
        order: 2,
      },
      {
        id: "node-4",
        type: "WAIT_INPUT",
        name: "Esperar nome",
        config: {},
        position: { x: 100, y: 350 },
        order: 3,
      },
      {
        id: "node-5",
        type: "ACTION",
        name: "Salvar nome",
        config: {
          action: "save_variable",
          variable: "customerName",
        },
        position: { x: 100, y: 450 },
        order: 4,
      },
      {
        id: "node-6",
        type: "MESSAGE",
        name: "Pergunta 2",
        config: {
          message: "Prazer, {{customerName}}! Qual é o seu email?",
        },
        position: { x: 100, y: 550 },
        order: 5,
      },
      {
        id: "node-7",
        type: "WAIT_INPUT",
        name: "Esperar email",
        config: {},
        position: { x: 100, y: 650 },
        order: 6,
      },
      {
        id: "node-8",
        type: "ACTION",
        name: "Salvar email",
        config: {
          action: "save_variable",
          variable: "customerEmail",
        },
        position: { x: 100, y: 750 },
        order: 7,
      },
      {
        id: "node-9",
        type: "MESSAGE",
        name: "Agradecimento",
        config: {
          message:
            "Perfeito! Já temos tudo que precisamos. Em breve um de nossos consultores entrará em contato com você! 🎉",
        },
        position: { x: 100, y: 850 },
        order: 8,
      },
      {
        id: "node-10",
        type: "ASSIGN_TAGS",
        name: "Marcar como lead",
        config: {
          tags: ["lead", "qualificado"],
        },
        position: { x: 100, y: 950 },
        order: 9,
      },
    ],
    triggers: ["qualificação", "qualificacao", "informações", "informacoes"],
    triggerType: "KEYWORD",
  },
  {
    id: "order-status",
    name: "Consulta de Pedido",
    description: "Cliente consulta status do pedido",
    category: "Atendimento",
    icon: "📦",
    nodes: [
      {
        id: "node-1",
        type: "TRIGGER",
        name: "Início",
        config: {},
        position: { x: 100, y: 50 },
        order: 0,
      },
      {
        id: "node-2",
        type: "MESSAGE",
        name: "Solicitar número",
        config: {
          message:
            "Para consultar seu pedido, por favor me informe o número do pedido:",
        },
        position: { x: 100, y: 150 },
        order: 1,
      },
      {
        id: "node-3",
        type: "WAIT_INPUT",
        name: "Esperar número",
        config: {},
        position: { x: 100, y: 250 },
        order: 2,
      },
      {
        id: "node-4",
        type: "ACTION",
        name: "Salvar número",
        config: {
          action: "save_variable",
          variable: "orderId",
        },
        position: { x: 100, y: 350 },
        order: 3,
      },
      {
        id: "node-5",
        type: "MESSAGE",
        name: "Confirmar",
        config: {
          message:
            "✅ Seu pedido está em processamento!\n\nPrevisão de entrega: 3-5 dias úteis.\n\nVocê receberá atualizações por aqui.",
        },
        position: { x: 100, y: 450 },
        order: 4,
      },
    ],
    triggers: ["pedido", "status", "rastreio", "entrega"],
    triggerType: "KEYWORD",
  },
  {
    id: "product-catalog",
    name: "Catálogo de Produtos",
    description: "Mostra produtos disponíveis",
    category: "Vendas",
    icon: "🛍️",
    nodes: [
      {
        id: "node-1",
        type: "TRIGGER",
        name: "Início",
        config: {},
        position: { x: 100, y: 50 },
        order: 0,
      },
      {
        id: "node-2",
        type: "MESSAGE",
        name: "Apresentar catálogo",
        config: {
          message:
            "📱 *Nossos Produtos em Destaque:*\n\n1️⃣ Produto Premium - R$ 299,90\n2️⃣ Produto Básico - R$ 149,90\n3️⃣ Produto Deluxe - R$ 499,90\n\nQual te interessa?",
        },
        position: { x: 100, y: 150 },
        order: 1,
      },
      {
        id: "node-3",
        type: "WAIT_INPUT",
        name: "Esperar escolha",
        config: {},
        position: { x: 100, y: 250 },
        order: 2,
      },
      {
        id: "node-4",
        type: "MESSAGE",
        name: "Confirmar interesse",
        config: {
          message:
            "Ótima escolha! 🎉\n\nVou transferir você para um consultor que vai finalizar seu pedido.",
        },
        position: { x: 100, y: 350 },
        order: 3,
      },
      {
        id: "node-5",
        type: "HANDOFF",
        name: "Transferir para humano",
        config: {},
        position: { x: 100, y: 450 },
        order: 4,
      },
    ],
    triggers: ["produtos", "catálogo", "catalogo", "preços", "precos"],
    triggerType: "KEYWORD",
  },
  {
    id: "support",
    name: "Suporte Técnico",
    description: "Triagem de problemas técnicos",
    category: "Suporte",
    icon: "🔧",
    nodes: [
      {
        id: "node-1",
        type: "TRIGGER",
        name: "Início",
        config: {},
        position: { x: 100, y: 50 },
        order: 0,
      },
      {
        id: "node-2",
        type: "MESSAGE",
        name: "Identificar problema",
        config: {
          message:
            "Entendo que você está com um problema. Vamos resolver isso juntos! 🛠️\n\nQual tipo de problema?\n\n1️⃣ Técnico\n2️⃣ Financeiro\n3️⃣ Outro",
        },
        position: { x: 100, y: 150 },
        order: 1,
      },
      {
        id: "node-3",
        type: "WAIT_INPUT",
        name: "Esperar tipo",
        config: {},
        position: { x: 100, y: 250 },
        order: 2,
      },
      {
        id: "node-4",
        type: "CONDITION",
        name: "Verificar tipo",
        config: {
          condition: "lastInput contains 1",
        },
        position: { x: 100, y: 350 },
        order: 3,
      },
      {
        id: "node-5",
        type: "MESSAGE",
        name: "Orientação técnica",
        config: {
          message:
            "Por favor, descreva o problema técnico que você está enfrentando:",
        },
        position: { x: 100, y: 450 },
        order: 4,
      },
      {
        id: "node-6",
        type: "WAIT_INPUT",
        name: "Esperar descrição",
        config: {},
        position: { x: 100, y: 550 },
        order: 5,
      },
      {
        id: "node-7",
        type: "MESSAGE",
        name: "Ticket criado",
        config: {
          message:
            "✅ Ticket de suporte criado!\n\nNúmero: #{{ticketId}}\n\nNossa equipe técnica vai analisar e responder em breve.",
        },
        position: { x: 100, y: 650 },
        order: 6,
      },
    ],
    triggers: ["problema", "erro", "não funciona", "nao funciona", "ajuda", "suporte"],
    triggerType: "KEYWORD",
  },
  {
    id: "nps",
    name: "Pesquisa de Satisfação (NPS)",
    description: "Coleta feedback do cliente",
    category: "Pesquisa",
    icon: "⭐",
    nodes: [
      {
        id: "node-1",
        type: "TRIGGER",
        name: "Início",
        config: {},
        position: { x: 100, y: 50 },
        order: 0,
      },
      {
        id: "node-2",
        type: "MESSAGE",
        name: "Solicitar avaliação",
        config: {
          message:
            "Olá! Gostaríamos de saber sua opinião sobre nosso atendimento. 😊\n\nDe 0 a 10, quanto você recomendaria nossa empresa para um amigo?",
        },
        position: { x: 100, y: 150 },
        order: 1,
      },
      {
        id: "node-3",
        type: "WAIT_INPUT",
        name: "Esperar nota",
        config: {},
        position: { x: 100, y: 250 },
        order: 2,
      },
      {
        id: "node-4",
        type: "ACTION",
        name: "Salvar nota",
        config: {
          action: "save_variable",
          variable: "npsScore",
        },
        position: { x: 100, y: 350 },
        order: 3,
      },
      {
        id: "node-5",
        type: "MESSAGE",
        name: "Agradecer",
        config: {
          message:
            "Obrigado pelo seu feedback! Sua opinião é muito importante para nós. 💙",
        },
        position: { x: 100, y: 450 },
        order: 4,
      },
    ],
    triggers: [],
    triggerType: "ORDER_PAID",
  },
  {
    id: "abandoned-cart",
    name: "Recuperação de Carrinho",
    description: "Lembra cliente sobre carrinho abandonado",
    category: "Vendas",
    icon: "🛒",
    nodes: [
      {
        id: "node-1",
        type: "TRIGGER",
        name: "Início",
        config: {},
        position: { x: 100, y: 50 },
        order: 0,
      },
      {
        id: "node-2",
        type: "DELAY",
        name: "Aguardar 1 hora",
        config: {
          delay: 3600000,
        },
        position: { x: 100, y: 150 },
        order: 1,
      },
      {
        id: "node-3",
        type: "MESSAGE",
        name: "Lembrete",
        config: {
          message:
            "Oi! 👋\n\nReparamos que você deixou alguns itens no carrinho. Quer finalizar sua compra agora?\n\n🎁 Temos um desconto especial de 10% para você!",
        },
        position: { x: 100, y: 250 },
        order: 2,
      },
      {
        id: "node-4",
        type: "WAIT_INPUT",
        name: "Esperar resposta",
        config: {},
        position: { x: 100, y: 350 },
        order: 3,
      },
      {
        id: "node-5",
        type: "CONDITION",
        name: "Cliente interessado?",
        config: {
          condition: "lastInput contains sim",
        },
        position: { x: 100, y: 450 },
        order: 4,
      },
    ],
    triggers: [],
    triggerType: "CUSTOM_EVENT",
  },
];

// GET /api/chatbot/templates - List all templates
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  let filtered = TEMPLATES;
  if (category) {
    filtered = TEMPLATES.filter((t) => t.category === category);
  }

  return NextResponse.json({
    templates: filtered,
    categories: ["Atendimento", "Vendas", "Suporte", "Pesquisa"],
  });
}

// POST /api/chatbot/templates/{id}/create - Create flow from template
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  const { templateId, name } = await req.json();

  const template = TEMPLATES.find((t) => t.id === templateId);
  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  // Create flow from template
  const createRes = await fetch(
    `${req.nextUrl.origin}/api/chatbot/flows`,
    {
      method: "POST",
      headers: {
        Authorization: req.headers.get("Authorization") || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name || template.name,
        description: template.description,
        triggers: template.triggers,
        priority: 5,
      }),
    }
  );

  if (!createRes.ok) {
    return NextResponse.json(
      { error: "Failed to create flow" },
      { status: 500 }
    );
  }

  const { flow } = await createRes.json();

  // Add nodes to flow
  await fetch(
    `${req.nextUrl.origin}/api/chatbot/flows/${flow.id}/nodes`,
    {
      method: "POST",
      headers: {
        Authorization: req.headers.get("Authorization") || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nodes: template.nodes }),
    }
  );

  return NextResponse.json({ flow }, { status: 201 });
}

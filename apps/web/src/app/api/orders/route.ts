import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@wacrm/db";
import { authorize } from "@/lib/authorization";
import { hasPermission } from "@/lib/permissions";
import { z } from "zod";
import crypto from "crypto";

const CreateOrderBody = z.object({
  customerId: z.string(),
  quoteId: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    qty: z.number().int().positive(),
    priceCents: z.number().int().nonnegative(),
  })).min(1),
});

// GET /api/orders - Listar pedidos com filtros
export async function GET(req: NextRequest) {
  const authResult = await authorize(req, 'orders:read');
  if (!authResult.authorized) {
    return authResult.response;
  }

  const { user } = authResult.data;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const customerId = searchParams.get("customerId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const where: any = { companyId: user.companyId };
  if (status) where.status = status;
  if (customerId) where.customerId = customerId;

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      include: {
        Customer: { select: { id: true, name: true, phoneE164: true, email: true } },
        OrderItem: { include: { Product: { select: { id: true, title: true, imageUrl: true } } } },
        Payment: { select: { id: true, status: true, amount: true, provider: true, createdAt: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.order.count({ where }),
  ]);

  // Normalize relation names for the frontend
  const normalized = orders.map(o => ({
    ...o,
    customer: o.Customer,
    items: o.OrderItem,
    payments: o.Payment,
  }));

  return NextResponse.json({
    orders: normalized,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

// POST /api/orders - Criar pedido
export async function POST(req: NextRequest) {
  const authResult = await authorize(req, 'orders:create');
  if (!authResult.authorized) {
    return authResult.response;
  }

  const { user } = authResult.data;

  const body = CreateOrderBody.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Dados inválidos", details: body.error.flatten() }, { status: 400 });
  }

  const { customerId, quoteId, items } = body.data;

  const customer = await db.customer.findFirst({ where: { id: customerId, companyId: user.companyId } });
  if (!customer) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  const total = items.reduce((s, i) => s + i.priceCents * i.qty, 0);

  const order = await db.order.create({
    data: {
      id: crypto.randomUUID(),
      companyId: user.companyId,
      customerId,
      quoteId: quoteId || null,
      status: "PENDING",
      total,
      OrderItem: {
        create: items.map(i => ({
          id: crypto.randomUUID(),
          productId: i.productId,
          qty: i.qty,
          priceCents: i.priceCents,
        })),
      },
    },
    include: {
      Customer: { select: { id: true, name: true, phoneE164: true } },
      OrderItem: { include: { Product: { select: { id: true, title: true } } } },
    },
  });

  return NextResponse.json({ order }, { status: 201 });
}


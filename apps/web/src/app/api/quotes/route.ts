import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wacrm/db";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import crypto from "crypto";

const Body = z.object({
  customerId: z.string(),
  items: z.array(z.object({
    productId: z.string(),
    qty: z.number().int().positive(),
    priceCents: z.number().int().nonnegative()
  })).min(1)
});

// GET /api/quotes - Listar orçamentos
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res!;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const customerId = searchParams.get("customerId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const where: any = { companyId: auth.companyId! };
  if (status) where.status = status;
  if (customerId) where.customerId = customerId;

  const [quotes, total] = await Promise.all([
    prisma.quote.findMany({
      where,
      include: {
        Customer: { select: { id: true, name: true, phoneE164: true } },
        QuoteItem: {
          include: { Product: { select: { id: true, title: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    }),
    prisma.quote.count({ where }),
  ]);

  return NextResponse.json({ quotes, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
}

// POST /api/quotes - Criar orçamento
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res!;
  const json = await req.json();
  const body = Body.safeParse(json);
  if (!body.success) return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Invalid body" } }, { status: 400 });

  const total = body.data.items.reduce((sum, i) => sum + i.priceCents * i.qty, 0);
  const q = await prisma.quote.create({
    data: {
      id: crypto.randomUUID(),
      companyId: auth.companyId!,
      customerId: body.data.customerId,
      status: "DRAFT",
      total,
      QuoteItem: { create: body.data.items.map(i => ({ id: crypto.randomUUID(), productId: i.productId, qty: i.qty, priceCents: i.priceCents })) }
    }
  });
  return NextResponse.json({ quote: q });
}


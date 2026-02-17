import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@wacrm/db";
import { z } from "zod";
import { authorize } from "@/lib/authorization";

const CreateProductBody = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  category: z.string().optional(),
  sku: z.string().optional(),
  stock: z.number().int().optional(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
  priceAmount: z.number().int().min(0).optional(),
});

// GET /api/products - Listar produtos
export async function GET(req: NextRequest) {
  const authResult = await authorize(req, 'products:read');
  if (!authResult.authorized) {
    return authResult.response;
  }

  const { user } = authResult.data;
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const active = searchParams.get("active");
  const featured = searchParams.get("featured");

  const where: any = {
    companyId: user.companyId,
  };

  if (category) {
    where.category = category;
  }

  if (active !== null) {
    where.active = active === "true";
  }

  if (featured !== null) {
    where.featured = featured === "true";
  }

  const products = await db.product.findMany({
    where,
    include: {
      prices: {
        where: { active: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      _count: {
        select: {
          quoteItems: true,
          orderItems: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ products });
}

// POST /api/products - Criar produto
export async function POST(req: NextRequest) {
  const authResult = await authorize(req, 'products:create');
  if (!authResult.authorized) {
    return authResult.response;
  }

  const { user } = authResult.data;
  const json = await req.json();
  const body = CreateProductBody.safeParse(json);

  if (!body.success) {
    return NextResponse.json(
      { error: "Invalid body", details: body.error.errors },
      { status: 400 }
    );
  }

  const slug = body.data.title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const productData: any = {
    id: crypto.randomUUID(),
    companyId: user.companyId,
    title: body.data.title,
    slug,
    description: body.data.description,
    imageUrl: body.data.imageUrl,
    category: body.data.category,
    sku: body.data.sku,
    stock: body.data.stock,
    active: body.data.active ?? true,
    featured: body.data.featured ?? false,
  };

  // Se forneceu preço, criar junto
  if (body.data.priceAmount !== undefined) {
    productData.prices = {
      create: {
        id: crypto.randomUUID(),
        amount: body.data.priceAmount,
      },
    };
  }

  const product = await db.product.create({
    data: productData,
    include: {
      prices: true,
    },
  });

  return NextResponse.json({ product }, { status: 201 });
}

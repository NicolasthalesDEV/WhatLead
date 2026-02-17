import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@wacrm/db";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";

const UpdateProductBody = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().nullable(),
  category: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  stock: z.number().int().optional().nullable(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
});

// GET /api/products/[id] - Obter detalhes do produto
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const product = await db.product.findFirst({
    where: {
      id: params.id,
      companyId: authResult.companyId,
    },
    include: {
      prices: {
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: {
          quoteItems: true,
          orderItems: true,
        },
      },
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ product });
}

// PATCH /api/products/[id] - Atualizar produto
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json();
  const body = UpdateProductBody.safeParse(json);

  if (!body.success) {
    return NextResponse.json(
      { error: "Invalid body", details: body.error.errors },
      { status: 400 }
    );
  }

  // Verificar se o produto existe
  const existingProduct = await db.product.findFirst({
    where: {
      id: params.id,
      companyId: authResult.companyId,
    },
  });

  if (!existingProduct) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const updateData: any = {};

  if (body.data.title !== undefined) {
    updateData.title = body.data.title;
    // Atualizar slug se mudar o título
    updateData.slug = body.data.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  if (body.data.description !== undefined) updateData.description = body.data.description;
  if (body.data.imageUrl !== undefined) updateData.imageUrl = body.data.imageUrl;
  if (body.data.category !== undefined) updateData.category = body.data.category;
  if (body.data.sku !== undefined) updateData.sku = body.data.sku;
  if (body.data.stock !== undefined) updateData.stock = body.data.stock;
  if (body.data.active !== undefined) updateData.active = body.data.active;
  if (body.data.featured !== undefined) updateData.featured = body.data.featured;

  const product = await db.product.update({
    where: { id: params.id },
    data: updateData,
    include: {
      prices: {
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: {
          quoteItems: true,
          orderItems: true,
        },
      },
    },
  });

  return NextResponse.json({ product });
}

// DELETE /api/products/[id] - Deletar produto
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAuth(req);
  if (!authResult.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const product = await db.product.findFirst({
    where: {
      id: params.id,
      companyId: authResult.companyId,
    },
    include: {
      _count: {
        select: {
          orderItems: true,
          quoteItems: true,
        },
      },
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // Não permitir deletar produtos com pedidos/orçamentos
  if (product._count.orderItems > 0 || product._count.quoteItems > 0) {
    return NextResponse.json(
      {
        error: "Cannot delete product with existing orders or quotes",
        details: {
          orders: product._count.orderItems,
          quotes: product._count.quoteItems,
        },
      },
      { status: 400 }
    );
  }

  await db.product.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true });
}

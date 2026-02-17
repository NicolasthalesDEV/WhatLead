import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@wacrm/db";
import { authorize } from "@/lib/authorization";
import { hasPermission } from "@/lib/permissions";

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

  // Check if user can read all orders or only their own
  const canReadAll = hasPermission(user.role, 'orders:read_all');

  const where: any = {
    companyId: user.companyId,
  };

  // If user cannot read all, filter by userId
  if (!canReadAll) {
    where.userId = user.id;
  }

  if (status) {
    where.status = status;
  }

  if (customerId) {
    where.customerId = customerId;
  }

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phoneE164: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                imageUrl: true,
              },
            },
          },
        },
        payments: {
          select: {
            id: true,
            status: true,
            amount: true,
            provider: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            items: true,
            payments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),
    db.order.count({ where }),
  ]);

  return NextResponse.json({
    orders,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}

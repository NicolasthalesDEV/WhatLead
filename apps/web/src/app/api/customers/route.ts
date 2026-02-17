import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@wacrm/db";
import crypto from "crypto";

// Validation schemas
const CreateCustomerBody = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  phoneE164: z.string().min(1, "Telefone é obrigatório"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  tags: z.array(z.string()).optional(),
});

// GET /api/customers - List customers with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const tag = searchParams.get("tag");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      companyId: "company-1", // TODO: Get from auth
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phoneE164: { contains: search } },
      ];
    }

    if (tag) {
      where.tags = { has: tag };
    }

    // Fetch customers with counts
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          _count: {
            select: {
              Order: true,
              Quote: true,
              WhatsMessage: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.customer.count({ where }),
    ]);

    return NextResponse.json({
      customers: customers.map((customer) => ({
        ...customer,
        _count: {
          orders: customer._count.Order,
          quotes: customer._count.Quote,
          messages: customer._count.WhatsMessage,
        },
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Erro ao buscar clientes" },
      { status: 500 }
    );
  }
}

// POST /api/customers - Create customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = CreateCustomerBody.parse(body);

    // Check if phone already exists
    const existing = await prisma.customer.findUnique({
      where: { phoneE164: data.phoneE164 },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Cliente com este telefone já existe" },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.create({
      data: {
        id: crypto.randomUUID(),
        companyId: "company-1", // TODO: Get from auth
        name: data.name,
        phoneE164: data.phoneE164,
        email: data.email || null,
        tags: data.tags || [],
      },
      include: {
        _count: {
          select: {
            Order: true,
            Quote: true,
            WhatsMessage: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        customer: {
          ...customer,
          _count: {
            orders: customer._count.Order,
            quotes: customer._count.Quote,
            messages: customer._count.WhatsMessage,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating customer:", error);
    return NextResponse.json(
      { error: "Erro ao criar cliente" },
      { status: 500 }
    );
  }
}

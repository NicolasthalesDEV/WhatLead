import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@wacrm/db";
import { requireAuth } from "@/lib/auth";
import crypto from "crypto";
import {
  errorResponse,
  UnauthorizedError,
  ValidationError,
  DuplicatePhoneError,
  InvalidPhoneError,
  MissingFieldError
} from "@/lib/errors";

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
    const authResult = await requireAuth(request);
    if (!authResult.ok) {
      throw new UnauthorizedError();
    }
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const tag = searchParams.get("tag");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      companyId: authResult.companyId,
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
    return errorResponse(error as Error, "api/customers");
  }
}

// POST /api/customers - Create customer
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.ok) {
      throw new UnauthorizedError();
    }

    const body = await request.json();
    const parseResult = CreateCustomerBody.safeParse(body);
    
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0];
      throw new ValidationError(
        firstError.message || "Dados inválidos",
        parseResult.error.issues
      );
    }
    
    const data = parseResult.data;

    // Validate phone format
    if (!data.phoneE164.startsWith("+")) {
      throw new InvalidPhoneError();
    }

    // Check if phone already exists
    const existing = await prisma.customer.findUnique({
      where: { phoneE164: data.phoneE164 },
    });

    if (existing) {
      throw new DuplicatePhoneError();
    }

    const customer = await prisma.customer.create({
      data: {
        id: crypto.randomUUID(),
        companyId: authResult.companyId,
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
    console.error("Error creating customer:", error);
    return errorResponse(error as Error, "api/customers");
  }
}

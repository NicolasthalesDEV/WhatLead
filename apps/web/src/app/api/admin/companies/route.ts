import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@wacrm/db';
import { verifyAuth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

/**
 * Verifica se o usuário autenticado é super-admin.
 * Super-admins são definidos via SUPER_ADMIN_EMAILS (CSV) no .env.
 */
async function verifySuperAdmin(claims: { uid: string }) {
  const adminEmails = (process.env.SUPER_ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (adminEmails.length === 0) return false;

  const user = await prisma.user.findUnique({
    where: { id: claims.uid },
    select: { email: true },
  });

  return user?.email ? adminEmails.includes(user.email.toLowerCase()) : false;
}

/**
 * GET /api/admin/companies
 * Lista todas as empresas cadastradas (super-admin only)
 */
export async function GET(req: NextRequest) {
  const claims = await verifyAuth(req);
  if (!claims) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  if (!(await verifySuperAdmin(claims))) {
    return NextResponse.json({ error: 'Acesso restrito a super-admins' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || undefined;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  const skip = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { slug: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        phone: true,
        plan: true,
        planStatus: true,
        planExpiresAt: true,
        createdAt: true,
        _count: { select: { User: true, Customer: true, WhatsMessage: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.company.count({ where }),
  ]);

  return NextResponse.json({
    companies,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

const createCompanySchema = z.object({
  companyName: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  ownerName: z.string().min(2).max(100),
  ownerEmail: z.string().email(),
  ownerPassword: z.string().min(8),
  plan: z.enum(['free', 'starter', 'professional', 'enterprise']).default('free'),
});

/**
 * POST /api/admin/companies
 * Cria uma nova empresa + usuário OWNER (super-admin only)
 */
export async function POST(req: NextRequest) {
  const claims = await verifyAuth(req);
  if (!claims) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  if (!(await verifySuperAdmin(claims))) {
    return NextResponse.json({ error: 'Acesso restrito a super-admins' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const parsed = createCompanySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.errors }, { status: 400 });
  }

  const { companyName, slug, ownerName, ownerEmail, ownerPassword, plan } = parsed.data;

  // Check uniqueness
  const [slugExists, emailExists] = await Promise.all([
    prisma.company.findUnique({ where: { slug }, select: { id: true } }),
    prisma.user.findUnique({ where: { email: ownerEmail }, select: { id: true } }),
  ]);

  if (slugExists) return NextResponse.json({ error: 'Slug já está em uso' }, { status: 409 });
  if (emailExists) return NextResponse.json({ error: 'Email já cadastrado' }, { status: 409 });

  const hashedPassword = await bcrypt.hash(ownerPassword, 12);

  const company = await prisma.$transaction(async (tx) => {
    const newCompany = await tx.company.create({
      data: { name: companyName, slug, plan },
    });

    await tx.user.create({
      data: {
        name: ownerName,
        email: ownerEmail,
        password: hashedPassword,
        role: 'OWNER',
        companyId: newCompany.id,
      },
    });

    return newCompany;
  });

  return NextResponse.json({ company }, { status: 201 });
}

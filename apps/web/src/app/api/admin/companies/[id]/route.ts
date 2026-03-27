import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@wacrm/db';
import { verifyAuth } from '@/lib/auth';

async function verifySuperAdmin(uid: string) {
  const adminEmails = (process.env.SUPER_ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (adminEmails.length === 0) return false;
  const user = await prisma.user.findUnique({ where: { id: uid }, select: { email: true } });
  return user?.email ? adminEmails.includes(user.email.toLowerCase()) : false;
}

const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  plan: z.enum(['free', 'starter', 'professional', 'enterprise']).optional(),
  planStatus: z.enum(['active', 'canceled', 'expired', 'trial']).optional(),
  planExpiresAt: z.string().datetime().optional().nullable(),
});

/**
 * PATCH /api/admin/companies/[id]
 * Atualiza plano/status de uma empresa (super-admin only)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const claims = await verifyAuth(req);
  if (!claims) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  if (!(await verifySuperAdmin(claims.uid))) {
    return NextResponse.json({ error: 'Acesso restrito a super-admins' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.errors }, { status: 400 });
  }

  const { name, plan, planStatus, planExpiresAt } = parsed.data;
  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (plan !== undefined) updateData.plan = plan;
  if (planStatus !== undefined) updateData.planStatus = planStatus;
  if (planExpiresAt !== undefined) updateData.planExpiresAt = planExpiresAt ? new Date(planExpiresAt) : null;

  const { id } = await params;
  const company = await prisma.company.update({
    where: { id },
    data: updateData,
    select: { id: true, name: true, slug: true, plan: true, planStatus: true, planExpiresAt: true },
  });

  return NextResponse.json({ company });
}

/**
 * DELETE /api/admin/companies/[id]
 * Suspende (soft-delete via planStatus=canceled) uma empresa (super-admin only)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const claims = await verifyAuth(req);
  if (!claims) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  if (!(await verifySuperAdmin(claims.uid))) {
    return NextResponse.json({ error: 'Acesso restrito a super-admins' }, { status: 403 });
  }

  const { id } = await params;
  await prisma.company.update({
    where: { id },
    data: { planStatus: 'canceled' },
  });

  return NextResponse.json({ success: true });
}

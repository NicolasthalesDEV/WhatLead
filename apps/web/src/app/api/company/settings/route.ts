import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@wacrm/db';
import { verifyAuth } from '@/lib/auth';

/**
 * GET /api/company/settings
 * 
 * Retorna configurações da empresa do usuário atual
 */

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      company: {
        ...company,
        email: null,
        phone: null,
        website: null,
        address: null,
        city: null,
        state: null,
        zipCode: null,
        country: null,
        document: null,
        logoUrl: null,
        description: null,
        businessHours: null,
        autoMessages: null,
        updatedAt: company.createdAt,
      },
    });

  } catch (error) {
    console.error('Error fetching company settings:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configurações' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/company/settings
 * 
 * Atualiza configurações da empresa
 * 
 * Body: campos opcionais da empresa
 */

const updateCompanySchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100).optional(),
  email: z.string().email('Email inválido').optional().nullable(),
  phone: z.string().optional().nullable(),
  website: z.string().url('Website inválido').optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().max(2, 'Estado deve ser sigla de 2 letras').optional().nullable(),
  zipCode: z.string().optional().nullable(),
  country: z.string().max(2).optional(),
  document: z.string().optional().nullable(),
  logoUrl: z.string().url('URL do logo inválida').optional().nullable(),
  description: z.string().max(500, 'Descrição muito longa').optional().nullable(),
  businessHours: z.any().optional(), // JSON
  autoMessages: z.any().optional(), // JSON
});

export async function PATCH(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Apenas OWNER e ADMIN podem atualizar configurações da empresa
    if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Permissão negada. Apenas proprietários e administradores podem atualizar configurações da empresa.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const data = updateCompanySchema.parse(body);
    const updateData: { name?: string } = {};

    if (typeof data.name === 'string') {
      updateData.name = data.name;
    }

    // Atualizar empresa
    const company = await prisma.company.update({
      where: { id: user.companyId },
      data: updateData,
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      company: {
        ...company,
        email: null,
        phone: null,
        website: null,
        address: null,
        city: null,
        state: null,
        zipCode: null,
        country: null,
        document: null,
        logoUrl: null,
        description: null,
        businessHours: null,
        autoMessages: null,
        updatedAt: company.createdAt,
      },
    });

  } catch (error) {
    console.error('Error updating company settings:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao atualizar configurações' },
      { status: 500 }
    );
  }
}

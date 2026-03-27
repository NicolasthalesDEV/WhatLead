import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@wacrm/db';
import { verifyAuth, createAuditLog } from '@/lib/auth';

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
        email: true,
        phone: true,
        website: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        document: true,
        logoUrl: true,
        description: true,
        businessHours: true,
        autoMessages: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ company });

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

    type CompanyUpdateInput = {
      name?: string;
      email?: string | null;
      phone?: string | null;
      website?: string | null;
      address?: string | null;
      city?: string | null;
      state?: string | null;
      zipCode?: string | null;
      country?: string;
      document?: string | null;
      logoUrl?: string | null;
      description?: string | null;
      businessHours?: any;
      autoMessages?: any;
    };

    const updateData: CompanyUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.state !== undefined) updateData.state = data.state;
    if (data.zipCode !== undefined) updateData.zipCode = data.zipCode;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.document !== undefined) updateData.document = data.document;
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.businessHours !== undefined) updateData.businessHours = data.businessHours;
    if (data.autoMessages !== undefined) updateData.autoMessages = data.autoMessages;

    // Atualizar empresa
    const company = await prisma.company.update({
      where: { id: user.companyId },
      data: updateData,
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        phone: true,
        website: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        document: true,
        logoUrl: true,
        description: true,
        businessHours: true,
        autoMessages: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await createAuditLog({
      userId: user.uid,
      companyId: user.companyId,
      action: 'COMPANY_SETTINGS_UPDATE',
      resource: 'company',
      resourceId: user.companyId,
      req,
    });

    return NextResponse.json({ company });

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

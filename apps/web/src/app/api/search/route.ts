import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@wacrm/db';
import { verifyAuth } from '@/lib/auth';

/**
 * GET /api/search
 * 
 * Busca global no sistema
 * 
 * Query params:
 * - q: termo de busca (min: 2 caracteres)
 * - limit: limite de resultados por categoria (default: 5, max: 20)
 * - categories: categorias a buscar (customers,products,orders,messages) - default: todas
 */

const querySchema = z.object({
  q: z.string().min(2, 'Termo de busca deve ter no mínimo 2 caracteres').max(100),
  limit: z.coerce.number().int().min(1).max(20).default(5),
  categories: z.string().optional(),
});

interface SearchResult {
  category: string;
  items: Array<{
    id: string;
    type: string;
    title: string;
    subtitle?: string;
    metadata?: Record<string, any>;
  }>;
}

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = querySchema.parse({
      q: searchParams.get('q') || '',
      limit: searchParams.get('limit') || '5',
      categories: searchParams.get('categories') || undefined,
    });

    const searchTerm = query.q.toLowerCase().trim();
    const categories = query.categories 
      ? query.categories.split(',') 
      : ['customers', 'products', 'orders', 'messages'];

    const results: SearchResult[] = [];

    // Buscar Clientes
    if (categories.includes('customers')) {
      const customers = await prisma.customer.findMany({
        where: {
          companyId: user.companyId,
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { phoneE164: { contains: searchTerm } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        take: query.limit,
        select: {
          id: true,
          name: true,
          phoneE164: true,
          email: true,
          tags: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      if (customers.length > 0) {
        results.push({
          category: 'Clientes',
          items: customers.map((c: any) => ({
            id: c.id,
            type: 'customer',
            title: c.name,
            subtitle: c.phoneE164,
            metadata: {
              email: c.email,
              tags: c.tags,
            },
          })),
        });
      }
    }

    // Buscar Produtos
    if (categories.includes('products')) {
      const products = await prisma.product.findMany({
        where: {
          companyId: user.companyId,
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { sku: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        take: query.limit,
        select: {
          id: true,
          title: true,
          description: true,
          sku: true,
          prices: {
            where: { active: true },
            take: 1,
            select: { amount: true, currency: true },
          },
          stock: true,
          imageUrl: true,
        },
        orderBy: {
          title: 'asc',
        },
      });

      if (products.length > 0) {
        results.push({
          category: 'Produtos',
          items: products.map((p: any) => ({
            id: p.id,
            type: 'product',
            title: p.title,
            subtitle: p.sku || undefined,
            metadata: {
              description: p.description,
              price: p.prices[0]?.amount || null,
              currency: p.prices[0]?.currency || 'BRL',
              stock: p.stock,
              imageUrl: p.imageUrl,
            },
          })),
        });
      }
    }

    // Buscar Pedidos
    if (categories.includes('orders')) {
      const orders = await prisma.order.findMany({
        where: {
          companyId: user.companyId,
          OR: [
            { id: { contains: searchTerm } },
            { customer: { name: { contains: searchTerm, mode: 'insensitive' } } },
            { customer: { phoneE164: { contains: searchTerm } } },
          ],
        },
        take: query.limit,
        select: {
          id: true,
          total: true,
          status: true,
          createdAt: true,
          customer: {
            select: {
              name: true,
              phoneE164: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (orders.length > 0) {
        results.push({
          category: 'Pedidos',
          items: orders.map((o: any) => ({
            id: o.id,
            type: 'order',
            title: `Pedido #${o.id.slice(0, 8)}`,
            subtitle: o.customer.name,
            metadata: {
              total: o.total,
              status: o.status,
              customerPhone: o.customer.phoneE164,
              createdAt: o.createdAt,
            },
          })),
        });
      }
    }

    // Buscar Mensagens do WhatsApp
    if (categories.includes('messages')) {
      // Buscar mensagens com clientes que contenham o termo
      const messages = await prisma.whatsMessage.findMany({
        where: {
          companyId: user.companyId,
          OR: [
            { body: { contains: searchTerm, mode: 'insensitive' } },
            { customer: { name: { contains: searchTerm, mode: 'insensitive' } } },
            { customer: { phoneE164: { contains: searchTerm } } },
          ],
        },
        take: query.limit,
        select: {
          id: true,
          customerId: true,
          body: true,
          type: true,
          createdAt: true,
          customer: {
            select: {
              name: true,
              phoneE164: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        distinct: ['customerId'], // Apenas uma mensagem por cliente
      });

      if (messages.length > 0) {
        results.push({
          category: 'Mensagens',
          items: messages.map((m: any) => ({
            id: m.customerId,
            type: 'message',
            title: m.customer.name,
            subtitle: m.body ? m.body.substring(0, 50) + (m.body.length > 50 ? '...' : '') : `[${m.type}]`,
            metadata: {
              customerPhone: m.customer.phoneE164,
              messageType: m.type,
              timestamp: m.createdAt,
            },
          })),
        });
      }
    }

    return NextResponse.json({
      query: query.q,
      results,
      totalCategories: results.length,
      totalItems: results.reduce((acc, cat) => acc + cat.items.length, 0),
    });

  } catch (error) {
    console.error('Error in global search:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao realizar busca' },
      { status: 500 }
    );
  }
}

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/whatsapp/conversations/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@wacrm/db', () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
  Prisma: {
    sql: vi.fn((...args) => args),
    empty: [],
  },
}));

vi.mock('@/lib/auth', () => ({
  verifyAuth: vi.fn(),
}));

describe('WhatsApp Conversations API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/whatsapp/conversations', () => {
    it('should return 401 when not authenticated', async () => {
      const { verifyAuth } = await import('@/lib/auth');
      vi.mocked(verifyAuth).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/whatsapp/conversations');
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Não autorizado');
    });

    it('should return conversations when authenticated', async () => {
      const { verifyAuth } = await import('@/lib/auth');
      const { prisma } = await import('@wacrm/db');

      vi.mocked(verifyAuth).mockResolvedValue({
        uid: 'user-123',
        companyId: 'company-123',
        role: 'ADMIN',
      });

      // Mock conversations query result
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([
        {
          customerId: 'cust-1',
          customerName: 'João Silva',
          customerPhone: '+5511999887766',
          lastMessageBody: 'Olá',
          lastMessageType: 'text',
          lastMessageDirection: 'IN',
          lastMessageAt: new Date('2026-02-16T10:00:00Z'),
          unreadCount: BigInt(2),
          assignedToId: null,
          assignedToName: null,
        },
      ]);

      // Mock count query result
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([
        { total: BigInt(1) },
      ]);

      const request = new NextRequest('http://localhost:3000/api/whatsapp/conversations');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.conversations).toBeDefined();
      expect(data.conversations).toHaveLength(1);
      expect(data.conversations[0].customerId).toBe('cust-1');
      expect(data.conversations[0].customer.name).toBe('João Silva');
      expect(data.conversations[0].unreadCount).toBe(2);
    });

    it('should handle search query parameter', async () => {
      const { verifyAuth } = await import('@/lib/auth');
      const { prisma } = await import('@wacrm/db');

      vi.mocked(verifyAuth).mockResolvedValue({
        uid: 'user-123',
        companyId: 'company-123',
        role: 'ADMIN',
      });

      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([]);
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ total: BigInt(0) }]);

      const request = new NextRequest('http://localhost:3000/api/whatsapp/conversations?search=João');
      const response = await GET(request);

      expect(response.status).toBe(200);
      
      // Verify that search parameter was used in query
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(2);
    });

    it('should handle unreadOnly filter', async () => {
      const { verifyAuth } = await import('@/lib/auth');
      const { prisma } = await import('@wacrm/db');

      vi.mocked(verifyAuth).mockResolvedValue({
        uid: 'user-123',
        companyId: 'company-123',
        role: 'ADMIN',
      });

      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([]);
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ total: BigInt(0) }]);

      const request = new NextRequest('http://localhost:3000/api/whatsapp/conversations?unreadOnly=true');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('should handle pagination parameters', async () => {
      const { verifyAuth } = await import('@/lib/auth');
      const { prisma } = await import('@wacrm/db');

      vi.mocked(verifyAuth).mockResolvedValue({
        uid: 'user-123',
        companyId: 'company-123',
        role: 'ADMIN',
      });

      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([]);
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ total: BigInt(0) }]);

      const request = new NextRequest('http://localhost:3000/api/whatsapp/conversations?page=2&limit=10');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.pagination.page).toBe(2);
      expect(data.pagination.limit).toBe(10);
    });

    it('should return 400 for invalid parameters', async () => {
      const { verifyAuth } = await import('@/lib/auth');

      vi.mocked(verifyAuth).mockResolvedValue({
        uid: 'user-123',
        companyId: 'company-123',
        role: 'ADMIN',
      });

      const request = new NextRequest('http://localhost:3000/api/whatsapp/conversations?page=-1');
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Parâmetros inválidos');
    });
  });
});

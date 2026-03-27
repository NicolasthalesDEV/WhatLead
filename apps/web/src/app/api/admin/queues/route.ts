import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

/**
 * GET /api/admin/queues
 * Returns BullMQ queue stats (super-admin only)
 */
export async function GET(req: NextRequest) {
  const claims = await verifyAuth(req);
  if (!claims) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const adminEmails = (process.env.SUPER_ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (adminEmails.length > 0) {
    const { prisma } = await import('@wacrm/db');
    const user = await prisma.user.findUnique({ where: { id: claims.uid }, select: { email: true } });
    if (!user?.email || !adminEmails.includes(user.email.toLowerCase())) {
      return NextResponse.json({ error: 'Acesso restrito a super-admins' }, { status: 403 });
    }
  }

  if (!process.env.REDIS_URL) {
    return NextResponse.json({ available: false, reason: 'REDIS_URL não configurado' });
  }

  try {
    const { Queue } = await import('bullmq');
    const IORedis = (await import('ioredis')).default;
    const conn = new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
      lazyConnect: true,
    });
    await conn.connect();

    const prefix = process.env.BULLMQ_PREFIX || 'wacrm';
    const [messagesQ, webhooksQ] = [
      new Queue('messages', { connection: conn, prefix }),
      new Queue('webhooks', { connection: conn, prefix }),
    ];

    const [messagesCounts, webhooksCounts] = await Promise.all([
      messagesQ.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed'),
      webhooksQ.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed'),
    ]);

    await conn.quit();

    return NextResponse.json({
      available: true,
      queues: {
        messages: messagesCounts,
        webhooks: webhooksCounts,
      },
    });
  } catch (err: any) {
    return NextResponse.json({
      available: false,
      reason: err?.message || 'Redis connection failed',
    });
  }
}

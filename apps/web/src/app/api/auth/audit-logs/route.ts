import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@wacrm/db";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const skip = (page - 1) * limit;

  const auditLogModel = (prisma as any).auditLog;
  if (!auditLogModel) {
    return NextResponse.json({
      logs: [],
      pagination: {
        page,
        limit,
        total: 0,
        pages: 0,
      },
    });
  }

  const [logs, total] = await Promise.all([
    auditLogModel.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
      select: {
        id: true,
        action: true,
        resource: true,
        resourceId: true,
        metadata: true,
        ipAddress: true,
        createdAt: true,
      },
    }),
    auditLogModel.count({
      where: { userId: auth.userId },
    }),
  ]);

  return NextResponse.json({
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}

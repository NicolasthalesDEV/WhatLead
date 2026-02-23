/**
 * GET    /api/agenda/[id]
 * PUT    /api/agenda/[id]
 * DELETE /api/agenda/[id]
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@wacrm/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;
  const { id } = await params;

  const appointment = await prisma.appointment.findFirst({
    where: { id, companyId: auth.companyId },
    include: { Customer: { select: { id: true, name: true, phoneE164: true } } },
  });

  if (!appointment) {
    return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ appointment });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;
  const { id } = await params;

  try {
    const body = await req.json();
    const {
      title, description, startAt, endAt, allDay,
      customerId, userId, status, location, notes,
    } = body;

    const appointment = await prisma.appointment.updateMany({
      where: { id, companyId: auth.companyId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(startAt && { startAt: new Date(startAt) }),
        ...(endAt && { endAt: new Date(endAt) }),
        ...(allDay !== undefined && { allDay }),
        ...(customerId !== undefined && { customerId }),
        ...(userId !== undefined && { userId }),
        ...(status && { status }),
        ...(location !== undefined && { location }),
        ...(notes !== undefined && { notes }),
      },
    });

    if (appointment.count === 0) {
      return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
    }

    const updated = await prisma.appointment.findUnique({
      where: { id },
      include: { Customer: { select: { id: true, name: true, phoneE164: true } } },
    });

    return NextResponse.json({ appointment: updated });
  } catch (error) {
    console.error("Update appointment error:", error);
    return NextResponse.json({ error: "Erro ao atualizar agendamento" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;
  const { id } = await params;

  try {
    const deleted = await prisma.appointment.deleteMany({
      where: { id, companyId: auth.companyId },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao excluir agendamento" }, { status: 500 });
  }
}

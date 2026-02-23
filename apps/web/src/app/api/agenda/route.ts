/**
 * GET  /api/agenda  – list appointments
 * POST /api/agenda  – create appointment
 * XI – Agenda interna / integração com Google Calendar
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@wacrm/db";
import crypto from "crypto";

// GET – list appointments
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const customerId = searchParams.get("customerId");
  const status = searchParams.get("status");

  try {
    const appointments = await prisma.appointment.findMany({
      where: {
        companyId: auth.companyId,
        ...(from && { startAt: { gte: new Date(from) } }),
        ...(to && { endAt: { lte: new Date(to) } }),
        ...(customerId && { customerId }),
        ...(status && { status }),
      },
      include: {
        Customer: { select: { id: true, name: true, phoneE164: true } },
      },
      orderBy: { startAt: "asc" },
    });

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error("List appointments error:", error);
    return NextResponse.json({ appointments: [] });
  }
}

// POST – create appointment
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.res;

  try {
    const body = await req.json();
    const {
      title,
      description,
      startAt,
      endAt,
      allDay,
      customerId,
      userId,
      status,
      location,
      notes,
    } = body;

    if (!title?.trim() || !startAt || !endAt) {
      return NextResponse.json(
        { error: "title, startAt e endAt são obrigatórios" },
        { status: 400 }
      );
    }

    const appointment = await prisma.appointment.create({
      data: {
        id: crypto.randomUUID(),
        companyId: auth.companyId,
        title: title.trim(),
        description: description || null,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        allDay: allDay ?? false,
        customerId: customerId || null,
        userId: userId || null,
        status: status || "SCHEDULED",
        location: location || null,
        notes: notes || null,
      },
      include: {
        Customer: { select: { id: true, name: true, phoneE164: true } },
      },
    });

    // Attempt Google Calendar sync in background
    syncToGoogle(auth.companyId, appointment.id).catch((e) =>
      console.error("Google Calendar sync error:", e)
    );

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error: any) {
    console.error("Create appointment error:", error);
    return NextResponse.json( { error: "Erro ao criar agendamento" }, { status: 500 });
  }
}

// ── Background Google Calendar sync ───────────────────────────
async function syncToGoogle(companyId: string, appointmentId: string) {
  const token = await prisma.googleCalendarToken.findUnique({
    where: { companyId },
  });
  if (!token?.accessToken) return; // Not connected

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { Customer: true },
  });
  if (!appointment) return;

  // Refresh token if expired
  let accessToken = token.accessToken;
  if (token.expiresAt && token.expiresAt < new Date()) {
    accessToken = await refreshGoogleToken(companyId, token.refreshToken!);
  }

  const event: any = {
    summary: appointment.title,
    description: [
      appointment.description || "",
      appointment.Customer ? `Cliente: ${appointment.Customer.name} (${appointment.Customer.phoneE164})` : "",
      appointment.notes || "",
    ].filter(Boolean).join("\n"),
    location: appointment.location || undefined,
    start: appointment.allDay
      ? { date: appointment.startAt.toISOString().split("T")[0] }
      : { dateTime: appointment.startAt.toISOString() },
    end: appointment.allDay
      ? { date: appointment.endAt.toISOString().split("T")[0] }
      : { dateTime: appointment.endAt.toISOString() },
  };

  const url = appointment.googleEventId
    ? `https://www.googleapis.com/calendar/v3/calendars/${token.calendarId}/events/${appointment.googleEventId}`
    : `https://www.googleapis.com/calendar/v3/calendars/${token.calendarId}/events`;

  const res = await fetch(url, {
    method: appointment.googleEventId ? "PUT" : "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(event),
  });

  if (res.ok) {
    const data = await res.json();
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        googleEventId: data.id,
        googleCalendarId: token.calendarId,
        syncedAt: new Date(),
      },
    });
  } else {
    console.error("Google Calendar sync failed:", await res.text());
  }
}

async function refreshGoogleToken(
  companyId: string,
  refreshToken: string
): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  await prisma.googleCalendarToken.update({
    where: { companyId },
    data: {
      accessToken: data.access_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    },
  });
  return data.access_token;
}

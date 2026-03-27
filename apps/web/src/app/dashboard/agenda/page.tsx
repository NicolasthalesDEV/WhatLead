"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarDays, Plus, Clock, MapPin, User } from "lucide-react";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Appointment {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  allDay: boolean;
  status: string;
  location: string | null;
  Customer: { id: string; name: string; phoneE164: string } | null;
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  SCHEDULED: { label: "Agendado", className: "bg-blue-100 text-blue-800 border-blue-200" },
  CONFIRMED: { label: "Confirmado", className: "bg-green-100 text-green-800 border-green-200" },
  CANCELLED: { label: "Cancelado", className: "bg-red-100 text-red-800 border-red-200" },
  COMPLETED: { label: "Concluído", className: "bg-gray-100 text-gray-600 border-gray-200" },
  NO_SHOW: { label: "Não compareceu", className: "bg-orange-100 text-orange-800 border-orange-200" },
};

export default function AgendaPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", startAt: "", endAt: "", location: "" });
  const [saving, setSaving] = useState(false);

  async function load(month: Date) {
    setLoading(true);
    const from = startOfMonth(month).toISOString();
    const to = endOfMonth(month).toISOString();
    const res = await fetch(`/api/agenda?from=${from}&to=${to}`);
    if (res.ok) {
      const data = await res.json();
      setAppointments(data.appointments ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { load(currentMonth); }, [currentMonth]);

  async function createAppointment(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/agenda", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description || undefined,
        startAt: form.startAt,
        endAt: form.endAt,
        location: form.location || undefined,
      }),
    });
    if (res.ok) {
      setShowCreate(false);
      setForm({ title: "", description: "", startAt: "", endAt: "", location: "" });
      load(currentMonth);
    }
    setSaving(false);
  }

  const grouped = appointments.reduce<Record<string, Appointment[]>>((acc, a) => {
    const day = format(new Date(a.startAt), "yyyy-MM-dd");
    if (!acc[day]) acc[day] = [];
    acc[day].push(a);
    return acc;
  }, {});

  const sortedDays = Object.keys(grouped).sort();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agenda</h1>
          <div className="flex items-center gap-3 mt-1">
            <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>‹</Button>
            <span className="text-sm font-medium capitalize">{format(currentMonth, "MMMM yyyy", { locale: ptBR })}</span>
            <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>›</Button>
          </div>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4 mr-2" />Novo Agendamento</Button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Carregando...</div>
      ) : sortedDays.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground"><CalendarDays className="w-12 h-12 mx-auto mb-2 opacity-30" /><p>Nenhum agendamento neste mês</p></div>
      ) : (
        <div className="space-y-6">
          {sortedDays.map(day => (
            <div key={day}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2 capitalize">
                {format(new Date(day + "T12:00:00"), "EEEE, d 'de' MMMM", { locale: ptBR })}
              </h3>
              <div className="space-y-2">
                {grouped[day].map(a => {
                  const s = STATUS_MAP[a.status] ?? { label: a.status, className: "bg-gray-100 text-gray-600" };
                  return (
                    <Card key={a.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{a.title}</h4>
                              <Badge className={`${s.className} border text-xs`}>{s.label}</Badge>
                            </div>
                            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                              {!a.allDay && (
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{format(new Date(a.startAt), "HH:mm")} – {format(new Date(a.endAt), "HH:mm")}</span>
                              )}
                              {a.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{a.location}</span>}
                              {a.Customer && <span className="flex items-center gap-1"><User className="w-3 h-3" />{a.Customer.name}</span>}
                            </div>
                            {a.description && <p className="text-xs text-muted-foreground mt-1">{a.description}</p>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Agendamento</DialogTitle></DialogHeader>
          <form onSubmit={createAppointment} className="space-y-4">
            <div className="space-y-1"><Label>Título *</Label><Input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Início *</Label><Input required type="datetime-local" value={form.startAt} onChange={e => setForm(f => ({ ...f, startAt: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Fim *</Label><Input required type="datetime-local" value={form.endAt} onChange={e => setForm(f => ({ ...f, endAt: e.target.value }))} /></div>
            </div>
            <div className="space-y-1"><Label>Local</Label><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Descrição</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Criar Agendamento"}</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { Resend } from "resend";

const SUPPORT_EMAIL = "nicolasthalesmariano@gmail.com";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return auth.res;

    const body = await req.json();
    const { subject, description, category, url } = body;

    if (!description?.trim()) {
      return NextResponse.json({ error: "Descrição é obrigatória" }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("[support/report] RESEND_API_KEY not set");
      return NextResponse.json({ error: "Serviço de email não configurado" }, { status: 503 });
    }

    const resend = new Resend(apiKey);

    const categoryLabel: Record<string, string> = {
      bug: "🐛 Bug / Erro",
      feature: "💡 Sugestão de melhoria",
      question: "❓ Dúvida",
      billing: "💳 Cobrança / Plano",
      other: "📋 Outro",
    };

    const html = `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
  <div style="background:#7c3aed;padding:24px 32px;border-radius:8px 8px 0 0">
    <h1 style="color:#fff;margin:0;font-size:20px">Novo reporte de suporte — WhatLead</h1>
  </div>
  <div style="background:#f9fafb;padding:24px 32px;border-radius:0 0 8px 8px;border:1px solid #e5e7eb;border-top:none">
    <table style="width:100%;border-collapse:collapse">
      <tr>
        <td style="padding:8px 0;font-weight:600;width:140px;color:#6b7280;font-size:13px">Usuário ID</td>
        <td style="padding:8px 0;font-size:14px">${auth.userId}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;font-weight:600;color:#6b7280;font-size:13px">Empresa ID</td>
        <td style="padding:8px 0;font-size:14px">${auth.companyId}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;font-weight:600;color:#6b7280;font-size:13px">Categoria</td>
        <td style="padding:8px 0;font-size:14px">${categoryLabel[category] ?? category ?? "—"}</td>
      </tr>
      ${subject ? `
      <tr>
        <td style="padding:8px 0;font-weight:600;color:#6b7280;font-size:13px">Assunto</td>
        <td style="padding:8px 0;font-size:14px">${subject}</td>
      </tr>` : ""}
      ${url ? `
      <tr>
        <td style="padding:8px 0;font-weight:600;color:#6b7280;font-size:13px">Página</td>
        <td style="padding:8px 0;font-size:14px">${url}</td>
      </tr>` : ""}
    </table>

    <div style="margin-top:20px">
      <p style="font-weight:600;color:#6b7280;font-size:13px;margin-bottom:8px">Descrição do problema</p>
      <div style="background:#fff;border:1px solid #e5e7eb;border-radius:6px;padding:16px;font-size:14px;white-space:pre-wrap;line-height:1.6">${description}</div>
    </div>

    <p style="margin-top:24px;font-size:12px;color:#9ca3af">Enviado em ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} via WhatLead</p>
  </div>
</div>`;

    const { error } = await resend.emails.send({
      from: "WhatLead Suporte <onboarding@resend.dev>",
      to: SUPPORT_EMAIL,
      subject: `[Suporte] ${categoryLabel[category] ?? "Reporte"}: ${subject || description.slice(0, 60)}`,
      html,
    });

    if (error) {
      console.error("[support/report] Resend error:", error);
      return NextResponse.json({ error: "Erro ao enviar email" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[support/report]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

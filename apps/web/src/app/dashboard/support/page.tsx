"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { AlertTriangle, CheckCircle2, Loader2, ArrowLeft, Send } from "lucide-react";

const CATEGORIES = [
  { value: "bug", label: "🐛 Bug / Erro no sistema" },
  { value: "feature", label: "💡 Sugestão de melhoria" },
  { value: "question", label: "❓ Dúvida de uso" },
  { value: "billing", label: "💳 Cobrança / Plano" },
  { value: "other", label: "📋 Outro" },
];

export default function SupportPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [category, setCategory] = useState("bug");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      showToast("Descreva o problema antes de enviar", "error");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/support/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          category,
          subject,
          description,
          url: window.location.href,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao enviar");
      }

      setSent(true);
    } catch (err: any) {
      showToast(err.message || "Erro ao enviar reporte", "error");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10 sm:py-16 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-green-100 rounded-full">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-2">Reporte enviado!</h2>
        <p className="text-gray-500 mb-6">
          Nossa equipe recebeu sua mensagem e entrará em contato em breve.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => { setSent(false); setSubject(""); setDescription(""); setCategory("bug"); }}>
            Enviar outro
          </Button>
          <Button onClick={() => router.back()}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Reportar problema</h1>
          <p className="text-sm text-gray-500">Descreva o que houve e nossa equipe irá verificar</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Formulário de suporte
          </CardTitle>
          <CardDescription>
            Preencha com o máximo de detalhes possível para agilizar a resolução.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Categoria */}
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${category === cat.value
                        ? "border-purple-600 bg-purple-50 text-purple-700 font-medium"
                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                      }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Assunto */}
            <div className="space-y-2">
              <Label htmlFor="subject">
                Assunto <span className="text-gray-400 font-normal">(opcional)</span>
              </Label>
              <Input
                id="subject"
                placeholder="Ex: Chatbot não responde após configurar fluxo"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={120}
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Descrição <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="description"
                rows={6}
                placeholder="Descreva o problema com detalhes: o que você tentou fazer, o que aconteceu e o que esperava que acontecesse..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              />
              <p className="text-xs text-gray-400 text-right">{description.length} caracteres</p>
            </div>

            <Button type="submit" className="w-full gap-2" disabled={sending || !description.trim()}>
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Enviar reporte
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

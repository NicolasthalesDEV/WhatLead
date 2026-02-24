"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CheckCircle2, Zap, Loader2, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const PLAN_NAMES: Record<string, string> = {
  starter: "Starter",
  professional: "Professional",
  enterprise: "Enterprise",
};

const PLAN_PRICES: Record<string, string> = {
  starter: "R$ 97/mês",
  professional: "R$ 197/mês",
  enterprise: "R$ 497/mês",
};

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(8);

  // Mercado Pago passa external_reference (= companyId) e preapproval_id de volta
  const planId = searchParams.get("plan") || "professional";
  const planName = PLAN_NAMES[planId] || "Professional";
  const planPrice = PLAN_PRICES[planId] || "R$ 197/mês";

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          router.push("/dashboard");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-3">
            <Zap className="h-7 w-7 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            WhatLead
          </span>
        </div>

        {/* Ícone de sucesso animado */}
        <div className="relative inline-flex items-center justify-center mb-6">
          <div className="absolute inset-0 bg-green-100 rounded-full scale-150 animate-ping opacity-20" />
          <div className="bg-green-100 rounded-full p-6">
            <CheckCircle2 className="h-16 w-16 text-green-500" strokeWidth={1.5} />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Pagamento confirmado!
        </h1>
        <p className="text-gray-500 text-lg mb-8">
          Sua assinatura do plano <strong className="text-purple-700">{planName}</strong> foi ativada com sucesso.
        </p>

        {/* Card do plano */}
        <div className="bg-white border border-purple-100 rounded-2xl p-6 mb-8 shadow-sm text-left">
          <div className="flex items-start gap-4">
            <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl p-3">
              <Sparkles className="h-6 w-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-lg">Plano {planName}</p>
              <p className="text-gray-500 text-sm">{planPrice}</p>
            </div>
            <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-green-200">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Ativo
            </span>
          </div>

          <div className="mt-5 pt-5 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400 text-xs mb-1">Status</p>
              <p className="font-medium text-gray-700">Assinatura ativa</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Próximo passo</p>
              <p className="font-medium text-gray-700">Configurar WhatsApp</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <Button
          className="w-full py-6 text-base bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
          onClick={() => router.push("/dashboard")}
        >
          Ir para o Dashboard
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>

        {/* Countdown */}
        <p className="mt-5 text-sm text-gray-400 flex items-center justify-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Redirecionando automaticamente em {countdown} segundos…
        </p>

      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}

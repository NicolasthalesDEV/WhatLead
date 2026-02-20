"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log do erro para monitoramento
    console.error("Error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-destructive/5 via-background to-secondary/20 p-4">
      <Card className="mx-auto max-w-2xl p-8 text-center shadow-2xl">
        <div className="mb-6 flex justify-center">
          {/* Alert Icon */}
          <svg
            className="h-24 w-24 text-destructive"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>

        <h1 className="mb-2 text-5xl font-bold text-destructive">Oops!</h1>
        <h2 className="mb-4 text-2xl font-semibold text-foreground">
          Algo deu errado
        </h2>
        <p className="mb-6 text-muted-foreground">
          Ocorreu um erro inesperado ao processar sua solicitação. Por favor,
          tente novamente.
        </p>

        {error.digest && (
          <div className="mb-6 rounded-md bg-muted p-3">
            <p className="text-xs text-muted-foreground">
              Código do erro: <code className="font-mono">{error.digest}</code>
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button size="lg" onClick={reset} className="w-full sm:w-auto">
            Tentar Novamente
          </Button>
          <Link href="/dashboard">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
            >
              Voltar ao Dashboard
            </Button>
          </Link>
        </div>

        <div className="mt-8 text-sm text-muted-foreground">
          <p>Se o problema persistir:</p>
          <a
            href="https://wa.me/5547991011287"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Entre em contato com o suporte técnico
          </a>
        </div>

        {process.env.NODE_ENV === "development" && (
          <details className="mt-8 cursor-pointer rounded-md bg-muted p-4 text-left">
            <summary className="text-sm font-semibold text-foreground">
              Detalhes técnicos (apenas em desenvolvimento)
            </summary>
            <pre className="mt-2 overflow-auto text-xs text-muted-foreground">
              {error.message}
              {"\n\n"}
              {error.stack}
            </pre>
          </details>
        )}
      </Card>
    </div>
  );
}

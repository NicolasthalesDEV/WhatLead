"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log crítico do erro
    console.error("Global error boundary caught:", error);
  }, [error]);

  return (
    <html lang="pt-br">
      <body className="bg-gradient-to-br from-destructive/10 via-background to-secondary/20">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="mx-auto max-w-2xl rounded-lg border border-border bg-card p-8 text-center shadow-2xl">
            <div className="mb-6 flex justify-center">
              {/* Critical Error Icon */}
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
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
            </div>

            <h1 className="mb-2 text-5xl font-bold text-destructive">
              Erro Crítico
            </h1>
            <h2 className="mb-4 text-2xl font-semibold text-card-foreground">
              A aplicação encontrou um problema grave
            </h2>
            <p className="mb-6 text-muted-foreground">
              Pedimos desculpas pelo inconveniente. Nossa equipe foi notificada
              automaticamente e está trabalhando para resolver o problema.
            </p>

            {error.digest && (
              <div className="mb-6 rounded-md bg-muted p-3">
                <p className="text-xs text-muted-foreground">
                  Código de referência:{" "}
                  <code className="font-mono font-semibold">{error.digest}</code>
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={reset}
                className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Recarregar Aplicação
              </button>
              <a
                href="/dashboard"
                className="rounded-md border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Ir para Dashboard
              </a>
            </div>

            <div className="mt-8 border-t border-border pt-6 text-sm text-muted-foreground">
              <p className="mb-2 font-semibold">Precisa de ajuda urgente?</p>
              <a
                href="https://wa.me/5547991011287"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Falar com Suporte via WhatsApp
              </a>
            </div>

            {process.env.NODE_ENV === "development" && (
              <details className="mt-8 cursor-pointer rounded-md bg-muted p-4 text-left">
                <summary className="text-sm font-semibold text-card-foreground">
                  Stack trace (apenas em desenvolvimento)
                </summary>
                <pre className="mt-2 overflow-auto text-xs text-muted-foreground">
                  {error.message}
                  {"\n\n"}
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}

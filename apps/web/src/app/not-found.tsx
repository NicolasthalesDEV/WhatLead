import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/20 p-4">
      <Card className="mx-auto max-w-2xl p-8 text-center shadow-2xl">
        <div className="mb-6 flex justify-center">
          {/* Hotel Icon */}
          <svg
            className="h-24 w-24 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 12h18M3 6h18M9 18h6m-7 0v-2.25A2.25 2.25 0 019.75 13.5h4.5A2.25 2.25 0 0116.5 15.75V18m-7 0H2.25m14.25 0H21.75m-18 0v-7.5A2.25 2.25 0 016 8.25h12a2.25 2.25 0 012.25 2.25V18"
            />
          </svg>
        </div>

        <h1 className="mb-2 text-7xl font-bold text-primary">404</h1>
        <h2 className="mb-4 text-2xl font-semibold text-foreground">
          Página não encontrada
        </h2>
        <p className="mb-8 text-muted-foreground">
          Desculpe, a página que você está procurando não existe ou foi movida.
          Verifique o endereço ou retorne à página inicial.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/dashboard">
            <Button size="lg" className="w-full sm:w-auto">
              Voltar ao Dashboard
            </Button>
          </Link>
          <Link href="/">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
            >
              Ir para Página Inicial
            </Button>
          </Link>
        </div>

        <div className="mt-8 text-sm text-muted-foreground">
          <p>Precisa de ajuda?</p>
          <a
            href="https://wa.me/5547991011287"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Entre em contato com o suporte
          </a>
        </div>
      </Card>
    </div>
  );
}

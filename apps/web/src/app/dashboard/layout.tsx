"use client";

export const dynamic = "force-dynamic";

import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Fecha o menu mobile ao redimensionar para desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fecha sidebar mobile ao navegar para outra página
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Overlay mobile ───────────────────────────────────── */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-[65] bg-black/60 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar desktop (colapsável) ─────────────────────── */}
      <div
        className={cn(
          "hidden overflow-y-auto bg-gray-50 border-r lg:block dark:bg-gray-800/40 transition-all duration-300 ease-in-out",
          sidebarOpen ? "w-64" : "w-16"
        )}
      >
        <Sidebar isOpen={sidebarOpen} />
      </div>

      {/* ── Sidebar mobile (gaveta deslizante) ───────────────── */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-[70] w-72 overflow-y-auto bg-white border-r shadow-2xl dark:bg-gray-800/40 transition-transform duration-300 ease-in-out lg:hidden",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-end px-3 pt-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <Sidebar isOpen={true} />
      </div>

      {/* ── Conteúdo principal ───────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <div className="border-b bg-background">
          <div className="flex items-center min-h-[3.5rem] gap-1 px-2 sm:px-3">
            {/* Botão hamburger — mobile */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileSidebarOpen(true)}
              className="flex lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Botão colapsar — desktop */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:flex"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex-1 min-w-0">
              <Header />
            </div>
          </div>
        </div>
        <main className="flex-1 overflow-y-auto bg-gray-50/40 p-4 dark:bg-gray-900/40">
          <div className="h-full rounded-lg border bg-background p-4 sm:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
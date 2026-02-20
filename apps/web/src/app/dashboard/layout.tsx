"use client";

import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { WhatsAppSetupWizard } from "@/components/whatsapp-setup-wizard";
import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOnboarding } from "@/hooks/useOnboarding";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showWhatsAppWizard, setShowWhatsAppWizard] = useState(false);
  const { isCompleted, startTour } = useOnboarding();

  // Iniciar tour automaticamente se o usuário não completou
  useEffect(() => {
    if (!isCompleted) {
      // Aguardar um pouco para garantir que os elementos estão renderizados
      const timer = setTimeout(() => {
        startTour();
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Se já completou o tour, verificar se deve mostrar o wizard do WhatsApp
      const hasSeenWizard = localStorage.getItem("whatsapp-wizard-completed");
      if (!hasSeenWizard) {
        // Aguardar um pouco após o login para mostrar
        const timer = setTimeout(() => {
          setShowWhatsAppWizard(true);
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [isCompleted, startTour]);

  const handleCloseWizard = () => {
    setShowWhatsAppWizard(false);
    localStorage.setItem("whatsapp-wizard-completed", "true");
  };

  const handleCompleteWizard = () => {
    setShowWhatsAppWizard(false);
    localStorage.setItem("whatsapp-wizard-completed", "true");
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div
        className={cn(
          "hidden overflow-y-auto bg-gray-50 border-r lg:block dark:bg-gray-800/40 transition-all duration-300 ease-in-out",
          sidebarOpen ? "w-64" : "w-16"
        )}
      >
        <Sidebar isOpen={sidebarOpen} />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b bg-background">
          <div className="flex items-center gap-2 px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:flex"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <Header />
            </div>
          </div>
        </div>
        <main className="flex-1 overflow-y-auto bg-gray-50/40 p-4 dark:bg-gray-900/40">
          <div className="h-full rounded-lg border bg-background p-6">
            {children}
          </div>
        </main>
      </div>

      {/* WhatsApp Setup Wizard */}
      {showWhatsAppWizard && (
        <WhatsAppSetupWizard
          onClose={handleCloseWizard}
          onComplete={handleCompleteWizard}
        />
      )}
    </div>
  );
}
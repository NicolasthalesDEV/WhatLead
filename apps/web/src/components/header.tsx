"use client";

import { User, Settings, LogOut, HelpCircle, MessageSquare, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { NotificationBell } from "@/components/notification-bell";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";

export function Header() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const { resetTour } = useOnboarding();

  const navigateToSettings = () => router.push("/dashboard/settings");
  const navigateToProfile = () => router.push("/dashboard/profile");
  const openHelp = () => {
    window.open(
      "https://wa.me/5547991011287?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20o%20WhatLead",
      "_blank"
    );
  };

  return (
    <header className="relative z-50 w-full bg-background">
      <div className="flex h-14 items-center px-2 sm:px-3">
        <div className="flex flex-1 items-center justify-end space-x-1">
          {/* Suporte — abre página de reporte */}
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => router.push("/dashboard/support")}
            title="Reportar problema"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Suporte</span>
          </Button>

          {/* Notificações */}
          <NotificationBell />

          {/* Menu do Usuário */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-4 w-4" />
                <span className="sr-only">Perfil</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {loading ? "Carregando..." : user?.name || "Usuário"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {loading ? "..." : user?.email || ""}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={navigateToProfile}>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={navigateToSettings}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={resetTour}>
                <BookOpen className="mr-2 h-4 w-4" />
                <span>Ver Tutorial Novamente</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={openHelp}>
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Central de Ajuda</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-red-600" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

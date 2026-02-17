"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  BedDouble,
  CalendarCheck,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Bot,
  Hotel,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const sidebarNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Hóspedes",
    href: "/dashboard/customers",
    icon: Users,
  },
  {
    title: "Quartos",
    href: "/dashboard/products",
    icon: BedDouble,
  },
  {
    title: "Reservas",
    href: "/dashboard/orders",
    icon: CalendarCheck,
  },
  {
    title: "WhatsApp",
    href: "/dashboard/whatsapp",
    icon: MessageSquare,
  },
  {
    title: "Chatbot IA",
    href: "/dashboard/chatbot",
    icon: Bot,
  },
  {
    title: "Notificações",
    href: "/dashboard/notifications",
    icon: Bell,
  },
  {
    title: "Relatórios",
    href: "/dashboard/reports",
    icon: BarChart3,
  },
  {
    title: "Configurações",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

interface SidebarProps {
  className?: string;
  isOpen?: boolean;
}

export function Sidebar({ className, isOpen = true }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    // Limpar dados de autenticação (localStorage, cookies, etc.)
    localStorage.removeItem('token');
    localStorage.removeItem('user-data');

    // Redirecionar para página de login
    router.push('/login');
  };

  return (
    <TooltipProvider>
      <div className={cn("pb-12 min-h-screen relative", className)}>
        <div className="space-y-4 py-4">
          <div className={cn("px-3 py-2", !isOpen && "px-2")}>
            <div className="space-y-1">
              <div className={cn("px-4 py-2 mb-4", !isOpen && "px-0 flex justify-center")}>
                {isOpen ? (
                  <>
                    <div className="flex items-center space-x-2">
                      <Hotel className="h-6 w-6 text-primary" />
                      <h1 className="text-2xl font-bold text-primary">HotelCRM</h1>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Sistema de Gestão Hoteleira
                    </p>
                  </>
                ) : (
                  <Hotel className="h-6 w-6 text-primary" />
                )}
              </div>
              <nav className="space-y-1">
                {sidebarNavItems.map((item) => (
                  isOpen ? (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                        pathname === item.href
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  ) : (
                    <Tooltip key={item.href} delayDuration={0}>
                      <TooltipTrigger asChild>
                        <Link
                          href={item.href}
                          className={cn(
                            "group flex items-center justify-center rounded-md p-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                            pathname === item.href
                              ? "bg-accent text-accent-foreground"
                              : "text-muted-foreground"
                          )}
                        >
                          <item.icon className="h-5 w-5" />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{item.title}</p>
                      </TooltipContent>
                    </Tooltip>
                  )
                ))}
              </nav>
            </div>
          </div>
        </div>
        <div className={cn("absolute bottom-4 left-0 right-0 px-3", !isOpen && "px-2")}>
          {isOpen ? (
            <button
              onClick={handleLogout}
              className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </button>
          ) : (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center rounded-md p-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Sair</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
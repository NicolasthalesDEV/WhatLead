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
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    // Limpar dados de autenticação (localStorage, cookies, etc.)
    localStorage.removeItem('auth-token');
    localStorage.removeItem('user-data');

    // Redirecionar para página de login
    router.push('/login');
  };

  return (
    <div className={cn("pb-12 min-h-screen relative", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="space-y-1">
            <div className="px-4 py-2 mb-4">
              <div className="flex items-center space-x-2">
                <Hotel className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold text-primary">HotelCRM</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                Sistema de Gestão Hoteleira
              </p>
            </div>
            <nav className="space-y-1">
              {sidebarNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                    pathname === item.href
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
      <div className="absolute bottom-4 left-0 right-0 px-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
}
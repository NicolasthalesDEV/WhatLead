"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  Settings,
  LogOut,
  Bot,
  Zap,
  DollarSign,
  Building2,
  Building,
  Activity,
  Users,
  ShoppingCart,
  Package,
  FileText,
  TicketCheck,
  TrendingUp,
  BarChart3,
  Layers,
  Bell,
  CalendarDays,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";

const sidebarNavItems = [
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
    title: "Clientes",
    href: "/dashboard/customers",
    icon: Users,
  },
  {
    title: "Funil de Vendas",
    href: "/dashboard/funnel",
    icon: Layers,
  },
  {
    title: "Pedidos",
    href: "/dashboard/orders",
    icon: ShoppingCart,
  },
  {
    title: "Produtos",
    href: "/dashboard/products",
    icon: Package,
  },
  {
    title: "Orçamentos",
    href: "/dashboard/quotes",
    icon: FileText,
  },
  {
    title: "Tickets",
    href: "/dashboard/tickets",
    icon: TicketCheck,
  },
  {
    title: "NPS",
    href: "/dashboard/nps",
    icon: TrendingUp,
  },
  {
    title: "Relatórios",
    href: "/dashboard/reports",
    icon: BarChart3,
  },
  {
    title: "Agenda",
    href: "/dashboard/agenda",
    icon: CalendarDays,
  },
  {
    title: "Notificações",
    href: "/dashboard/notifications",
    icon: Bell,
  },
  {
    title: "Custos de API",
    href: "/dashboard/api-costs",
    icon: DollarSign,
  },
  {
    title: "Empresa",
    href: "/dashboard/settings/company",
    icon: Building,
    roles: ["OWNER", "ADMIN"],
  },
  {
    title: "Configurações",
    href: "/dashboard/settings",
    icon: Settings,
  },
  {
    title: "Admin: Empresas",
    href: "/dashboard/admin/companies",
    icon: Building2,
    superAdminOnly: true,
  },
  {
    title: "Admin: Filas",
    href: "/dashboard/admin/queues",
    icon: Activity,
    superAdminOnly: true,
  },
] as const;

interface SidebarProps {
  className?: string;
  isOpen?: boolean;
}

export function Sidebar({ className, isOpen = true }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Super-admin check: NEXT_PUBLIC_SUPER_ADMIN_EMAILS is a CSV of emails
  const superAdminEmails = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase());
  const isSuperAdmin =
    superAdminEmails.length > 0 &&
    !!user?.email &&
    superAdminEmails.includes(user.email.toLowerCase());

  const visibleItems = sidebarNavItems.filter((item) => {
    if ((item as any).superAdminOnly && !isSuperAdmin) return false;
    if ((item as any).roles && user?.role && !(item as any).roles.includes(user.role)) return false;
    return true;
  });

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
                      <Zap className="h-6 w-6 text-primary" />
                      <h1 className="text-2xl font-bold text-primary">WhatLead</h1>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      WhatsApp + Chatbot IA
                    </p>
                  </>
                ) : (
                  <Zap className="h-6 w-6 text-primary" />
                )}
              </div>
              <nav className="space-y-1">
                {visibleItems.map((item) => (
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
        <div className={cn("absolute bottom-4 left-0 right-0 px-3 space-y-2", !isOpen && "px-2")}>
          {isOpen ? (
            <button
              onClick={logout}
              className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </button>
          ) : (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={logout}
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
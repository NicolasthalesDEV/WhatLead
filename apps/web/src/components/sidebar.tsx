"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  CreditCard,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";

const sidebarNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Clientes",
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
  const { user, logout } = useAuth();
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const response = await fetch('/api/billing/subscription', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setSubscription(data.subscription);
        }
      } catch (error) {
        console.error('Failed to fetch subscription:', error);
      }
    }
    fetchSubscription();
  }, []);

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
        <div className={cn("absolute bottom-4 left-0 right-0 px-3 space-y-2", !isOpen && "px-2")}>
          {/* Informação do Plano */}
          {subscription && isOpen && (
            <Link href="/dashboard/settings?section=billing">
              <div className={cn(
                "p-3 rounded-lg border text-xs cursor-pointer hover:bg-accent transition-colors",
                subscription.isExpiringSoon && !subscription.isExpired 
                  ? "border-yellow-300 bg-yellow-50" 
                  : subscription.isExpired 
                  ? "border-red-300 bg-red-50"
                  : "border-gray-200 bg-gray-50"
              )}>
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="h-3 w-3" />
                  <span className="font-medium">
                    {subscription.plan === 'free' ? 'Gratuito' :
                     subscription.plan === 'starter' ? 'Starter' :
                     subscription.plan === 'professional' ? 'Professional' :
                     subscription.plan === 'enterprise' ? 'Enterprise' : subscription.plan}
                  </span>
                  {subscription.planStatus === 'trial' && (
                    <span className="px-1 py-0.5 bg-blue-500 text-white rounded text-[10px]">
                      Trial
                    </span>
                  )}
                </div>
                {subscription.expiresIn && (
                  <div className={cn(
                    "text-[10px]",
                    subscription.isExpiringSoon && !subscription.isExpired
                      ? "text-yellow-700"
                      : subscription.isExpired
                      ? "text-red-700"
                      : "text-gray-600"
                  )}>
                    {subscription.expiresIn}
                  </div>
                )}
              </div>
            </Link>
          )}

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
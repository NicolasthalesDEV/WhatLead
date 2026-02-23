"use client";

export const dynamic = "force-dynamic";

import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

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

    </div>
  );
}
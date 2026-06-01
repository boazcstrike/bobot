"use client";

import { usePathname } from "next/navigation";

import AppSidebar from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

const PAGE_TITLES = {
  "/": "Control Center",
  "/laundry": "Laundry",
  "/expenses": "Expenses",
  "/expense-dashboard": "Expense Dashboard",
  "/personal-github-repos": "Personal GitHub Repos",
  "/credit-card-statements": "Credit Card Statements",
};

export default function ControlRailShell({
  children,
  mainClassName = "dashboard-main",
  pageClassName = "",
  onOpenSettings = undefined,
  pendingStatements = 0,
}) {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "Dashboard";

  return (
    <TooltipProvider delay={200}>
      <SidebarProvider>
        <AppSidebar
          pendingStatements={pendingStatements}
          onOpenSettings={onOpenSettings}
        />
        <SidebarInset>
          <header className="dashboard-topbar">
            <SidebarTrigger />
            <Separator orientation="vertical" className="dashboard-topbar-sep" />
            <span className="dashboard-topbar-title">{title}</span>
          </header>

          <div className={`dashboard ${pageClassName}`.trim()}>
            <div className="mesh-bg" aria-hidden="true" />
            <div className="aurora-blobs" aria-hidden="true">
              <span className="aurora-blob b1" />
              <span className="aurora-blob b2" />
              <span className="aurora-blob b3" />
            </div>
            <div className={mainClassName}>{children}</div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}

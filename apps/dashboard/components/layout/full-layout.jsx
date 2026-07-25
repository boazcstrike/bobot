"use client";

import Header from "@/components/layout/header/header";
import Footer from "@/components/layout/shared/footer";
import SidebarLayout from "@/components/layout/sidebar/sidebar-layout";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function FullLayout({ children, onOpenSettings, pendingStatements = 0 }) {
  return (
    <TooltipProvider delay={200}>
      <SidebarProvider
        defaultOpen
        style={{ "--sidebar-width-icon": "52px" }}
      >
        <SidebarLayout
          pendingStatements={pendingStatements}
          onOpenSettings={onOpenSettings}
        />

        <SidebarInset className="m-2 overflow-hidden rounded-none! outline outline-border">
          <Header onOpenSettings={onOpenSettings} />

          <div className="flex flex-1 flex-col gap-4 p-4">
            <div className="container mx-auto w-full">
              <div className="min-h-[calc(100vh-140px)]">{children}</div>
              <div className="pt-6">
                <Footer />
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}

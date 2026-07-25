"use client";

import NavCollapse from "./nav-collapse";
import sidebarItems from "./sidebar-items";
import { NavSecondary } from "./nav-secondary";
import NavUser from "@/components/nav-user";
import FullLogo from "@/components/layout/shared/logo";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar";

export default function SidebarLayout({ pendingStatements = 0, onOpenSettings, ...props }) {
  const badges = pendingStatements
    ? { "credit-card-statements": String(pendingStatements) }
    : {};

  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      side="left"
      className="sidebar-box **:data-[slot=sidebar-inner]:border **:data-[slot=sidebar-inner]:border-border **:data-[slot=sidebar-inner]:bg-background group-data-[state=collapsed]:hover:shadow-xl"
      {...props}
    >
      <SidebarHeader className="flex flex-row items-center justify-between border-b border-border p-3 group-data-[state=collapsed]:px-2.5">
        <FullLogo />
        <Badge className="hide-menu" variant="secondary">
          V.1.0
        </Badge>
      </SidebarHeader>

      <SidebarContent className="overflow-y-auto">
        <SidebarGroup className="flex items-center justify-center px-3 py-4 group-data-[state=collapsed]:px-2">
          <div className="flex w-full flex-col gap-4 px-0 group-data-[state=collapsed]:px-0">
            <NavCollapse menu={sidebarItems} className="text-sm" badges={badges} />
          </div>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex flex-col gap-2">
          <NavSecondary pendingStatements={pendingStatements} />
          <NavUser onOpenSettings={onOpenSettings} />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

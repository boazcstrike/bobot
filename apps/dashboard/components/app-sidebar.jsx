"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  ChartColumn,
  ChevronRight,
  CreditCard,
  GitFork,
  House,
  Shirt,
  WalletCards,
} from "lucide-react";

import NavUser from "@/components/nav-user";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const TOP_NAV_ITEMS = [
  { href: "/", icon: House, label: "Home" },
  { href: "/laundry", icon: Shirt, label: "Laundry" },
  { href: "/personal-github-repos", icon: GitFork, label: "Personal GitHub Repos" },
];

const EXPENSES_CHILDREN = [
  {
    href: "/expense-dashboard",
    icon: ChartColumn,
    label: "Expense Dashboard",
  },
  {
    href: "/credit-card-statements",
    icon: CreditCard,
    label: "Credit Card Statement",
    badge: true,
  },
];

export default function AppSidebar({ pendingStatements = 0, onOpenSettings }) {
  const pathname = usePathname();

  const expensesActive = pathname === "/expenses";
  const childActive = EXPENSES_CHILDREN.some(({ href }) => pathname === href);
  const [expensesOpen, setExpensesOpen] = useState(expensesActive || childActive);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="Bobot" render={<Link href="/" />}>
              <span className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <Bot className="size-4" />
              </span>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold tracking-wide uppercase">Bobot</span>
                <span className="text-muted-foreground truncate text-xs">Control Deck</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            {TOP_NAV_ITEMS.map(({ href, icon: Icon, label }) => (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton
                  isActive={pathname === href}
                  tooltip={label}
                  render={<Link href={href} />}
                >
                  <Icon />
                  <span>{label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}

            <Collapsible
              open={expensesOpen}
              onOpenChange={setExpensesOpen}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={expensesActive}
                  tooltip="Expenses"
                  render={<Link href="/expenses" />}
                >
                  <WalletCards />
                  <span>Expenses</span>
                </SidebarMenuButton>
                <CollapsibleTrigger render={<SidebarMenuAction />}>
                  <ChevronRight
                    className={`transition-transform ${expensesOpen ? "rotate-90" : ""}`}
                  />
                  <span className="sr-only">Toggle Expenses</span>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {EXPENSES_CHILDREN.map(({ href, icon: Icon, label, badge }) => (
                      <SidebarMenuSubItem key={href}>
                        <SidebarMenuSubButton
                          isActive={pathname === href}
                          render={<Link href={href} />}
                        >
                          <Icon />
                          <span>{label}</span>
                        </SidebarMenuSubButton>
                        {badge && pendingStatements > 0 && (
                          <SidebarMenuBadge>{pendingStatements}</SidebarMenuBadge>
                        )}
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser onOpenSettings={onOpenSettings} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

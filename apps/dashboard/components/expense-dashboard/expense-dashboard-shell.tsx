"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { WalletCards } from "lucide-react";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { cn } from "../../lib/utils";

export type ExpenseDashboardTab = "expenses" | "statements";

export type ExpenseDashboardNavLink = {
  href: string;
  label: string;
  icon?: ReactNode;
};

type ExpenseDashboardShellProps = {
  activeTab: ExpenseDashboardTab;
  onTabChange: (value: ExpenseDashboardTab) => void;
  navLinks?: ExpenseDashboardNavLink[];
  title?: string;
  description?: string;
  pendingStatements?: number;
  children: ReactNode;
  className?: string;
};

export function ExpenseDashboardShell({
  activeTab,
  onTabChange,
  navLinks = [],
  title = "Expense Tracker",
  description = "Expense analytics and credit card statement operations in one workspace.",
  pendingStatements = 0,
  children,
  className,
}: ExpenseDashboardShellProps) {
  return (
    <div className={cn("grid gap-4", className)}>
      <Card className="border border-border/80 bg-card/95 shadow-sm">
        <CardContent className="flex flex-col gap-4 p-4 sm:p-5">
          {navLinks.length ? (
            <nav
              aria-label="Expense dashboard navigation"
              className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground"
            >
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              ))}
            </nav>
          ) : null}

          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-foreground">
                <WalletCards className="size-5" aria-hidden="true" />
                <h1 className="font-heading text-lg font-medium uppercase tracking-[0.06em] sm:text-xl">
                  {title}
                </h1>
              </div>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
            {pendingStatements > 0 ? (
              <Badge variant="outline" className="self-start border-amber-300 bg-amber-50 text-amber-800">
                {pendingStatements} pending statements
              </Badge>
            ) : null}
          </div>

          <Tabs value={activeTab} onValueChange={(value: string) => onTabChange(value as ExpenseDashboardTab)}>
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
              <TabsTrigger value="statements">Credit Card Statements</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {children}
    </div>
  );
}

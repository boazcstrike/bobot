"use client";

import { ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// A single sidebar row. The hover wash is a CSS transition rather than a
// layout-animated element so the rail stays cheap to render on every route.
export default function NavItem({
  item,
  hasChildren,
  className,
  isActive,
  badgeContent,
}) {
  const Icon = item.icon;

  return (
    <div
      className={cn(
        "group/navitem relative my-0.5 flex w-full items-center gap-3 rounded-md px-3 py-2 transition-all duration-200 group-data-[state=collapsed]:px-2.5",
        isActive ? "bg-primary text-primary-foreground font-medium" : "hover:bg-primary/5",
        className,
      )}
    >
      <span className="relative flex w-full items-center gap-2 rounded-md">
        {Icon ? <Icon className={cn("h-4 w-4 shrink-0", item.color)} /> : null}

        <span className="hide-menu font-medium">{item.name}</span>

        {badgeContent ? (
          <Badge
            variant={isActive ? "secondary" : "default"}
            className="hide-menu ms-auto h-auto! rounded-full px-1.5 py-0.5 text-[10px]!"
          >
            {badgeContent}
          </Badge>
        ) : null}

        {hasChildren ? (
          <ChevronRight className="hide-menu ms-auto h-4 w-4 transition-transform duration-200 group-open/nav:rotate-90" />
        ) : null}
      </span>
    </div>
  );
}

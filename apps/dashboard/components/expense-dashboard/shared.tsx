"use client";

import type { ReactNode } from "react";
import { AlertCircle, Inbox } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { cn } from "../../lib/utils";

export type MetricStat = {
  label: string;
  value: string | number | null | undefined;
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger";
};

export type BreakdownItem = {
  name: string;
  value: string | number;
  auxiliary?: string;
};

export type ChartDatum = {
  label: string;
  value: number;
  secondaryValue?: number;
  fill?: string;
};

export const chartPalette = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function formatCompactNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "string") return value;
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

export function formatPeso(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "string") return value;
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDateTimeLabel(value?: string | null) {
  if (!value) return "N/A";
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return value;
  return new Date(parsed).toLocaleString();
}

export function SectionIntro({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-heading text-base font-medium leading-tight text-foreground sm:text-lg">
          {title}
        </h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  className,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-full min-h-40 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/80 bg-muted/35 px-5 py-6 text-center",
        className,
      )}
    >
      <div className="flex size-10 items-center justify-center rounded-full bg-background text-muted-foreground ring-1 ring-border/70">
        {icon ?? <Inbox className="size-4" aria-hidden="true" />}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function MetricGrid({ stats }: { stats: MetricStat[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} size="sm" className="border border-border/80 bg-card/95 shadow-sm">
          <CardHeader className="gap-2 pb-0">
            <CardDescription className="text-xs uppercase tracking-[0.14em]">
              {stat.label}
            </CardDescription>
            <CardTitle
              className={cn(
                "text-xl sm:text-2xl",
                stat.tone === "success" && "text-emerald-700",
                stat.tone === "warning" && "text-amber-700",
                stat.tone === "danger" && "text-red-700",
              )}
            >
              {formatCompactNumber(stat.value)}
            </CardTitle>
          </CardHeader>
          {stat.hint ? (
            <CardContent className="pt-0 text-xs text-muted-foreground">{stat.hint}</CardContent>
          ) : null}
        </Card>
      ))}
    </div>
  );
}

export function BreakdownList({
  title,
  description,
  items,
  emptyTitle,
  emptyDescription,
}: {
  title: string;
  description?: string;
  items: BreakdownItem[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  return (
    <Card className="border border-border/80 bg-card/95 shadow-sm">
      <CardHeader className="pb-1">
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length ? (
          items.map((item) => (
            <div
              key={`${title}-${item.name}`}
              className="flex items-start justify-between gap-3 rounded-lg border border-border/70 bg-background/70 px-3 py-2"
            >
              <div className="min-w-0 space-y-1">
                <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                {item.auxiliary ? (
                  <p className="text-xs text-muted-foreground">{item.auxiliary}</p>
                ) : null}
              </div>
              <p className="shrink-0 text-sm font-semibold text-foreground">{item.value}</p>
            </div>
          ))
        ) : (
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            icon={<AlertCircle className="size-4" aria-hidden="true" />}
            className="min-h-52"
          />
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { AlertTriangle } from "lucide-react";
import type { DataQualitySummary } from "@/lib/expense-dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function DataQualityPanel({ summary }: { summary: DataQualitySummary }) {
  const items = [
    ["Total Rows", summary.totalRows],
    ["Valid Rows", summary.validRows],
    ["Invalid Amount Rows", summary.invalidAmountRows],
    ["Invalid Date Rows", summary.invalidDateRows],
    ["Missing Category Rows", summary.missingCategoryRows],
    ["Invalid Month Rows", summary.invalidMonthRows],
  ];

  return (
    <Card className="border border-amber-300/60 bg-card/95 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-amber-600" aria-hidden="true" />
          Data Quality
        </CardTitle>
        <CardDescription>
          Some charts exclude records with invalid amounts or invalid dates. Uncategorized records remain included.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-border/70 bg-background/70 p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
            <p className="mt-1 text-xl font-semibold">{value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

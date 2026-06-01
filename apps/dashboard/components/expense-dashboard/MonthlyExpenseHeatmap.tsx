"use client";

import type { MonthlyTotal } from "@/lib/expense-dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPeso } from "./shared";

export function MonthlyExpenseHeatmap({ data }: { data: MonthlyTotal[] }) {
  const max = Math.max(...data.map((item) => item.totalPhp), 1);
  return (
    <Card className="border border-border/80 bg-card/95 shadow-sm">
      <CardHeader>
        <CardTitle>Monthly Heatmap</CardTitle>
        <CardDescription>Which months were unusually expensive.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {data.map((item) => (
          <div
            key={item.dateKey}
            className="rounded-lg border border-border/70 p-3"
            style={{ background: `color-mix(in srgb, var(--chart-1) ${Math.max(8, (item.totalPhp / max) * 55)}%, var(--background))` }}
          >
            <p className="text-xs text-muted-foreground">{item.dateKey}</p>
            <p className="mt-1 text-sm font-semibold">{formatPeso(item.totalPhp)}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

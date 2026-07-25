"use client";

import { useMemo, useState } from "react";
import type { MerchantTotal, YearlyTotal, NormalizedExpenseRecord } from "@/lib/expense-dashboard";
import { getCategoryTotals, getMerchantTotals } from "@/lib/expense-dashboard/aggregations";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPeso } from "./shared";

export function YearComparisonView({
  records,
  yearlyTotals,
  years,
}: {
  records: NormalizedExpenseRecord[];
  yearlyTotals: YearlyTotal[];
  merchantTotals: MerchantTotal[];
  years: number[];
}) {
  const [yearA, setYearA] = useState(String(years[Math.max(0, years.length - 2)] ?? ""));
  const [yearB, setYearB] = useState(String(years[years.length - 1] ?? ""));
  const comparison = useMemo(() => {
    return [yearA, yearB].map((year) => {
      const scoped = records.filter((record) => String(record.year) === year);
      return {
        year,
        total: yearlyTotals.find((item) => String(item.year) === year)?.totalPhp ?? 0,
        categories: getCategoryTotals(scoped).slice(0, 3),
        merchants: getMerchantTotals(scoped).slice(0, 3),
      };
    });
  }, [records, yearA, yearB, yearlyTotals]);

  return (
    <Card className="border border-border/80 bg-card/95 shadow-sm">
      <CardHeader>
        <CardTitle>Year Comparison</CardTitle>
        <CardDescription>Compare total spend, top categories, and top merchants.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {[yearA, yearB].map((value, index) => (
            <Select
              key={index}
              value={value}
              onValueChange={(next) => {
                if (!next) return;
                if (index === 0) setYearA(next);
                else setYearB(next);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Year ${index === 0 ? "A" : "B"}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {years.map((year) => (
                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {comparison.map((item) => (
            <div key={item.year} className="rounded-lg border border-border/70 bg-background/70 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{item.year}</p>
              <p className="mt-1 text-2xl font-semibold">{formatPeso(item.total)}</p>
              <p className="mt-3 text-sm font-medium">Top categories</p>
              <p className="text-sm text-muted-foreground">{item.categories.map((cat) => cat.category).join(", ") || "-"}</p>
              <p className="mt-3 text-sm font-medium">Top merchants</p>
              <p className="text-sm text-muted-foreground">{item.merchants.map((merchant) => merchant.merchant).join(", ") || "-"}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

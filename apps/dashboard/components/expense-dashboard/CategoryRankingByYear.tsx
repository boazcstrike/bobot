"use client";

import { useMemo, useState } from "react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BreakdownList } from "./shared";
import { formatPeso } from "./shared";

export function CategoryRankingByYear({
  data,
  years,
}: {
  data: Array<Record<string, string | number>>;
  years: number[];
}) {
  const [year, setYear] = useState(String(years[years.length - 1] ?? ""));
  const items = useMemo(() => {
    const row = data.find((item) => String(item.year) === year);
    if (!row) return [];
    return Object.entries(row)
      .filter(([key]) => key !== "year")
      .map(([name, value]) => ({ name, value: Number(value) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
      .map((item) => ({ name: item.name, value: formatPeso(item.value) }));
  }, [data, year]);

  return (
    <div className="grid gap-3">
      <Select value={year} onValueChange={(value) => value && setYear(value)}>
        <SelectTrigger className="w-full max-w-xs">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {years.map((item) => (
              <SelectItem key={item} value={String(item)}>{item}</SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <BreakdownList title="Category Ranking By Year" description="Ranked categories for the selected year." items={items} emptyTitle="No year data" emptyDescription="Select a year with valid rows." />
    </div>
  );
}

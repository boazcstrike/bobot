"use client";

import { useMemo, useState } from "react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartCard, SimpleLineChart } from "./chart-primitives";

export function CategoryTrendChart({
  data,
  categories,
}: {
  data: Array<Record<string, string | number>>;
  categories: string[];
}) {
  const [category, setCategory] = useState(categories[0] ?? "");
  const chartData = useMemo(
    () => data.map((item) => ({ dateKey: String(item.dateKey), totalPhp: Number(item[category] ?? 0) })),
    [category, data],
  );

  return (
    <div className="grid gap-3">
      <Select value={category} onValueChange={(value) => value && setCategory(value)}>
        <SelectTrigger className="w-full max-w-xs">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {categories.map((item) => (
              <SelectItem key={item} value={item}>{item}</SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <ChartCard title="Category Trend" description="Selected category over time." empty={!chartData.length || !category}>
        <SimpleLineChart data={chartData} xKey="dateKey" yKey="totalPhp" />
      </ChartCard>
    </div>
  );
}

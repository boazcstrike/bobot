"use client";

import { ChartCard, StackedBarChart } from "./chart-primitives";

export function MonthlyCategoryStackedBarChart({
  data,
  categories,
}: {
  data: Array<Record<string, string | number>>;
  categories: string[];
}) {
  return (
    <ChartCard title="Monthly Category Composition" description="Category composition by month." empty={!data.length}>
      <StackedBarChart data={data} xKey="dateKey" keys={categories.slice(0, 6)} />
    </ChartCard>
  );
}

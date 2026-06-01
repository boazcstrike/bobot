"use client";

import { ChartCard, StackedBarChart } from "./chart-primitives";

export function YearlyCategoryStackedBarChart({
  data,
  categories,
}: {
  data: Array<Record<string, string | number>>;
  categories: string[];
}) {
  return (
    <ChartCard title="Yearly Category Composition" description="Category composition per year." empty={!data.length}>
      <StackedBarChart data={data} xKey="year" keys={categories.slice(0, 6)} />
    </ChartCard>
  );
}

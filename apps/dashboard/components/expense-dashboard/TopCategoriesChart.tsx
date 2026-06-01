"use client";

import type { CategoryTotal } from "@/lib/expense-dashboard";
import { ChartCard, HorizontalBarChart } from "./chart-primitives";

export function TopCategoriesChart({ data }: { data: CategoryTotal[] }) {
  return (
    <ChartCard title="Top Categories" description="Largest expense categories." empty={!data.length}>
      <HorizontalBarChart data={data.map((item) => ({ category: item.category, totalPhp: item.totalPhp }))} xKey="totalPhp" yKey="category" />
    </ChartCard>
  );
}

"use client";

import type { CategoryTotal } from "@/lib/expense-dashboard";
import { ChartCard, DonutChart } from "./chart-primitives";

export function CategorySpendBreakdownChart({ data }: { data: CategoryTotal[] }) {
  return (
    <ChartCard title="Category Spend Breakdown" description="Where the money went." empty={!data.length}>
      <DonutChart data={data.slice(0, 8).map((item) => ({ name: item.category, value: item.totalPhp }))} />
    </ChartCard>
  );
}

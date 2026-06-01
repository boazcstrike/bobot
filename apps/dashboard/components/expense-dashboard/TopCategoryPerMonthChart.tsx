"use client";

import type { TopCategoryPerMonth } from "@/lib/expense-dashboard";
import { ChartCard, SimpleBarChart } from "./chart-primitives";

export function TopCategoryPerMonthChart({ data }: { data: TopCategoryPerMonth[] }) {
  return (
    <ChartCard title="Monthly Category Dominance" description="How large each winning category was." empty={!data.length}>
      <SimpleBarChart data={data.slice(-24).map((item) => ({ dateKey: item.dateKey, amount: item.amount }))} xKey="dateKey" yKey="amount" />
    </ChartCard>
  );
}

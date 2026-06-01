"use client";

import type { MonthlyTotal } from "@/lib/expense-dashboard";
import { ChartCard, SimpleLineChart } from "./chart-primitives";

export function MonthlyExpenseTrendChart({ data }: { data: MonthlyTotal[] }) {
  return (
    <ChartCard title="Monthly Expense Trend" description="How much you spent each month." empty={!data.length}>
      <SimpleLineChart data={data.map((item) => ({ dateKey: item.dateKey, totalPhp: item.totalPhp }))} xKey="dateKey" yKey="totalPhp" />
    </ChartCard>
  );
}

"use client";

import type { MonthlyTotal } from "@/lib/expense-dashboard";
import { ChartCard, SimpleBarChart } from "./chart-primitives";

export function MonthlyExpenseBarChart({ data }: { data: MonthlyTotal[] }) {
  return (
    <ChartCard title="Monthly Expense Bars" description="Monthly totals comparison." empty={!data.length}>
      <SimpleBarChart data={data.map((item) => ({ dateKey: item.dateKey, totalPhp: item.totalPhp }))} xKey="dateKey" yKey="totalPhp" />
    </ChartCard>
  );
}

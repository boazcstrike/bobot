"use client";

import type { YearlyTotal } from "@/lib/expense-dashboard";
import { ChartCard, SimpleLineChart } from "./chart-primitives";

export function YearlyExpenseTrendChart({ data }: { data: YearlyTotal[] }) {
  return (
    <ChartCard title="Yearly Expense Trend" description="Total spend by calendar year." empty={!data.length}>
      <SimpleLineChart data={data.map((item) => ({ year: item.year, totalPhp: item.totalPhp }))} xKey="year" yKey="totalPhp" />
    </ChartCard>
  );
}

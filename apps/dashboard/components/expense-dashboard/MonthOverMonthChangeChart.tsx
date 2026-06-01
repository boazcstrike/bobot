"use client";

import type { ChangePoint } from "@/lib/expense-dashboard";
import { ChangeChart, ChartCard } from "./chart-primitives";

export function MonthOverMonthChangeChart({ data }: { data: ChangePoint[] }) {
  return (
    <ChartCard title="Month-over-Month Change" description="Spending acceleration and decline." empty={data.length < 2}>
      <ChangeChart data={data.filter((item) => item.absoluteChange !== null)} />
    </ChartCard>
  );
}

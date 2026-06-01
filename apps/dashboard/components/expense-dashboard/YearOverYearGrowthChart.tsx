"use client";

import type { ChangePoint } from "@/lib/expense-dashboard";
import { ChangeChart, ChartCard } from "./chart-primitives";

export function YearOverYearGrowthChart({ data }: { data: ChangePoint[] }) {
  return (
    <ChartCard title="Year-over-Year Growth" description="Absolute and percentage change by year." empty={data.length < 2}>
      <ChangeChart data={data.filter((item) => item.absoluteChange !== null)} />
    </ChartCard>
  );
}

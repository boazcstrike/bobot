"use client";

import type { ForecastPoint } from "@/lib/expense-dashboard";
import { ChartCard, SimpleLineChart } from "./chart-primitives";

export function FiveYearForecastChart({ data }: { data: ForecastPoint[] }) {
  return (
    <ChartCard title="Five-Year Forecast" description="Projected expenses for the next five calendar years." empty={!data.length}>
      <SimpleLineChart data={data.map((item) => ({ year: item.year, projectedPhp: item.projectedPhp }))} xKey="year" yKey="projectedPhp" />
    </ChartCard>
  );
}

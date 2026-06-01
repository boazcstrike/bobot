"use client";

import type { ForecastScenarioPoint } from "@/lib/expense-dashboard";
import { ChartCard, ForecastBandChart } from "./chart-primitives";

export function ForecastScenariosChart({ data }: { data: ForecastScenarioPoint[] }) {
  return (
    <ChartCard title="Forecast Scenarios" description="Low, base, and high expense scenarios." empty={!data.length}>
      <ForecastBandChart data={data} />
    </ChartCard>
  );
}

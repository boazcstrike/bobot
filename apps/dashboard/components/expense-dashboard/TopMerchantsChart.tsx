"use client";

import type { MerchantTotal } from "@/lib/expense-dashboard";
import { ChartCard, HorizontalBarChart } from "./chart-primitives";

export function TopMerchantsChart({ data }: { data: MerchantTotal[] }) {
  return (
    <ChartCard title="Top Merchants" description="Merchants receiving the most money." empty={!data.length}>
      <HorizontalBarChart data={data.slice(0, 12).map((item) => ({ merchant: item.merchant, totalPhp: item.totalPhp }))} xKey="totalPhp" yKey="merchant" />
    </ChartCard>
  );
}

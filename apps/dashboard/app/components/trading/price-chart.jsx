"use client";

import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, ReferenceDot, XAxis, YAxis } from "recharts";
import { CandlestickChart } from "lucide-react";

import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { DashboardCard } from "@/components/shared/dashboard-card";
import { Skeleton } from "@/components/ui/skeleton";

import { money, percent } from "./format";

const CHART_CONFIG = {
  close: { label: "Close", color: "var(--primary)" },
};

function axisLabel(openTime) {
  const date = new Date(openTime);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

// Fills are drawn on the price line so a signal can be read against the candle
// that triggered it. Each dot snaps to the nearest candle by time.
function markersForOrders(candles, orders) {
  if (candles.length === 0) return [];
  const first = candles[0].openTime;
  const last = candles.at(-1).openTime;

  return orders
    .filter((order) => order.status === "FILLED" && Number(order.avgPrice) > 0)
    .map((order) => {
      const at = new Date(order.createdAt).getTime();
      if (at < first || at > last) return null;
      const candle = candles.reduce((closest, entry) =>
        Math.abs(entry.openTime - at) < Math.abs(closest.openTime - at) ? entry : closest,
      );
      return { key: order.clientOrderId, label: candle.label, price: Number(order.avgPrice), side: order.side };
    })
    .filter(Boolean);
}

export default function PriceChart({ market, orders = [], loading, error }) {
  const candles = useMemo(
    () => (market?.candles ?? []).map((candle) => ({ ...candle, label: axisLabel(candle.openTime) })),
    [market],
  );
  const markers = useMemo(() => markersForOrders(candles, orders), [candles, orders]);

  const change = market?.ticker?.priceChangePercent ?? 0;

  return (
    <DashboardCard className="py-6">
      <CardHeader className="px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base">
              {market?.symbol ?? "Price"} {market?.interval ? `· ${market.interval}` : ""}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {market
                ? `${money(market.ticker.lastPrice)} · 24h range ${money(market.ticker.lowPrice)} to ${money(market.ticker.highPrice)}`
                : "Candles from the Binance REST API"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {market ? (
              <span
                className={`font-mono text-sm tabular-nums ${change >= 0 ? "text-chart-2" : "text-destructive"}`}
              >
                {percent(change)}
              </span>
            ) : null}
            <div className="w-fit rounded-md border border-border p-2">
              <CandlestickChart size={15} />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-6">
        {loading && candles.length === 0 ? (
          <Skeleton className="h-[280px] w-full" />
        ) : error ? (
          <div className="flex h-[280px] flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <p className="text-xs text-muted-foreground">
              Check the symbol, or whether this network can reach Binance.
            </p>
          </div>
        ) : candles.length === 0 ? (
          <div className="flex h-[280px] items-center justify-center">
            <p className="text-sm text-muted-foreground">No candles for this symbol yet.</p>
          </div>
        ) : (
          <ChartContainer config={CHART_CONFIG} className="h-[280px]! w-full">
            <LineChart data={candles} margin={{ top: 8, right: 8, bottom: 0, left: -6 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                minTickGap={40}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              />
              <YAxis
                domain={["dataMin", "dataMax"]}
                tickLine={false}
                axisLine={false}
                tickMargin={4}
                width={58}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickFormatter={(value) =>
                  value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(2)
                }
              />
              <ChartTooltip
                cursor={{ stroke: "var(--border)", strokeWidth: 1, strokeDasharray: "4 4" }}
                content={<ChartTooltipContent />}
              />
              <Line
                dataKey="close"
                type="linear"
                stroke="var(--primary)"
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 4, fill: "var(--primary)", strokeWidth: 0 }}
                animationDuration={700}
                animationEasing="ease-out"
              />
              {markers.map((marker) => (
                <ReferenceDot
                  key={marker.key}
                  x={marker.label}
                  y={marker.price}
                  r={4}
                  fill={marker.side === "BUY" ? "var(--chart-2)" : "var(--destructive)"}
                  stroke="var(--background)"
                  strokeWidth={1.5}
                  isFront
                />
              ))}
            </LineChart>
          </ChartContainer>
        )}

        {markers.length > 0 ? (
          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-chart-2" aria-hidden="true" />
              Buy fill
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-destructive" aria-hidden="true" />
              Sell fill
            </span>
          </div>
        ) : null}
      </CardContent>
    </DashboardCard>
  );
}

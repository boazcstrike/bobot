"use client";

import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { TrendingUp } from "lucide-react";

import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { DashboardCard } from "@/components/shared/dashboard-card";
import { Skeleton } from "@/components/ui/skeleton";

const CHART_CONFIG = {
  spend: { label: "Monthly spend", color: "var(--primary)" },
  trend: {
    label: "3-month average",
    color: "color-mix(in srgb, var(--primary) 60%, transparent)",
  },
};

const ROLLING_WINDOW = 3;
const PESO = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

function formatMonthLabel(monthKey) {
  const [year, month] = String(monthKey).split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  if (Number.isNaN(date.getTime())) return monthKey;
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

// Attach a trailing rolling mean so the chart carries the template's two-line
// treatment without inventing a second data source.
function withRollingAverage(months) {
  return months.map((entry, index) => {
    const window = months.slice(Math.max(0, index - ROLLING_WINDOW + 1), index + 1);
    const mean = window.reduce((sum, item) => sum + item.totalPhp, 0) / window.length;
    return {
      month: formatMonthLabel(entry.month),
      spend: Math.round(entry.totalPhp),
      trend: Math.round(mean),
    };
  });
}

export default function SpendOverview({ analytics, loading, monthCount }) {
  const months = useMemo(() => {
    const source = Array.isArray(analytics?.monthly) ? analytics.monthly : [];
    return withRollingAverage(source.slice(-monthCount));
  }, [analytics, monthCount]);

  const totalSpend = analytics?.totals?.totalExpensesPhp ?? 0;
  const latest = months[months.length - 1];
  const previous = months[months.length - 2];
  const deltaPct =
    latest && previous && previous.spend
      ? Math.round(((latest.spend - previous.spend) / previous.spend) * 100)
      : null;

  return (
    <DashboardCard className="flex flex-col gap-0!">
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp size={16} className="text-muted-foreground" />
          Spend Overview
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-6 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-base font-normal leading-6 text-foreground">Total tracked spend</span>
            <div className="flex flex-wrap items-center gap-2">
              {loading ? (
                <Skeleton className="h-8 w-40" />
              ) : (
                <span className="text-2xl font-semibold leading-8 tracking-[-0.3px] text-foreground">
                  {PESO.format(totalSpend)}
                </span>
              )}
              {deltaPct !== null && !loading ? (
                <>
                  <span
                    className={`text-sm font-medium ${deltaPct >= 0 ? "text-destructive" : "text-chart-2"}`}
                  >
                    {deltaPct >= 0 ? "+" : ""}
                    {deltaPct}%
                  </span>
                  <span className="text-sm font-normal text-muted-foreground">vs last month</span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {loading ? (
          <Skeleton className="h-[215px] w-full" />
        ) : months.length ? (
          <ChartContainer config={CHART_CONFIG} className="h-[215px]! w-full">
            <LineChart data={months} margin={{ top: 8, right: 4, bottom: 0, left: -10 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={4}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                tickFormatter={(value) => (value >= 1000 ? `${Math.round(value / 1000)}k` : value)}
              />
              <ChartTooltip
                cursor={{ stroke: "var(--border)", strokeWidth: 1, strokeDasharray: "4 4" }}
                content={<ChartTooltipContent />}
              />
              <Line
                dataKey="spend"
                type="linear"
                stroke="var(--primary)"
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 4, fill: "var(--primary)", strokeWidth: 0 }}
                animationDuration={700}
                animationEasing="ease-out"
              />
              <Line
                dataKey="trend"
                type="linear"
                stroke="color-mix(in srgb, var(--primary) 60%, transparent)"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                activeDot={{
                  r: 4,
                  fill: "color-mix(in srgb, var(--primary) 60%, transparent)",
                  strokeWidth: 0,
                }}
                animationBegin={120}
                animationDuration={700}
                animationEasing="ease-out"
              />
            </LineChart>
          </ChartContainer>
        ) : (
          <p className="flex h-[215px] items-center justify-center text-sm text-muted-foreground">
            No expense history available.
          </p>
        )}
      </CardContent>
    </DashboardCard>
  );
}

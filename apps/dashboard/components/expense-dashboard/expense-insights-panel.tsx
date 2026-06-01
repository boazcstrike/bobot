"use client";

import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartPie, CircleDollarSign } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  BreakdownItem,
  BreakdownList,
  ChartDatum,
  EmptyState,
  MetricGrid,
  MetricStat,
  SectionIntro,
  chartPalette,
  formatPeso,
} from "./shared";

type ExpenseInsightsPanelProps = {
  sourceLabel?: string;
  sourceHref?: string;
  sourceValue?: string;
  stats: MetricStat[];
  categoryItems: BreakdownItem[];
  brandItems: BreakdownItem[];
  categoryChartData?: ChartDatum[];
  brandChartData?: ChartDatum[];
};

export function ExpenseInsightsPanel({
  sourceLabel = "Source file",
  sourceHref,
  sourceValue,
  stats,
  categoryItems,
  brandItems,
  categoryChartData = [],
  brandChartData = [],
}: ExpenseInsightsPanelProps) {
  const hasCategoryChart = categoryChartData.length > 0;
  const hasBrandChart = brandChartData.length > 0;

  return (
    <section className="grid gap-4">
      <Card className="border border-border/80 bg-card/95 shadow-sm">
        <CardContent className="space-y-5 p-4 sm:p-5">
          <SectionIntro
            eyebrow="Analytics"
            title="Expense tracker analytics"
            description="Compact spend metrics and the highest-value category and merchant signals."
            action={
              sourceHref && sourceValue ? (
                <a
                  href={sourceHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <CircleDollarSign className="size-4" aria-hidden="true" />
                  <span>
                    {sourceLabel}: {sourceValue}
                  </span>
                </a>
              ) : undefined
            }
          />

          <MetricGrid stats={stats} />

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
            <Card className="border border-border/80 bg-card/95 shadow-sm">
              <CardHeader className="pb-1">
                <CardTitle>Spend by category</CardTitle>
                <CardDescription>Top organized categories by peso value.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {hasCategoryChart ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryChartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                        <XAxis
                          dataKey="label"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={10}
                          minTickGap={16}
                          fontSize={12}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          width={72}
                          fontSize={12}
                          tickFormatter={(value) => formatPeso(value)}
                        />
                        <Tooltip
                          cursor={{ fill: "color-mix(in srgb, var(--muted) 70%, transparent)" }}
                          formatter={(value) => [formatPeso(typeof value === "number" ? value : Number(value ?? 0)), "Spend"]}
                        />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="var(--chart-1)">
                          {categoryChartData.map((entry, index) => (
                            <Cell key={entry.label} fill={entry.fill ?? chartPalette[index % chartPalette.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState
                      title="No category chart data"
                      description="Pass summarized category totals to render the spend distribution."
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/80 bg-card/95 shadow-sm">
              <CardHeader className="pb-1">
                <CardTitle>Merchant mix</CardTitle>
                <CardDescription>Top brands or shops by recorded spend.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {hasBrandChart ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={brandChartData}
                          dataKey="value"
                          nameKey="label"
                          innerRadius={52}
                          outerRadius={86}
                          paddingAngle={2}
                        >
                          {brandChartData.map((entry, index) => (
                            <Cell key={entry.label} fill={entry.fill ?? chartPalette[index % chartPalette.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [formatPeso(typeof value === "number" ? value : Number(value ?? 0)), "Spend"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState
                      title="No merchant chart data"
                      description="Pass merchant totals when the parent has enough records for a chart."
                      icon={<ChartPie className="size-4" aria-hidden="true" />}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <BreakdownList
              title="Organized categories"
              description="Highest-value categories with optional transaction context."
              items={categoryItems}
              emptyTitle="No category rows yet"
              emptyDescription="Pass category breakdown rows to populate this ranked list."
            />
            <BreakdownList
              title="Top brands / shops"
              description="Merchant-level view for the current analytics payload."
              items={brandItems}
              emptyTitle="No merchant rows yet"
              emptyDescription="Pass brand or shop rows to populate this ranked list."
            />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

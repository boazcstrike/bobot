"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--muted-foreground)",
];

const TOP_CATEGORIES = 5;
const OTHER_KEY = "other";

function slugify(name) {
  return String(name).replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").toLowerCase() || "cat";
}

function shortDate(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function CurrentLoadChart({ data = [] }) {
  const ranked = useMemo(() => {
    const totals = new Map();
    data.forEach((row) => {
      totals.set(row.name, (totals.get(row.name) || 0) + Number(row.count || 0));
    });
    return Array.from(totals.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [data]);

  const top = useMemo(
    () => ranked.slice(0, TOP_CATEGORIES).map((c) => ({ name: c.name, slug: slugify(c.name) })),
    [ranked],
  );
  const otherNames = useMemo(() => ranked.slice(TOP_CATEGORIES).map((c) => c.name), [ranked]);

  const chartConfig = useMemo(() => {
    const config = {};
    top.forEach((category, index) => {
      config[category.slug] = { label: category.name, color: PALETTE[index % PALETTE.length] };
    });
    if (otherNames.length) config[OTHER_KEY] = { label: "Other", color: PALETTE[5] };
    return config;
  }, [top, otherNames]);

  const rows = useMemo(() => {
    const byDay = new Map();
    data.forEach((row) => {
      const day = String(row.day).slice(0, 10);
      if (!byDay.has(day)) byDay.set(day, { date: day });
      const bucket = byDay.get(day);
      const topCategory = top.find((category) => category.name === row.name);
      if (topCategory) {
        bucket[topCategory.slug] = (bucket[topCategory.slug] || 0) + Number(row.count || 0);
      } else if (otherNames.includes(row.name)) {
        bucket[OTHER_KEY] = (bucket[OTHER_KEY] || 0) + Number(row.count || 0);
      }
    });
    return Array.from(byDay.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [data, top, otherNames]);

  if (!rows.length || !top.length) {
    return <p className="muted">No current category history yet.</p>;
  }

  const keys = [...top.map((c) => c.slug), ...(otherNames.length ? [OTHER_KEY] : [])];

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-[260px] w-full">
      <BarChart accessibilityLayer data={rows} margin={{ left: 4, right: 8, top: 8, bottom: 4 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={20}
          tickFormatter={shortDate}
        />
        <YAxis tickLine={false} axisLine={false} width={32} />
        <ChartTooltip
          content={<ChartTooltipContent labelFormatter={(value) => shortDate(value)} />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        {keys.map((key, index) => (
          <Bar
            key={key}
            dataKey={key}
            stackId="current"
            fill={`var(--color-${key})`}
            radius={index === keys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
          />
        ))}
      </BarChart>
    </ChartContainer>
  );
}

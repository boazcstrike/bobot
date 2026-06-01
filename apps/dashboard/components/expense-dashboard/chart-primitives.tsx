"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, chartPalette, formatPeso } from "./shared";

export type ChartCardProps = {
  title: string;
  description: string;
  children: ReactNode;
  empty?: boolean;
};

export function ChartCard({ title, description, children, empty }: ChartCardProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Card className="border border-border/80 bg-card/95 shadow-sm">
      <CardHeader className="pb-1">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72 min-w-0">
          {empty || !mounted ? (
            <EmptyState title="No chart data" description="Adjust filters or fix invalid source rows." />
          ) : (
            children
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function MoneyTooltip() {
  return (
    <Tooltip
      cursor={{ fill: "color-mix(in srgb, var(--muted) 70%, transparent)" }}
      formatter={(value) => [formatPeso(Number(value ?? 0)), "Spend"]}
    />
  );
}

export function SimpleLineChart({
  data,
  xKey,
  yKey,
}: {
  data: Record<string, string | number>[];
  xKey: string;
  yKey: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={250} initialDimension={{ width: 320, height: 250 }}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey={xKey} tickLine={false} axisLine={false} minTickGap={20} fontSize={12} />
        <YAxis tickLine={false} axisLine={false} width={78} fontSize={12} tickFormatter={(value) => formatPeso(value)} />
        <MoneyTooltip />
        <Line type="monotone" dataKey={yKey} stroke="var(--chart-1)" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SimpleBarChart({
  data,
  xKey,
  yKey,
}: {
  data: Record<string, string | number>[];
  xKey: string;
  yKey: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={250} initialDimension={{ width: 320, height: 250 }}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey={xKey} tickLine={false} axisLine={false} minTickGap={18} fontSize={12} />
        <YAxis tickLine={false} axisLine={false} width={78} fontSize={12} tickFormatter={(value) => formatPeso(value)} />
        <MoneyTooltip />
        <Bar dataKey={yKey} radius={[8, 8, 0, 0]} fill="var(--chart-1)" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function HorizontalBarChart({
  data,
  xKey,
  yKey,
}: {
  data: Record<string, string | number>[];
  xKey: string;
  yKey: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={250} initialDimension={{ width: 320, height: 250 }}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 20, left: 12, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} tickFormatter={(value) => formatPeso(value)} />
        <YAxis dataKey={yKey} type="category" tickLine={false} axisLine={false} width={115} fontSize={12} />
        <MoneyTooltip />
        <Bar dataKey={xKey} radius={[0, 8, 8, 0]}>
          {data.map((entry, index) => (
            <Cell key={String(entry[yKey])} fill={chartPalette[index % chartPalette.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({ data }: { data: Array<{ name: string; value: number }> }) {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={250} initialDimension={{ width: 320, height: 250 }}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={94} paddingAngle={2}>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={chartPalette[index % chartPalette.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [formatPeso(Number(value ?? 0)), "Spend"]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function StackedBarChart({
  data,
  xKey,
  keys,
}: {
  data: Record<string, string | number>[];
  xKey: string;
  keys: string[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={250} initialDimension={{ width: 320, height: 250 }}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey={xKey} tickLine={false} axisLine={false} minTickGap={18} fontSize={12} />
        <YAxis tickLine={false} axisLine={false} width={78} fontSize={12} tickFormatter={(value) => formatPeso(value)} />
        <MoneyTooltip />
        <Legend />
        {keys.map((key, index) => (
          <Bar key={key} dataKey={key} stackId="total" fill={chartPalette[index % chartPalette.length]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ChangeChart({ data }: { data: Array<{ key: string; absoluteChange: number | null }> }) {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={250} initialDimension={{ width: 320, height: 250 }}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="key" tickLine={false} axisLine={false} minTickGap={18} fontSize={12} />
        <YAxis tickLine={false} axisLine={false} width={78} fontSize={12} tickFormatter={(value) => formatPeso(value)} />
        <Tooltip formatter={(value) => [formatPeso(Number(value ?? 0)), "Change"]} />
        <Bar dataKey="absoluteChange" radius={[8, 8, 0, 0]} fill="var(--chart-3)" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ForecastBandChart({
  data,
}: {
  data: Array<{ year: number; low: number; base: number; high: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={250} initialDimension={{ width: 320, height: 250 }}>
      <ComposedChart data={data} margin={{ top: 8, right: 12, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="year" tickLine={false} axisLine={false} fontSize={12} />
        <YAxis tickLine={false} axisLine={false} width={78} fontSize={12} tickFormatter={(value) => formatPeso(value)} />
        <MoneyTooltip />
        <Area dataKey="high" fill="var(--chart-2)" stroke="var(--chart-2)" fillOpacity={0.12} />
        <Area dataKey="low" fill="var(--background)" stroke="var(--chart-4)" fillOpacity={0.85} />
        <Line dataKey="base" stroke="var(--chart-1)" strokeWidth={2} dot />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

"use client";

import type { ChangeEvent } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  CalendarRange,
  Clock3,
  LoaderCircle,
  MonitorPlay,
  Save,
  Table2,
  Zap,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import {
  ChartDatum,
  EmptyState,
  MetricGrid,
  MetricStat,
  SectionIntro,
  chartPalette,
  formatCompactNumber,
  formatDateTimeLabel,
} from "./shared";

export type SyncMethodOption = {
  value: string;
  label: string;
  summary: string;
  requirement: string;
  icon?: "api" | "playwright";
};

export type StatementRecord = {
  id: string;
  emailDate?: string | null;
  filename?: string | null;
  status?: string | null;
  sizeLabel?: string | null;
  savedPath?: string | null;
};

type StatementOperationsPanelProps = {
  stats: MetricStat[];
  syncMethods: SyncMethodOption[];
  selectedMethod: string;
  onMethodChange: (value: string) => void;
  periodStart: string;
  periodEnd: string;
  onPeriodStartChange: (value: string) => void;
  onPeriodEndChange: (value: string) => void;
  onSyncPeriod: () => void;
  onSyncNewest: () => void;
  isLoading?: boolean;
  isSyncing?: boolean;
  archiveRange?: {
    oldestLabel?: string;
    latestLabel?: string;
  };
  lastSyncLabel?: string;
  syncSummaryLabel?: string;
  error?: string;
  statements: StatementRecord[];
  statusChartData?: ChartDatum[];
  volumeChartData?: ChartDatum[];
};

function methodIcon(icon?: SyncMethodOption["icon"]) {
  if (icon === "playwright") return <MonitorPlay className="size-4" aria-hidden="true" />;
  return <Zap className="size-4" aria-hidden="true" />;
}

function statusTone(status?: string | null) {
  const normalized = (status || "pending").toLowerCase();
  if (normalized === "processed" || normalized === "complete" || normalized === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  if (normalized === "failed" || normalized === "error") {
    return "border-red-200 bg-red-50 text-red-800";
  }
  return "border-amber-200 bg-amber-50 text-amber-800";
}

export function StatementOperationsPanel({
  stats,
  syncMethods,
  selectedMethod,
  onMethodChange,
  periodStart,
  periodEnd,
  onPeriodStartChange,
  onPeriodEndChange,
  onSyncPeriod,
  onSyncNewest,
  isLoading = false,
  isSyncing = false,
  archiveRange,
  lastSyncLabel,
  syncSummaryLabel,
  error,
  statements,
  statusChartData = [],
  volumeChartData = [],
}: StatementOperationsPanelProps) {
  const activeMethod = syncMethods.find((method) => method.value === selectedMethod) ?? syncMethods[0];

  return (
    <section className="grid gap-4">
      <MetricGrid stats={stats} />

      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <Card className="border border-border/80 bg-card/95 shadow-sm">
          <CardContent className="space-y-5 p-4 sm:p-5">
            <SectionIntro
              eyebrow="Intake"
              title="Gmail sync"
              description="Choose the retrieval path, set the archive period, then trigger the sync from the parent."
            />

            <div className="grid gap-2 sm:grid-cols-2">
              {syncMethods.map((method) => {
                const active = method.value === selectedMethod;
                return (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => onMethodChange(method.value)}
                    disabled={isLoading || isSyncing}
                    className={[
                      "flex min-h-24 flex-col items-start gap-2 rounded-xl border px-4 py-3 text-left transition-colors",
                      active
                        ? "border-primary bg-primary/8 text-foreground shadow-sm"
                        : "border-border/80 bg-background/70 text-foreground hover:bg-muted/60",
                    ].join(" ")}
                  >
                    <span className="inline-flex items-center gap-2 text-sm font-medium">
                      {methodIcon(method.icon)}
                      {method.label}
                    </span>
                    <span className="text-sm leading-6 text-muted-foreground">{method.summary}</span>
                  </button>
                );
              })}
            </div>

            {activeMethod ? (
              <div className="rounded-xl border border-border/80 bg-muted/35 p-4">
                <p className="text-sm font-medium text-foreground">{activeMethod.label}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{activeMethod.requirement}</p>
              </div>
            ) : null}

            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-foreground">
                <span className="font-medium">From timestamp</span>
                <Input
                  type="datetime-local"
                  value={periodStart}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => onPeriodStartChange(event.target.value)}
                />
              </label>
              <label className="grid gap-2 text-sm text-foreground">
                <span className="font-medium">To timestamp</span>
                <Input
                  type="datetime-local"
                  value={periodEnd}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => onPeriodEndChange(event.target.value)}
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="gap-1 border-border/80 bg-background/80">
                <CalendarRange className="size-3" aria-hidden="true" />
                Oldest: {archiveRange?.oldestLabel || "N/A"}
              </Badge>
              <Badge variant="outline" className="gap-1 border-border/80 bg-background/80">
                <Clock3 className="size-3" aria-hidden="true" />
                Latest: {archiveRange?.latestLabel || "N/A"}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={onSyncPeriod} disabled={isLoading || isSyncing}>
                {isSyncing ? "Syncing..." : "Sync selected period"}
              </Button>
              <Button variant="outline" onClick={onSyncNewest} disabled={isLoading || isSyncing}>
                Sync newest since latest
              </Button>
              {isSyncing ? <LoaderCircle className="size-4 animate-spin text-muted-foreground" aria-hidden="true" /> : null}
            </div>

            <div className="space-y-1 text-sm text-muted-foreground">
              <p>Last sync: {lastSyncLabel || "No sync completed yet"}</p>
              {syncSummaryLabel ? <p>{syncSummaryLabel}</p> : null}
              {error ? <p className="text-red-700">{error}</p> : null}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="border border-border/80 bg-card/95 shadow-sm">
            <CardHeader className="pb-1">
              <CardTitle>Status mix</CardTitle>
              <CardDescription>Statement counts grouped by current processing state.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                {statusChartData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusChartData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                      <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                      <YAxis tickLine={false} axisLine={false} width={40} fontSize={12} />
                      <Tooltip formatter={(value) => [formatCompactNumber(typeof value === "number" ? value : Number(value ?? 0)), "Statements"]} />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {statusChartData.map((entry, index) => (
                          <Cell key={entry.label} fill={entry.fill ?? chartPalette[index % chartPalette.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState
                    title="No status chart data"
                    description="Pass grouped status counts to render the processing mix."
                  />
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/80 bg-card/95 shadow-sm">
            <CardHeader className="pb-1">
              <CardTitle>Download volume</CardTitle>
              <CardDescription>Compact timeline for recent statement intake.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                {volumeChartData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={volumeChartData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                      <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                      <YAxis tickLine={false} axisLine={false} width={40} fontSize={12} />
                      <Tooltip formatter={(value) => [formatCompactNumber(typeof value === "number" ? value : Number(value ?? 0)), "Downloaded"]} />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="var(--chart-2)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState
                    title="No volume trend data"
                    description="Pass a recent download series when the parent has timeline analytics."
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border border-border/80 bg-card/95 shadow-sm">
        <CardHeader className="pb-1">
          <CardTitle className="inline-flex items-center gap-2">
            <Table2 className="size-4" aria-hidden="true" />
            Statements
          </CardTitle>
          <CardDescription>Archive rows passed from the parent without local data fetching.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <EmptyState
              title="Loading statements"
              description="Keep the parent loading state true until rows are ready."
              icon={<LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
            />
          ) : statements.length ? (
            <ScrollArea className="h-[26rem] rounded-xl border border-border/70">
              <div className="min-w-[760px]">
                <div className="grid grid-cols-[140px_minmax(220px,1.5fr)_140px_90px_minmax(220px,1.4fr)] gap-3 border-b border-border/70 bg-muted/50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  <span>Email date</span>
                  <span>Filename</span>
                  <span>Status</span>
                  <span>Size</span>
                  <span>Saved path</span>
                </div>
                {statements.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[140px_minmax(220px,1.5fr)_140px_90px_minmax(220px,1.4fr)] gap-3 border-b border-border/60 px-4 py-3 text-sm last:border-b-0"
                  >
                    <span className="text-muted-foreground">{formatDateTimeLabel(item.emailDate)}</span>
                    <span className="truncate font-medium text-foreground">{item.filename || "-"}</span>
                    <span>
                      <Badge variant="outline" className={statusTone(item.status)}>
                        {item.status || "pending"}
                      </Badge>
                    </span>
                    <span className="text-muted-foreground">{item.sizeLabel || "-"}</span>
                    <span className="inline-flex items-center gap-1.5 truncate text-muted-foreground">
                      <Save className="size-3.5 shrink-0" aria-hidden="true" />
                      {item.savedPath || "-"}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <EmptyState
              title="No statements downloaded yet"
              description="Pass an empty array until the first sync creates archived rows."
            />
          )}
        </CardContent>
      </Card>
    </section>
  );
}

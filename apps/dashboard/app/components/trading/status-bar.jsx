"use client";

import { Activity, CircleAlert, CirclePause, Play, Square, Wifi, WifiOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { DashboardCard } from "@/components/shared/dashboard-card";
import { Skeleton } from "@/components/ui/skeleton";

import { money, percent, relativeTime } from "./format";

// Liveness is read off heartbeat staleness, not the worker self-reported state
// field, because a killed process never writes "stopped". Each state gets its
// own icon as well as its own color, so the badge is readable without color.
const LIVENESS_PRESENTATION = {
  running: { icon: Activity, className: "bg-chart-2/10! text-chart-2!", hint: "Ticking on schedule" },
  idle: { icon: CirclePause, className: "bg-muted! text-muted-foreground!", hint: "Worker up, bot stopped" },
  error: { icon: CircleAlert, className: "bg-destructive/10! text-destructive!", hint: "Last tick failed" },
  offline: { icon: WifiOff, className: "bg-destructive/10! text-destructive!", hint: "No heartbeat" },
  "never-run": { icon: Wifi, className: "bg-muted! text-muted-foreground!", hint: "Never started" },
};

function Figure({ label, value, tone = "" }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`font-mono text-sm tabular-nums ${tone}`}>{value}</span>
    </div>
  );
}

export default function StatusBar({ status, ticker, busy, onToggle, loading }) {
  if (loading || !status) {
    return (
      <DashboardCard className="py-4">
        <CardContent className="px-6">
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </DashboardCard>
    );
  }

  const { config, liveness, heartbeat } = status;
  const presentation = LIVENESS_PRESENTATION[liveness.state] ?? LIVENESS_PRESENTATION["never-run"];
  const StateIcon = presentation.icon;
  const isLive = config.mode === "live";
  const price = ticker?.lastPrice ?? heartbeat?.lastPrice ?? null;

  return (
    <DashboardCard className="py-4">
      <CardContent className="flex flex-col gap-4 px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-2">
            <Badge className={`gap-1.5 ${presentation.className}`}>
              <StateIcon size={13} />
              {liveness.label}
            </Badge>
            <span className="text-xs text-muted-foreground">{presentation.hint}</span>
          </div>

          <Badge
            variant={isLive ? "destructive" : "outline"}
            className={isLive ? undefined : "text-muted-foreground"}
          >
            {isLive ? "LIVE FUNDS" : config.mode.toUpperCase()}
          </Badge>

          <Figure label="Symbol" value={config.symbol} />
          <Figure label="Last price" value={price === null ? "—" : money(price)} />
          {ticker ? (
            <Figure
              label="24h"
              value={percent(ticker.priceChangePercent)}
              tone={ticker.priceChangePercent >= 0 ? "text-chart-2" : "text-destructive"}
            />
          ) : null}
          <Figure label="Last tick" value={relativeTime(heartbeat?.lastTickAt)} />
        </div>

        <Button
          onClick={onToggle}
          disabled={busy}
          variant={config.enabled ? "destructive" : "default"}
          className="w-full cursor-pointer gap-2 transition-colors duration-200 lg:w-auto"
        >
          {config.enabled ? <Square size={15} /> : <Play size={15} />}
          {config.enabled ? "Stop bot" : "Start bot"}
        </Button>
      </CardContent>

      {heartbeat?.lastSignal ? (
        <CardContent className="border-t border-border px-6 pt-3">
          <p className="font-mono text-xs text-muted-foreground">
            <span className="text-foreground">signal</span> {heartbeat.lastSignal}
          </p>
        </CardContent>
      ) : null}

      {heartbeat?.lastError ? (
        <CardContent className="border-t border-border px-6 pt-3">
          <p className="font-mono text-xs text-destructive">{heartbeat.lastError}</p>
        </CardContent>
      ) : null}
    </DashboardCard>
  );
}

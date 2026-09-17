"use client";

import { ScrollText } from "lucide-react";

import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardCard } from "@/components/shared/dashboard-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

import { clockTime } from "./format";

const LEVEL_TONE = {
  info: "text-muted-foreground",
  warn: "text-chart-4",
  error: "text-destructive",
};

export default function EventLog({ events, loading }) {
  return (
    <DashboardCard className="py-6">
      <CardHeader className="px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base">Worker log</CardTitle>
            <p className="text-xs text-muted-foreground">
              What the worker did, newest first. Kept to the last 2000 lines.
            </p>
          </div>
          <div className="w-fit rounded-md border border-border p-2">
            <ScrollText size={15} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-6">
        {loading ? (
          <Skeleton className="h-[240px] w-full" />
        ) : events.length === 0 ? (
          <div className="flex h-[240px] flex-col items-center justify-center gap-1 text-center">
            <p className="text-sm text-muted-foreground">The worker has never run.</p>
            <p className="font-mono text-xs text-muted-foreground">npm run dashboard:bot</p>
          </div>
        ) : (
          <ScrollArea className="h-[240px]">
            <ul className="flex flex-col gap-1.5 pr-3">
              {events.map((event) => (
                <li key={event.id} className="flex gap-2 font-mono text-xs leading-relaxed">
                  <span className="shrink-0 text-muted-foreground tabular-nums">
                    {clockTime(event.ts)}
                  </span>
                  <span className={`w-20 shrink-0 pr-2 ${LEVEL_TONE[event.level] ?? ""}`}>
                    {event.kind}
                  </span>
                  <span className={LEVEL_TONE[event.level] === "text-muted-foreground" ? "text-foreground" : LEVEL_TONE[event.level]}>
                    {event.message}
                  </span>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </DashboardCard>
  );
}

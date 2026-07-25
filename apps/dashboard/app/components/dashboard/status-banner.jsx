"use client";

import { useState } from "react";
import { Database } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { DashboardCard } from "@/components/shared/dashboard-card";

const IDLE = { status: "idle", message: "MongoDB connection has not been checked yet." };

export default function StatusBanner() {
  const [check, setCheck] = useState(IDLE);

  async function runMongoCheck() {
    setCheck({ status: "checking", message: "Checking MongoDB connection..." });
    try {
      const response = await fetch("/api/mongodb/check", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setCheck({ status: "failed", message: data.error || "Connection failed." });
        return;
      }
      setCheck({
        status: "connected",
        message: `Connected to ${data.dbName} @ ${data.uriHost}`,
      });
    } catch (error) {
      setCheck({
        status: "failed",
        message: error instanceof Error ? error.message : "Connection failed.",
      });
    }
  }

  const dotClass =
    check.status === "connected"
      ? "bg-chart-2"
      : check.status === "failed"
        ? "bg-destructive"
        : "bg-chart-1";

  return (
    <DashboardCard className="py-3">
      <CardContent className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`absolute inline-flex h-2 w-2 animate-ping rounded-full ${dotClass}`} />
              <span className={`inline-flex h-2 w-2 rounded-full ${dotClass}`} />
            </span>
            <p className="ps-2 text-sm font-medium">System</p>
            <span className="h-1 w-1 rounded-full bg-border" />
            <p className="text-sm font-normal text-muted-foreground">
              {new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <p className="text-sm font-normal">{check.message}</p>
        </div>

        <Button
          variant="outline"
          className="flex h-auto cursor-pointer gap-1.5 rounded-md px-4 py-2"
          onClick={runMongoCheck}
          disabled={check.status === "checking"}
        >
          <Database width={18} height={18} />
          {check.status === "checking" ? "Checking..." : "Check connection"}
        </Button>
      </CardContent>
    </DashboardCard>
  );
}

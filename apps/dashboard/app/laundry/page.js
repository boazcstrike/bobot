"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { CalendarClock, ChartColumn, Shirt, Sparkles, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CategoryAverageChart = dynamic(
  () => import("../components/laundry/category-average-chart"),
  { ssr: false, loading: () => <div style={{ minHeight: 220 }} aria-hidden /> },
);
const CurrentLoadChart = dynamic(
  () => import("../components/laundry/current-load-chart"),
  { ssr: false, loading: () => <div style={{ minHeight: 260 }} aria-hidden /> },
);
const LaundryForecast = dynamic(
  () => import("../components/laundry/laundry-forecast"),
  { ssr: false, loading: () => <div style={{ minHeight: 220 }} aria-hidden /> },
);

function describeNextLaundry(isoDate, daysUntil) {
  if (!isoDate) {
    return { hasDate: false, urgency: "idle", dateLabel: "Not enough data yet", countdown: "Log a few loads to forecast" };
  }
  const [year, month, day] = isoDate.split("-").map(Number);
  const dateLabel = new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  let countdown = "";
  let urgency = "normal";
  if (typeof daysUntil === "number") {
    if (daysUntil < 0) {
      urgency = "overdue";
      countdown = `Overdue by ${Math.abs(daysUntil)} day${Math.abs(daysUntil) === 1 ? "" : "s"}`;
    } else if (daysUntil === 0) {
      urgency = "soon";
      countdown = "Today";
    } else if (daysUntil === 1) {
      urgency = "soon";
      countdown = "Tomorrow";
    } else if (daysUntil <= 2) {
      urgency = "soon";
      countdown = `In ${daysUntil} days`;
    } else {
      countdown = `In ${daysUntil} days`;
    }
  }

  return { hasDate: true, urgency, dateLabel, countdown };
}

export default function LaundryPage() {
  const [laundryServer, setLaundryServer] = useState(null);
  const [laundryAnalytics, setLaundryAnalytics] = useState(null);
  const [repoPathInput, setRepoPathInput] = useState("");
  const [configError, setConfigError] = useState("");
  const [serverBusy, setServerBusy] = useState(false);

  const loadData = useCallback(async function loadData() {
    const [r1, r2, r3] = await Promise.allSettled([
      fetch("/api/laundry/server", { cache: "no-store" }),
      fetch("/api/laundry/analytics", { cache: "no-store" }),
      fetch("/api/laundry/config", { cache: "no-store" }),
    ]);
    if (r1.status === "fulfilled" && r1.value.ok) setLaundryServer(await r1.value.json());
    if (r2.status === "fulfilled" && r2.value.ok) setLaundryAnalytics(await r2.value.json());
    if (r3.status === "fulfilled" && r3.value.ok) {
      const config = await r3.value.json();
      setRepoPathInput(config.repoPath || "");
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timeout);
  }, [loadData]);

  useEffect(() => {
    let interval = null;

    const pollServer = () => {
      if (document.hidden) return;
      fetch("/api/laundry/server", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => data && setLaundryServer(data))
        .catch(() => null);
    };

    const startPolling = () => {
      if (interval) return;
      interval = setInterval(pollServer, 5000);
    };

    const stopPolling = () => {
      if (!interval) return;
      clearInterval(interval);
      interval = null;
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        pollServer();
        startPolling();
      }
    };

    startPolling();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  async function saveRepoPath(e) {
    e.preventDefault();
    setConfigError("");
    const res = await fetch("/api/laundry/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repoPath: repoPathInput }),
    });
    if (!res.ok) {
      setConfigError(await res.text());
      return;
    }
    await loadData();
  }

  async function controlLaundryServer(action) {
    setServerBusy(true);
    try {
      const res = await fetch("/api/laundry/server", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setLaundryServer(await res.json());
      }
    } finally {
      setServerBusy(false);
    }
  }

  const status = laundryServer?.status || "stopped";
  const totalSubmissions = laundryAnalytics?.totalSubmissions ?? 0;
  const successfulSubmissions = laundryAnalytics?.successfulSubmissions ?? 0;
  const successRate = totalSubmissions
    ? Math.round((successfulSubmissions / totalSubmissions) * 100)
    : 0;
  const items = laundryAnalytics?.items || [];
  const categoryAverages = laundryAnalytics?.categoryAverages || [];
  const categoryTimeline = laundryAnalytics?.categoryTimeline || [];
  const forecast = laundryAnalytics?.forecast || null;
  const intervalHistory = laundryAnalytics?.intervalHistory || [];
  const topForecastCategories = useMemo(() => {
    const nextLoad = forecast?.loadForecast?.points?.[0]?.byCategory;
    if (!nextLoad) return [];
    return Object.entries(nextLoad)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [forecast?.loadForecast?.points]);
  const nextLaundry = useMemo(
    () => describeNextLaundry(forecast?.nextLaundryDate, forecast?.daysUntilNext),
    [forecast?.nextLaundryDate, forecast?.daysUntilNext],
  );
  const daily = useMemo(() => laundryAnalytics?.daily || [], [laundryAnalytics?.daily]);
  const dailyMax = useMemo(
    () => Math.max(...daily.map((d) => Number(d.count)), 1),
    [daily],
  );

  return (
    <>
      <div className="laundry-overview-grid fade-up">
        <header className="hero card dashboard-card dashboard-card-hero fade-up">
          <p className="dashboard-kicker">Laundry Operations</p>
          <h1><Shirt size={20} className="icon-inline" /> Laundry Control Deck</h1>
        </header>

        <section className="card dashboard-card dashboard-card-analytics laundry-summary-card" aria-labelledby="laundry-summary-heading">
            <header className="dashboard-card-header">
              <h2 id="laundry-summary-heading"><ChartColumn size={18} className="icon-inline" /> Laundry Summary</h2>
            </header>
            <div className="dashboard-card-body">
              <div
                className={`forecast-highlight forecast-highlight-${nextLaundry.urgency}`}
                role="status"
                aria-label={`Next forecasted laundry ${nextLaundry.dateLabel}${nextLaundry.countdown ? `, ${nextLaundry.countdown}` : ""}`}
              >
                <span className="forecast-highlight-sheen" aria-hidden />
                <span className="forecast-highlight-icon" aria-hidden>
                  <CalendarClock size={22} />
                </span>
                <span className="forecast-highlight-text">
                  <span className="forecast-highlight-label">
                    Next forecasted laundry
                    {nextLaundry.hasDate ? <Sparkles size={13} className="forecast-highlight-spark" aria-hidden /> : null}
                  </span>
                  <strong className="forecast-highlight-date">{nextLaundry.dateLabel}</strong>
                  {nextLaundry.countdown ? (
                    <span className="forecast-highlight-countdown">{nextLaundry.countdown}</span>
                  ) : null}
                </span>
              </div>
              <div className="success-meter" role="img" aria-label={`Success rate ${successRate} percent`}>
                <div className="success-meter-head">
                  <span className="meta-label">Success rate</span>
                  <strong>{successRate}%</strong>
                </div>
                <div className="success-meter-track">
                  <div className="success-meter-fill" style={{ width: `${successRate}%` }} />
                </div>
              </div>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="text-muted-foreground">Total submissions</TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {laundryAnalytics?.totalSubmissions ?? "-"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-muted-foreground">Average items</TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {laundryAnalytics?.averageItemsPerSubmission ?? "-"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-muted-foreground">Next load by category</TableCell>
                    <TableCell className="whitespace-normal text-right font-mono font-medium">
                      {topForecastCategories.length ? (
                        <ul className="flex flex-col gap-1">
                          {topForecastCategories.map((category) => (
                            <li key={category.name}>
                              {category.name}: {category.total}
                            </li>
                          ))}
                        </ul>
                      ) : "-"}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
        </section>
      </div>

        <Tabs defaultValue="current" className="laundry-tabs fade-up delay-2">
          <TabsList className="laundry-tabs-list">
            <TabsTrigger value="current">
              <ChartColumn data-icon="inline-start" /> Current
            </TabsTrigger>
            <TabsTrigger value="forecasting">
              <CalendarClock data-icon="inline-start" /> Forecasting
            </TabsTrigger>
          </TabsList>
          <TabsContent value="forecasting">
            <section className="card dashboard-card dashboard-card-forecast" aria-labelledby="laundry-forecast-heading">
              <header className="dashboard-card-header">
                <h2 id="laundry-forecast-heading"><CalendarClock size={18} className="icon-inline" /> Laundry Forecast</h2>
              </header>
              <LaundryForecast forecast={forecast} intervalHistory={intervalHistory} />
            </section>
          </TabsContent>
          <TabsContent value="current">
            <div className="dashboard-grid laundry-current-grid">
              <section className="card dashboard-card dashboard-card-runtime laundry-runtime-card" aria-labelledby="laundry-runtime-heading">
                <header className="dashboard-card-header">
                  <h2 id="laundry-runtime-heading"><Wrench size={18} className="icon-inline" /> Laundry Runtime</h2>
                </header>
                <div className="dashboard-card-body">
                  <div className="status-row">
                    <span className={`status-dot status-${status}`} />
                    <strong className="status-label">{status}</strong>
                    {laundryServer?.pid ? <span className="status-meta">PID {laundryServer.pid}</span> : null}
                  </div>
                  <form className="path-form" onSubmit={saveRepoPath}>
                    <label htmlFor="repoPath">Repository path</label>
                    <div className="input-row">
                      <Input id="repoPath" value={repoPathInput} onChange={(e) => setRepoPathInput(e.target.value)} placeholder="C:\\Users\\boazs\\webdev\\laundry-silayan" required />
                      <Button type="submit" variant="ghost" className="ghost-btn interactive focus-ring">Save path</Button>
                    </div>
                    {configError ? <p className="error">{configError}</p> : null}
                  </form>
                  <div className="button-row dashboard-actions" role="group" aria-label="Laundry runtime controls">
                    <Button type="button" className="primary-btn interactive focus-ring" onClick={() => controlLaundryServer("start")} disabled={serverBusy || status === "running" || status === "starting"}>Play</Button>
                    <Button type="button" variant="destructive" className="danger-btn interactive focus-ring" onClick={() => controlLaundryServer("stop")} disabled={serverBusy || status === "stopped"}>Stop</Button>
                  </div>
                  {laundryServer?.lastError ? <p className="error">Last error snapshot: {laundryServer.lastError}</p> : null}
                  <details className="logs dashboard-logs">
                    <summary>Runtime logs</summary>
                    <pre>{(laundryServer?.logs || []).map((l) => `[${new Date(l.at).toLocaleTimeString()}] ${l.source}: ${l.text}`).join("\n") || "No logs yet."}</pre>
                  </details>
                </div>
              </section>

              <section className="card dashboard-card dashboard-card-analytics" aria-labelledby="laundry-current-heading">
                <header className="dashboard-card-header">
                  <h2 id="laundry-current-heading"><ChartColumn size={18} className="icon-inline" /> Current Laundry Data</h2>
                </header>
                <div className="dashboard-card-body">
                  <div className="forecast-chart-block">
                    <div className="forecast-section-head">
                      <h3>Current load by category</h3>
                      <span className="muted">actual item counts over time</span>
                    </div>
                    <CurrentLoadChart data={categoryTimeline} />
                  </div>
                  <div className="dual-col">
                    <div className="list-block">
                      <h3>Avg Per Category</h3>
                      <CategoryAverageChart data={categoryAverages} />
                      {!categoryAverages.length && items.length ? (
                        <ul className="compact-list">
                          {items.map((item) => (
                            <li key={item.name}>
                              <span>{item.name}</span>
                              <strong>{item.totalCount}</strong>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                    <div className="list-block">
                      <h3>Last 7 Days</h3>
                      <div className="bars">
                        {daily.map((d) => {
                          const height = Math.max(8, Math.round((Number(d.count) / dailyMax) * 100));
                          return (
                            <div key={d.day} className="bar-wrap">
                              <div className="bar" style={{ height: `${height}px` }} />
                              <span>{String(d.day).slice(5)}</span>
                              <strong>{d.count}</strong>
                            </div>
                          );
                        })}
                        {!daily.length ? <p className="muted">No daily data yet.</p> : null}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </TabsContent>
        </Tabs>
    </>
  );
}

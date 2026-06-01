"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TREND_WINDOWS = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
];

function formatTrendingOutputLog(outputLog) {
  if (!outputLog) {
    return "No output log yet.";
  }

  const lines = [
    `status: ${outputLog.status || "unknown"}`,
    `fetched: ${Boolean(outputLog.fetched)}`,
    `saved: ${Boolean(outputLog.saved)}`,
    `storageFolder: ${outputLog.storageFolder || "unknown"}`,
    "calledTextFiles:",
  ];

  const files = Array.isArray(outputLog.calledTextFiles) ? outputLog.calledTextFiles : [];
  if (files.length) {
    files.forEach((filePath) => lines.push(`- ${filePath}`));
  } else {
    lines.push("- none");
  }

  return lines.join("\n");
}

export default function Page() {
  const [trendingSnapshot, setTrendingSnapshot] = useState({
    daily: [],
    weekly: [],
    monthly: [],
    source: null,
    snapshotDate: null,
    generatedAt: null,
    stale: false,
    outputLog: null,
  });
  const [activeTrendWindow, setActiveTrendWindow] = useState("weekly");
  const [laundryServer, setLaundryServer] = useState(null);
  const [mongoCheck, setMongoCheck] = useState({ status: "idle", message: "Not checked yet." });
  const [repoPathInput, setRepoPathInput] = useState("");
  const [configError, setConfigError] = useState("");
  const [serverBusy, setServerBusy] = useState(false);

  async function loadData() {
    const [r1, r2, r4] = await Promise.all([
      fetch("/api/trending", { cache: "no-store" }),
      fetch("/api/laundry/server", { cache: "no-store" }),
      fetch("/api/laundry/config", { cache: "no-store" }),
    ]);
    const trendingPayload = await r1.json().catch(() => null);
    if (r1.ok && trendingPayload) {
      if (Array.isArray(trendingPayload)) {
        setTrendingSnapshot({
          daily: trendingPayload,
          weekly: trendingPayload,
          monthly: trendingPayload,
          source: "legacy",
          snapshotDate: null,
          generatedAt: null,
          stale: false,
          outputLog: null,
        });
      } else {
        setTrendingSnapshot({
          daily: Array.isArray(trendingPayload?.daily) ? trendingPayload.daily : [],
          weekly: Array.isArray(trendingPayload?.weekly) ? trendingPayload.weekly : [],
          monthly: Array.isArray(trendingPayload?.monthly) ? trendingPayload.monthly : [],
          source: typeof trendingPayload?.source === "string" ? trendingPayload.source : null,
          snapshotDate: typeof trendingPayload?.snapshotDate === "string" ? trendingPayload.snapshotDate : null,
          generatedAt: typeof trendingPayload?.generatedAt === "string" ? trendingPayload.generatedAt : null,
          stale: Boolean(trendingPayload?.stale),
          outputLog: trendingPayload?.outputLog || null,
        });
      }
    } else if (trendingPayload?.outputLog) {
      setTrendingSnapshot((prev) => ({
        ...prev,
        source: prev.source || "error",
        outputLog: trendingPayload.outputLog,
      }));
    }
    if (r2.ok) setLaundryServer(await r2.json());
    if (r4.ok) {
      const config = await r4.json();
      setRepoPathInput(config.repoPath || "");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let interval = null;

    const tick = () => {
      if (document.hidden) return;
      fetch("/api/laundry/server", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => data && setLaundryServer(data))
        .catch(() => null);
    };

    const startInterval = () => {
      if (interval) return;
      interval = setInterval(tick, 5000);
    };

    const stopInterval = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopInterval();
      } else {
        tick();
        startInterval();
      }
    };

    startInterval();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopInterval();
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

  async function runMongoCheck() {
    setMongoCheck({ status: "checking", message: "Checking MongoDB connection..." });
    try {
      const res = await fetch("/api/mongodb/check", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setMongoCheck({ status: "failed", message: data.error || "Connection failed." });
        return;
      }
      setMongoCheck({
        status: "connected",
        message: `Connected to ${data.dbName} @ ${data.uriHost}`,
      });
    } catch (error) {
      setMongoCheck({
        status: "failed",
        message: error instanceof Error ? error.message : "Connection failed.",
      });
    }
  }

  const status = laundryServer?.status || "stopped";
  const trending = trendingSnapshot[activeTrendWindow] || [];
  const trendingGeneratedAt = useMemo(() => {
    if (!trendingSnapshot.generatedAt) return null;
    const date = new Date(trendingSnapshot.generatedAt);
    return Number.isNaN(date.getTime()) ? null : date.toLocaleString();
  }, [trendingSnapshot.generatedAt]);

  return (
    <>
      <section className="hero card control-hero fade-up">
        <div className="section-header">
          <p className="eyebrow">Control Center</p>
          <h1>Bobot Control Deck</h1>
        </div>
      </section>

      <section className="action-grid fade-up delay-2">
        <article className="card action-panel">
          <div className="section-header">
            <p className="eyebrow">Action Panel</p>
            <h2>Laundry Runtime Control</h2>
          </div>
          <div className="status-row">
            <span className={`status-dot status-${status}`} />
            <strong className="status-label">{status}</strong>
            {laundryServer?.pid ? <span className="status-meta">PID {laundryServer.pid}</span> : null}
          </div>
          <form className="path-form" onSubmit={saveRepoPath}>
            <label htmlFor="repoPath">Repository path</label>
            <div className="input-row">
              <Input
                id="repoPath"
                value={repoPathInput}
                onChange={(e) => setRepoPathInput(e.target.value)}
                placeholder="C:\\Users\\boazs\\webdev\\laundry-silayan"
                required
              />
              <Button type="submit" variant="ghost" className="ghost-btn interactive focus-ring">Save path</Button>
            </div>
            {configError ? <p className="error">{configError}</p> : null}
          </form>
          <div className="button-row">
            <Button
              type="button"
              className="primary-btn interactive focus-ring"
              onClick={() => controlLaundryServer("start")}
              disabled={serverBusy || status === "running" || status === "starting"}
            >
              Play
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="danger-btn interactive focus-ring"
              onClick={() => controlLaundryServer("stop")}
              disabled={serverBusy || status === "stopped"}
            >
              Stop
            </Button>
          </div>
          {laundryServer?.lastError ? (
            <p className="error">Last error snapshot: {laundryServer.lastError}</p>
          ) : null}
          <details className="logs">
            <summary>Open runtime log stream</summary>
            <pre>
              {(laundryServer?.logs || [])
                .map((l) => `[${new Date(l.at).toLocaleTimeString()}] ${l.source}: ${l.text}`)
                .join("\n") || "No logs yet."}
            </pre>
          </details>
        </article>

        <article className="card system-panel system-panel-compact">
          <div className="section-header">
            <p className="eyebrow">System Section</p>
            <h2>MongoDB Connection Checker</h2>
          </div>
          <p className="muted">{mongoCheck.message}</p>
          <div className="button-row">
            <Button
              type="button"
              className="primary-btn interactive focus-ring"
              onClick={runMongoCheck}
              disabled={mongoCheck.status === "checking"}
            >
              {mongoCheck.status === "checking" ? "Checking..." : "Check connection"}
            </Button>
          </div>
        </article>

        <article className="card system-panel">
          <div className="section-header">
            <h2>GitHub Trending</h2>
          </div>
          <div className="button-row trending-controls" role="tablist" aria-label="Trending repository windows">
            {TREND_WINDOWS.map((window) => (
              <button
                key={window.id}
                type="button"
                role="tab"
                aria-selected={activeTrendWindow === window.id}
                className={activeTrendWindow === window.id ? "primary-btn interactive focus-ring" : "ghost-btn interactive focus-ring"}
                onClick={() => setActiveTrendWindow(window.id)}
              >
                {window.label}
              </button>
            ))}
          </div>
          <p className="muted trending-meta">
            Source: {trendingSnapshot.source || "unknown"}
            {trendingSnapshot.snapshotDate ? ` | Snapshot: ${trendingSnapshot.snapshotDate}` : ""}
            {trendingGeneratedAt ? ` | Generated: ${trendingGeneratedAt}` : ""}
            {trendingSnapshot.stale ? " | stale fallback" : ""}
          </p>
          <details className="logs">
            <summary>Trending output log</summary>
            <pre>{formatTrendingOutputLog(trendingSnapshot.outputLog)}</pre>
          </details>
          <ul className="trending-list">
            {trending.map((repo, index) => (
              <li key={repo.id} className="trending-item">
                <span className="trending-rank">#{index + 1}</span>
                <div className="trending-copy">
                  <a className="trending-link interactive focus-ring" href={repo.html_url} target="_blank" rel="noreferrer">
                    {repo.full_name}
                  </a>
                  <p className="trending-description">{repo.description || "No description provided."}</p>
                </div>
                <span className="trending-stars">{Number(repo.stargazers_count || 0).toLocaleString()} stars</span>
              </li>
            ))}
            {!trending.length ? <li className="trending-empty">No trending repositories loaded.</li> : null}
          </ul>
        </article>

      </section>
    </>
  );
}

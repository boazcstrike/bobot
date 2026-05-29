"use client";

import { useEffect, useMemo, useState } from "react";

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  window.speechSynthesis.speak(utterance);
}

export default function Page() {
  const [reminders, setReminders] = useState([]);
  const [trending, setTrending] = useState([]);
  const [laundryServer, setLaundryServer] = useState(null);
  const [laundryAnalytics, setLaundryAnalytics] = useState(null);
  const [repoPathInput, setRepoPathInput] = useState("");
  const [configError, setConfigError] = useState("");
  const [serverBusy, setServerBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [remindAt, setRemindAt] = useState("");

  async function loadData() {
    const [r1, r2, r3, r4, r5] = await Promise.all([
      fetch("/api/reminders", { cache: "no-store" }),
      fetch("/api/trending", { cache: "no-store" }),
      fetch("/api/laundry/server", { cache: "no-store" }),
      fetch("/api/laundry/analytics", { cache: "no-store" }),
      fetch("/api/laundry/config", { cache: "no-store" }),
    ]);
    if (r1.ok) setReminders(await r1.json());
    if (r2.ok) setTrending(await r2.json());
    if (r3.ok) setLaundryServer(await r3.json());
    if (r4.ok) setLaundryAnalytics(await r4.json());
    if (r5.ok) {
      const config = await r5.json();
      setRepoPathInput(config.repoPath || "");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch("/api/laundry/server", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => data && setLaundryServer(data))
        .catch(() => null);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const dueReminders = useMemo(() => {
    const now = Date.now();
    return reminders.filter((r) => new Date(r.remindAt).getTime() <= now);
  }, [reminders]);

  useEffect(() => {
    if (!dueReminders.length) return;
    dueReminders.forEach((r) => speak(`Reminder: ${r.title}`));
  }, [dueReminders]);

  async function addReminder(e) {
    e.preventDefault();
    const res = await fetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, remindAt }),
    });
    if (res.ok) {
      setTitle("");
      setRemindAt("");
      await loadData();
    }
  }

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

  return (
    <main className="dashboard">
      <div className="mesh-bg" />
      <section className="hero card fade-up">
        <h1>Bobot Control Deck</h1>
        <p>Run laundry webapp from one button, monitor failures, and view saved analytics snapshots.</p>
      </section>

      <section className="card fade-up delay-1">
        <h2>Laundry Runtime</h2>
        <div className="status-row">
          <span className={`status-dot status-${status}`} />
          <strong className="status-label">{status}</strong>
          {laundryServer?.pid ? <span>PID {laundryServer.pid}</span> : null}
        </div>
        <form className="path-form" onSubmit={saveRepoPath}>
          <label htmlFor="repoPath">Repository path</label>
          <div className="input-row">
            <input
              id="repoPath"
              value={repoPathInput}
              onChange={(e) => setRepoPathInput(e.target.value)}
              placeholder="C:\\Users\\boazs\\webdev\\laundry-silayan"
              required
            />
            <button type="submit" className="ghost-btn">Save path</button>
          </div>
          {configError ? <p className="error">{configError}</p> : null}
        </form>
        <div className="button-row">
          <button
            className="primary-btn"
            onClick={() => controlLaundryServer("start")}
            disabled={serverBusy || status === "running" || status === "starting"}
          >
            Play
          </button>
          <button
            className="danger-btn"
            onClick={() => controlLaundryServer("stop")}
            disabled={serverBusy || status === "stopped"}
          >
            Stop
          </button>
        </div>
        {laundryServer?.lastError ? (
          <p className="error">Last error snapshot: {laundryServer.lastError}</p>
        ) : null}
        <details className="logs">
          <summary>Runtime logs</summary>
          <pre>
            {(laundryServer?.logs || [])
              .map((l) => `[${new Date(l.at).toLocaleTimeString()}] ${l.source}: ${l.text}`)
              .join("\n") || "No logs yet."}
          </pre>
        </details>
      </section>

      <section className="card fade-up delay-2">
        <h2>Laundry Analytics</h2>
        <div className="stats-grid">
          <article><span>Total</span><strong>{laundryAnalytics?.totalSubmissions ?? "-"}</strong></article>
          <article><span>Successful</span><strong>{laundryAnalytics?.successfulSubmissions ?? "-"}</strong></article>
          <article><span>Failed</span><strong>{laundryAnalytics?.failedSubmissions ?? "-"}</strong></article>
          <article><span>Avg Items</span><strong>{laundryAnalytics?.averageItemsPerSubmission ?? "-"}</strong></article>
        </div>
        <div className="dual-col">
          <div>
            <h3>Top Items</h3>
            <ul>
              {(laundryAnalytics?.items || []).map((item) => (
                <li key={item.name}>{item.name}: {item.totalCount}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Last 7 Days</h3>
            <div className="bars">
              {(laundryAnalytics?.daily || []).map((d) => {
                const max = Math.max(...(laundryAnalytics?.daily || []).map((x) => Number(x.count)), 1);
                const height = Math.max(8, Math.round((Number(d.count) / max) * 100));
                return (
                  <div key={d.day} className="bar-wrap">
                    <div className="bar" style={{ height: `${height}px` }} />
                    <span>{String(d.day).slice(5)}</span>
                    <strong>{d.count}</strong>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="card fade-up delay-3">
        <h2>Add Reminder</h2>
        <form className="input-row" onSubmit={addReminder}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Reminder title" required />
          <input type="datetime-local" value={remindAt} onChange={(e) => setRemindAt(e.target.value)} required />
          <button type="submit" className="ghost-btn">Save</button>
        </form>
      </section>

      <section className="card fade-up delay-3">
        <h2>GitHub Trending</h2>
        <ul>
          {trending.map((repo) => (
            <li key={repo.id}>
              <a href={repo.html_url} target="_blank" rel="noreferrer">{repo.full_name}</a> ({repo.stargazers_count} stars)
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

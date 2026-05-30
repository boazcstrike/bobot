"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, ChartColumn, House, Shirt, WalletCards, Wrench } from "lucide-react";

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  window.speechSynthesis.speak(utterance);
}

export default function LaundryPage() {
  const [reminders, setReminders] = useState([]);
  const [laundryServer, setLaundryServer] = useState(null);
  const [laundryAnalytics, setLaundryAnalytics] = useState(null);
  const [repoPathInput, setRepoPathInput] = useState("");
  const [configError, setConfigError] = useState("");
  const [serverBusy, setServerBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [remindAt, setRemindAt] = useState("");

  async function loadData() {
    const [r1, r3, r4, r5] = await Promise.allSettled([
      fetch("/api/reminders", { cache: "no-store" }),
      fetch("/api/laundry/server", { cache: "no-store" }),
      fetch("/api/laundry/analytics", { cache: "no-store" }),
      fetch("/api/laundry/config", { cache: "no-store" }),
    ]);
    if (r1.status === "fulfilled" && r1.value.ok) setReminders(await r1.value.json());
    if (r3.status === "fulfilled" && r3.value.ok) setLaundryServer(await r3.value.json());
    if (r4.status === "fulfilled" && r4.value.ok) setLaundryAnalytics(await r4.value.json());
    if (r5.status === "fulfilled" && r5.value.ok) {
      const config = await r5.value.json();
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
    <main className="dashboard dashboard-shell">
      <div className="mesh-bg" aria-hidden="true" />
      <div className="dashboard-content dashboard-stack">
        <header className="hero card dashboard-card dashboard-card-hero fade-up">
          <p className="dashboard-kicker">Laundry Operations</p>
          <h1><Shirt size={20} className="icon-inline" /> Laundry Control Deck</h1>
          <p>Runtime control, reminders, and laundry analytics in one page.</p>
        </header>

        <nav className="card dashboard-card dashboard-nav fade-up delay-1" aria-label="Laundry dashboard shortcuts">
          <p className="section-nav">
            <a href="/"><House size={14} className="icon-inline" /> Back to hub</a>
            {" "}
            <span aria-hidden="true">|</span>
            {" "}
            <a href="/expenses"><WalletCards size={14} className="icon-inline" /> Open expense tracker</a>
          </p>
        </nav>

        <div className="dashboard-grid dashboard-grid-laundry">
          <section className="card dashboard-card dashboard-card-runtime fade-up delay-1" aria-labelledby="laundry-runtime-heading">
            <header className="dashboard-card-header">
              <h2 id="laundry-runtime-heading"><Wrench size={18} className="icon-inline" /> Laundry Runtime</h2>
            </header>
            <div className="dashboard-card-body">
              <div className="status-row">
                <span className={`status-dot status-${status}`} />
                <strong className="status-label">{status}</strong>
                {laundryServer?.pid ? <span>PID {laundryServer.pid}</span> : null}
              </div>
              <form className="path-form" onSubmit={saveRepoPath}>
                <label htmlFor="repoPath">Repository path</label>
                <div className="input-row">
                  <input id="repoPath" value={repoPathInput} onChange={(e) => setRepoPathInput(e.target.value)} placeholder="C:\\Users\\boazs\\webdev\\laundry-silayan" required />
                  <button type="submit" className="ghost-btn">Save path</button>
                </div>
                {configError ? <p className="error">{configError}</p> : null}
              </form>
              <div className="button-row dashboard-actions" role="group" aria-label="Laundry runtime controls">
                <button className="primary-btn" onClick={() => controlLaundryServer("start")} disabled={serverBusy || status === "running" || status === "starting"}>Play</button>
                <button className="danger-btn" onClick={() => controlLaundryServer("stop")} disabled={serverBusy || status === "stopped"}>Stop</button>
              </div>
              {laundryServer?.lastError ? <p className="error">Last error snapshot: {laundryServer.lastError}</p> : null}
              <details className="logs dashboard-logs">
                <summary>Runtime logs</summary>
                <pre>{(laundryServer?.logs || []).map((l) => `[${new Date(l.at).toLocaleTimeString()}] ${l.source}: ${l.text}`).join("\n") || "No logs yet."}</pre>
              </details>
            </div>
          </section>

          <section className="card dashboard-card dashboard-card-analytics fade-up delay-2" aria-labelledby="laundry-analytics-heading">
            <header className="dashboard-card-header">
              <h2 id="laundry-analytics-heading"><ChartColumn size={18} className="icon-inline" /> Laundry Analytics</h2>
            </header>
            <div className="dashboard-card-body">
              <div className="stats-grid dashboard-stats-grid">
                <article className="dashboard-stat-card">
                  <span>Total</span>
                  <strong>{laundryAnalytics?.totalSubmissions ?? "-"}</strong>
                </article>
                <article className="dashboard-stat-card">
                  <span>Successful</span>
                  <strong>{laundryAnalytics?.successfulSubmissions ?? "-"}</strong>
                </article>
                <article className="dashboard-stat-card">
                  <span>Failed</span>
                  <strong>{laundryAnalytics?.failedSubmissions ?? "-"}</strong>
                </article>
                <article className="dashboard-stat-card">
                  <span>Avg Items</span>
                  <strong>{laundryAnalytics?.averageItemsPerSubmission ?? "-"}</strong>
                </article>
              </div>
            </div>
          </section>

          <section className="card dashboard-card dashboard-card-reminders fade-up delay-3" aria-labelledby="laundry-reminders-heading">
            <header className="dashboard-card-header">
              <h2 id="laundry-reminders-heading"><Bell size={18} className="icon-inline" /> Add Reminder</h2>
            </header>
            <div className="dashboard-card-body">
              <form className="input-row dashboard-reminder-form" onSubmit={addReminder}>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Reminder title" required />
                <input type="datetime-local" value={remindAt} onChange={(e) => setRemindAt(e.target.value)} required />
                <button type="submit" className="ghost-btn">Save</button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

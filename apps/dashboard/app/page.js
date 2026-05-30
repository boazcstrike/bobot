"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Palette, Settings, SlidersHorizontal, X } from "lucide-react";
import ThemedScroller from "./components/themed-scroller";

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  window.speechSynthesis.speak(utterance);
}

const THEME_GROUPS = [
  {
    id: "luxury",
    title: "Luxury Grey and Black",
    description: "Three monochrome premium palettes tuned for high contrast and polished depth.",
    themes: [
      {
        id: "luxury-obsidian",
        name: "Obsidian Atelier",
        note: "Charcoal, pewter, and polished steel.",
        swatches: ["#070809", "#111317", "#2d3037", "#8b909a", "#f4f5f7"],
        vars: {
          "--color-primary": "#c8ccd4",
          "--color-secondary": "#8b909a",
          "--color-cta": "#f1f5f9",
          "--color-background": "#070809",
          "--color-surface": "#101317",
          "--color-text": "#f4f5f7",
          "--color-text-muted": "#b6bcc8",
          "--color-border": "#2d3037",
          "--color-border-strong": "#444a55",
          "--color-success": "#22c55e",
          "--color-warn": "#f59e0b",
          "--color-idle": "#9ca3af",
          "--color-danger": "#ef4444",
          "--ambient-1": "rgba(168, 175, 189, 0.2)",
          "--ambient-2": "rgba(104, 112, 125, 0.15)",
          "--ambient-3": "rgba(240, 242, 246, 0.09)",
          "--grid-line-1": "rgba(148, 163, 184, 0.11)",
          "--grid-line-2": "rgba(226, 232, 240, 0.08)",
          "--card-surface": "rgba(24, 28, 34, 0.92)",
          "--card-surface-alt": "rgba(14, 17, 22, 0.96)",
          "--glass-blur": "6px",
        },
      },
      {
        id: "luxury-platinum",
        name: "Platinum Ledger",
        note: "Graphite foundation with soft platinum highlights.",
        swatches: ["#0e1014", "#1c1f25", "#3f4450", "#a8adb8", "#f8fafc"],
        vars: {
          "--color-primary": "#d1d5db",
          "--color-secondary": "#9ca3af",
          "--color-cta": "#f8fafc",
          "--color-background": "#0e1014",
          "--color-surface": "#161a20",
          "--color-text": "#f8fafc",
          "--color-text-muted": "#c2c8d3",
          "--color-border": "#353a45",
          "--color-border-strong": "#555d6d",
          "--color-success": "#4ade80",
          "--color-warn": "#fbbf24",
          "--color-idle": "#9ca3af",
          "--color-danger": "#f87171",
          "--ambient-1": "rgba(186, 193, 206, 0.19)",
          "--ambient-2": "rgba(107, 114, 128, 0.16)",
          "--ambient-3": "rgba(229, 231, 235, 0.11)",
          "--grid-line-1": "rgba(203, 213, 225, 0.12)",
          "--grid-line-2": "rgba(148, 163, 184, 0.1)",
          "--card-surface": "rgba(31, 36, 44, 0.92)",
          "--card-surface-alt": "rgba(21, 24, 31, 0.96)",
          "--glass-blur": "6px",
        },
      },
      {
        id: "luxury-carbon",
        name: "Carbon Executive",
        note: "Deep black with graphite and slate transitions.",
        swatches: ["#050607", "#121419", "#262b33", "#6b7280", "#e5e7eb"],
        vars: {
          "--color-primary": "#e5e7eb",
          "--color-secondary": "#9ca3af",
          "--color-cta": "#f3f4f6",
          "--color-background": "#050607",
          "--color-surface": "#111419",
          "--color-text": "#f5f7fa",
          "--color-text-muted": "#aeb6c2",
          "--color-border": "#2a2f38",
          "--color-border-strong": "#424a57",
          "--color-success": "#34d399",
          "--color-warn": "#f59e0b",
          "--color-idle": "#94a3b8",
          "--color-danger": "#fb7185",
          "--ambient-1": "rgba(148, 163, 184, 0.2)",
          "--ambient-2": "rgba(71, 85, 105, 0.16)",
          "--ambient-3": "rgba(226, 232, 240, 0.08)",
          "--grid-line-1": "rgba(148, 163, 184, 0.11)",
          "--grid-line-2": "rgba(226, 232, 240, 0.08)",
          "--card-surface": "rgba(20, 24, 30, 0.92)",
          "--card-surface-alt": "rgba(10, 12, 16, 0.96)",
          "--glass-blur": "6px",
        },
      },
    ],
  },
  {
    id: "brand",
    title: "Brand-Inspired",
    description: "Palettes inspired by Spotify, Discord, Steam, and GitHub.",
    themes: [
      {
        id: "brand-spotify",
        name: "Spotify Pulse",
        note: "Spotify green energy on true-dark canvas.",
        swatches: ["#121212", "#1DB954", "#1ED760", "#535353", "#ffffff"],
        vars: {
          "--color-primary": "#1db954",
          "--color-secondary": "#1ed760",
          "--color-cta": "#1db954",
          "--color-background": "#121212",
          "--color-surface": "#181818",
          "--color-text": "#f5f5f5",
          "--color-text-muted": "#b3b3b3",
          "--color-border": "#2a2a2a",
          "--color-border-strong": "#3a3a3a",
          "--color-success": "#1ed760",
          "--color-warn": "#f59e0b",
          "--color-idle": "#6b7280",
          "--color-danger": "#ef4444",
          "--ambient-1": "rgba(29, 185, 84, 0.2)",
          "--ambient-2": "rgba(30, 215, 96, 0.12)",
          "--ambient-3": "rgba(255, 255, 255, 0.07)",
          "--grid-line-1": "rgba(29, 185, 84, 0.14)",
          "--grid-line-2": "rgba(255, 255, 255, 0.07)",
          "--card-surface": "rgba(24, 24, 24, 0.92)",
          "--card-surface-alt": "rgba(18, 18, 18, 0.96)",
          "--glass-blur": "6px",
        },
      },
      {
        id: "brand-discord",
        name: "Discord Orbit",
        note: "Blurple-forward with clean dark neutrals.",
        swatches: ["#0f1014", "#1e2129", "#5865F2", "#99AAB5", "#ffffff"],
        vars: {
          "--color-primary": "#5865f2",
          "--color-secondary": "#99aab5",
          "--color-cta": "#5865f2",
          "--color-background": "#0f1014",
          "--color-surface": "#181b22",
          "--color-text": "#f2f3f5",
          "--color-text-muted": "#c7d0d9",
          "--color-border": "#2e3442",
          "--color-border-strong": "#4a5567",
          "--color-success": "#57f287",
          "--color-warn": "#fbbf24",
          "--color-idle": "#99aab5",
          "--color-danger": "#ed4245",
          "--ambient-1": "rgba(88, 101, 242, 0.2)",
          "--ambient-2": "rgba(153, 170, 181, 0.14)",
          "--ambient-3": "rgba(242, 243, 245, 0.08)",
          "--grid-line-1": "rgba(88, 101, 242, 0.14)",
          "--grid-line-2": "rgba(153, 170, 181, 0.09)",
          "--card-surface": "rgba(26, 30, 39, 0.92)",
          "--card-surface-alt": "rgba(16, 19, 26, 0.96)",
          "--glass-blur": "6px",
        },
      },
      {
        id: "brand-steam",
        name: "Steam Forge",
        note: "Steam blues with deep naval layers.",
        swatches: ["#0b1017", "#1b2838", "#2A475E", "#66C0F4", "#c7d5e0"],
        vars: {
          "--color-primary": "#66c0f4",
          "--color-secondary": "#2a475e",
          "--color-cta": "#66c0f4",
          "--color-background": "#0b1017",
          "--color-surface": "#111a24",
          "--color-text": "#e5edf5",
          "--color-text-muted": "#b3c2d3",
          "--color-border": "#2d3e51",
          "--color-border-strong": "#45617f",
          "--color-success": "#4ade80",
          "--color-warn": "#f59e0b",
          "--color-idle": "#94a3b8",
          "--color-danger": "#fb7185",
          "--ambient-1": "rgba(102, 192, 244, 0.2)",
          "--ambient-2": "rgba(42, 71, 94, 0.18)",
          "--ambient-3": "rgba(229, 237, 245, 0.07)",
          "--grid-line-1": "rgba(102, 192, 244, 0.14)",
          "--grid-line-2": "rgba(42, 71, 94, 0.14)",
          "--card-surface": "rgba(24, 36, 49, 0.9)",
          "--card-surface-alt": "rgba(14, 22, 31, 0.95)",
          "--glass-blur": "6px",
        },
      },
      {
        id: "brand-github",
        name: "GitHub Monolith",
        note: "GitHub dark syntax feel with emerald action cues.",
        swatches: ["#0d1117", "#161B22", "#58A6FF", "#2EA043", "#E6EDF3"],
        vars: {
          "--color-primary": "#58a6ff",
          "--color-secondary": "#7d8590",
          "--color-cta": "#2ea043",
          "--color-background": "#0d1117",
          "--color-surface": "#161b22",
          "--color-text": "#e6edf3",
          "--color-text-muted": "#9ea7b3",
          "--color-border": "#30363d",
          "--color-border-strong": "#484f58",
          "--color-success": "#2ea043",
          "--color-warn": "#d29922",
          "--color-idle": "#8b949e",
          "--color-danger": "#f85149",
          "--ambient-1": "rgba(88, 166, 255, 0.2)",
          "--ambient-2": "rgba(46, 160, 67, 0.14)",
          "--ambient-3": "rgba(230, 237, 243, 0.07)",
          "--grid-line-1": "rgba(88, 166, 255, 0.14)",
          "--grid-line-2": "rgba(125, 133, 144, 0.1)",
          "--card-surface": "rgba(22, 27, 34, 0.9)",
          "--card-surface-alt": "rgba(13, 17, 23, 0.96)",
          "--glass-blur": "6px",
        },
      },
    ],
  },
  {
    id: "future",
    title: "Futuristic Glass",
    description: "Three transparent and glassy schemes with luminous accents.",
    themes: [
      {
        id: "future-aurora",
        name: "Aurora Glassfield",
        note: "Cyan highlights with misted midnight panes.",
        swatches: ["#05070f", "#101a34", "#34d399", "#38bdf8", "rgba(203,233,255,0.85)"],
        vars: {
          "--color-primary": "#38bdf8",
          "--color-secondary": "#34d399",
          "--color-cta": "#60a5fa",
          "--color-background": "#05070f",
          "--color-surface": "rgba(12, 18, 34, 0.68)",
          "--color-text": "#edf6ff",
          "--color-text-muted": "#b9cee6",
          "--color-border": "rgba(125, 211, 252, 0.28)",
          "--color-border-strong": "rgba(52, 211, 153, 0.45)",
          "--color-success": "#34d399",
          "--color-warn": "#fbbf24",
          "--color-idle": "#93c5fd",
          "--color-danger": "#fb7185",
          "--ambient-1": "rgba(56, 189, 248, 0.26)",
          "--ambient-2": "rgba(52, 211, 153, 0.18)",
          "--ambient-3": "rgba(191, 219, 254, 0.18)",
          "--grid-line-1": "rgba(56, 189, 248, 0.16)",
          "--grid-line-2": "rgba(52, 211, 153, 0.14)",
          "--card-surface": "rgba(16, 25, 46, 0.48)",
          "--card-surface-alt": "rgba(10, 16, 33, 0.62)",
          "--glass-blur": "20px",
        },
      },
      {
        id: "future-nebula",
        name: "Nebula Lattice",
        note: "Electric ice blues on transparent slate.",
        swatches: ["#070c18", "#1d2d50", "#7dd3fc", "#67e8f9", "rgba(232,245,255,0.8)"],
        vars: {
          "--color-primary": "#7dd3fc",
          "--color-secondary": "#67e8f9",
          "--color-cta": "#93c5fd",
          "--color-background": "#070c18",
          "--color-surface": "rgba(17, 27, 45, 0.66)",
          "--color-text": "#eff6ff",
          "--color-text-muted": "#bfd3eb",
          "--color-border": "rgba(125, 211, 252, 0.26)",
          "--color-border-strong": "rgba(103, 232, 249, 0.42)",
          "--color-success": "#22d3ee",
          "--color-warn": "#fbbf24",
          "--color-idle": "#93c5fd",
          "--color-danger": "#fb7185",
          "--ambient-1": "rgba(125, 211, 252, 0.26)",
          "--ambient-2": "rgba(103, 232, 249, 0.16)",
          "--ambient-3": "rgba(239, 246, 255, 0.14)",
          "--grid-line-1": "rgba(125, 211, 252, 0.16)",
          "--grid-line-2": "rgba(103, 232, 249, 0.14)",
          "--card-surface": "rgba(18, 31, 51, 0.46)",
          "--card-surface-alt": "rgba(10, 18, 33, 0.62)",
          "--glass-blur": "21px",
        },
      },
      {
        id: "future-cryo",
        name: "Cryo Prism",
        note: "Frosted teal panes with silver-blue glow.",
        swatches: ["#040912", "#113245", "#2dd4bf", "#93c5fd", "rgba(240,249,255,0.82)"],
        vars: {
          "--color-primary": "#2dd4bf",
          "--color-secondary": "#93c5fd",
          "--color-cta": "#60a5fa",
          "--color-background": "#040912",
          "--color-surface": "rgba(10, 28, 38, 0.68)",
          "--color-text": "#ecfeff",
          "--color-text-muted": "#bdd7de",
          "--color-border": "rgba(45, 212, 191, 0.28)",
          "--color-border-strong": "rgba(147, 197, 253, 0.44)",
          "--color-success": "#34d399",
          "--color-warn": "#fbbf24",
          "--color-idle": "#93c5fd",
          "--color-danger": "#fb7185",
          "--ambient-1": "rgba(45, 212, 191, 0.23)",
          "--ambient-2": "rgba(147, 197, 253, 0.2)",
          "--ambient-3": "rgba(236, 254, 255, 0.13)",
          "--grid-line-1": "rgba(45, 212, 191, 0.17)",
          "--grid-line-2": "rgba(147, 197, 253, 0.14)",
          "--card-surface": "rgba(13, 36, 49, 0.46)",
          "--card-surface-alt": "rgba(8, 21, 32, 0.62)",
          "--glass-blur": "20px",
        },
      },
    ],
  },
];

const ALL_THEMES = THEME_GROUPS.flatMap((group) => group.themes);
const DEFAULT_THEME_ID = ALL_THEMES[0].id;
const SETTINGS_STORAGE_KEY = "bobot-dashboard-settings";
const LEGACY_THEME_STORAGE_KEY = "bobot-dashboard-theme";
const SETTINGS_COOKIE_KEY = "bobot_dashboard_settings";
const SETTINGS_TABS = [
  { id: "personalization", label: "Personalization", icon: Palette },
  { id: "workspace", label: "Workspace", icon: SlidersHorizontal },
  { id: "alerts", label: "Alerts", icon: Bell },
];

function readSettingsCookie() {
  const cookiePrefix = `${SETTINGS_COOKIE_KEY}=`;
  const cookie = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(cookiePrefix));
  if (!cookie) return null;
  try {
    return JSON.parse(decodeURIComponent(cookie.slice(cookiePrefix.length)));
  } catch {
    return null;
  }
}

function saveSettingsCookie(settings) {
  const maxAgeSeconds = 60 * 60 * 24 * 365;
  const payload = encodeURIComponent(JSON.stringify(settings));
  document.cookie = `${SETTINGS_COOKIE_KEY}=${payload}; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
}

export default function Page() {
  const [reminders, setReminders] = useState([]);
  const [trending, setTrending] = useState([]);
  const [laundryServer, setLaundryServer] = useState(null);
  const [laundryAnalytics, setLaundryAnalytics] = useState(null);
  const [mongoCheck, setMongoCheck] = useState({ status: "idle", message: "Not checked yet." });
  const [repoPathInput, setRepoPathInput] = useState("");
  const [configError, setConfigError] = useState("");
  const [serverBusy, setServerBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [remindAt, setRemindAt] = useState("");
  const [selectedThemeId, setSelectedThemeId] = useState(DEFAULT_THEME_ID);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState("personalization");

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
    let parsed = null;
    try {
      const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
      parsed = raw ? JSON.parse(raw) : null;
    } catch {
      parsed = null;
    }
    if (!parsed) {
      parsed = readSettingsCookie();
    }

    const candidateThemeId = parsed?.selectedThemeId || window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
    const themeExists = ALL_THEMES.some((theme) => theme.id === candidateThemeId);
    if (themeExists) {
      setSelectedThemeId(candidateThemeId);
    }

    const tabExists = SETTINGS_TABS.some((tab) => tab.id === parsed?.activeSettingsTab);
    if (tabExists) {
      setActiveSettingsTab(parsed.activeSettingsTab);
    }
  }, []);

  useEffect(() => {
    const settings = {
      selectedThemeId,
      activeSettingsTab,
    };
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    window.localStorage.setItem(LEGACY_THEME_STORAGE_KEY, selectedThemeId);
    saveSettingsCookie(settings);
  }, [selectedThemeId, activeSettingsTab]);

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
  const totalSubmissions = laundryAnalytics?.totalSubmissions ?? 0;
  const successfulSubmissions = laundryAnalytics?.successfulSubmissions ?? 0;
  const successRate = totalSubmissions ? Math.round((successfulSubmissions / totalSubmissions) * 100) : 0;
  const daily = laundryAnalytics?.daily || [];
  const dailyMax = Math.max(...daily.map((d) => Number(d.count)), 1);
  const selectedTheme = useMemo(
    () => ALL_THEMES.find((theme) => theme.id === selectedThemeId) || ALL_THEMES[0],
    [selectedThemeId],
  );

  useEffect(() => {
    Object.entries(selectedTheme.vars).forEach(([name, value]) => {
      document.documentElement.style.setProperty(name, value);
    });
  }, [selectedTheme]);

  useEffect(() => {
    if (!settingsOpen) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setSettingsOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [settingsOpen]);

  useEffect(() => {
    document.body.style.overflow = settingsOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [settingsOpen]);

  return (
    <ThemedScroller as="main" className="dashboard dashboard-control-center h-screen">
      <div className="mesh-bg" aria-hidden="true" />
      <div className="dashboard-layout">
        <aside className="dashboard-sidebar card fade-up" aria-label="Dashboard sidebar">
          <p className="eyebrow">Dashboard</p>
          <h2>Control Rail</h2>
          <p className="muted">Open the settings cockpit to control personalization and dashboard preferences.</p>
          <button
            type="button"
            className="sidebar-settings-btn interactive focus-ring"
            onClick={() => {
              setActiveSettingsTab("personalization");
              setSettingsOpen(true);
            }}
            aria-haspopup="dialog"
            aria-controls="dashboard-settings-modal"
            aria-expanded={settingsOpen}
          >
            <Settings size={28} aria-hidden="true" />
            <span>
              <strong>Settings</strong>
              <small>Open large modal</small>
            </span>
          </button>
        </aside>

        <div className="dashboard-main">
      <section className="hero card control-hero fade-up">
        <div className="section-header">
          <p className="eyebrow">Control Center</p>
          <h1>Bobot Control Deck</h1>
          <p>Run laundry runtime, capture reminders, monitor trend signals, and review operational analytics in one view.</p>
        </div>
        <div className="hero-meta-grid" role="list" aria-label="Live dashboard summary">
          <article role="listitem" className="meta-chip">
            <span className={`status-dot status-${status}`} />
            <span className="meta-label">Runtime</span>
            <strong className="status-label">{status}</strong>
          </article>
          <article role="listitem" className="meta-chip">
            <span className="meta-label">Due reminders</span>
            <strong>{dueReminders.length}</strong>
          </article>
          <article role="listitem" className="meta-chip">
            <span className="meta-label">Tracked repos</span>
            <strong>{trending.length}</strong>
          </article>
          <article role="listitem" className="meta-chip">
            <span className="meta-label">Success rate</span>
            <strong>{successRate}%</strong>
          </article>
        </div>
      </section>

      <section className="kpi-band fade-up delay-2" aria-label="Key metrics">
        <article className="card kpi-card">
          <p className="kpi-label">Total submissions</p>
          <strong className="kpi-value">{laundryAnalytics?.totalSubmissions ?? "-"}</strong>
          <p className="kpi-note">Saved laundry form completions</p>
        </article>
        <article className="card kpi-card">
          <p className="kpi-label">Failed submissions</p>
          <strong className="kpi-value">{laundryAnalytics?.failedSubmissions ?? "-"}</strong>
          <p className="kpi-note">Includes recent runtime errors</p>
        </article>
        <article className="card kpi-card">
          <p className="kpi-label">Average items</p>
          <strong className="kpi-value">{laundryAnalytics?.averageItemsPerSubmission ?? "-"}</strong>
          <p className="kpi-note">Per submitted request</p>
        </article>
        <article className="card kpi-card">
          <p className="kpi-label">Pending reminders</p>
          <strong className="kpi-value">{reminders.length}</strong>
          <p className="kpi-note">{dueReminders.length} due now</p>
        </article>
      </section>

      <section className="action-grid fade-up delay-3">
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
              <input
                id="repoPath"
                value={repoPathInput}
                onChange={(e) => setRepoPathInput(e.target.value)}
                placeholder="C:\\Users\\boazs\\webdev\\laundry-silayan"
                required
              />
              <button type="submit" className="ghost-btn interactive focus-ring">Save path</button>
            </div>
            {configError ? <p className="error">{configError}</p> : null}
          </form>
          <div className="button-row">
            <button
              className="primary-btn interactive focus-ring"
              onClick={() => controlLaundryServer("start")}
              disabled={serverBusy || status === "running" || status === "starting"}
            >
              Play
            </button>
            <button
              className="danger-btn interactive focus-ring"
              onClick={() => controlLaundryServer("stop")}
              disabled={serverBusy || status === "stopped"}
            >
              Stop
            </button>
          </div>
          {laundryServer?.lastError ? (
            <p className="error">Last error snapshot: {laundryServer.lastError}</p>
          ) : null}
        </article>

        <article className="card action-panel">
          <div className="section-header">
            <p className="eyebrow">Action Panel</p>
            <h2>Add Reminder</h2>
          </div>
          <form className="input-row" onSubmit={addReminder}>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Reminder title" required />
            <input type="datetime-local" value={remindAt} onChange={(e) => setRemindAt(e.target.value)} required />
            <button type="submit" className="ghost-btn interactive focus-ring">Save</button>
          </form>
          <div className="list-block">
            <h3>Upcoming reminders</h3>
            <ul className="compact-list">
              {reminders.slice(0, 5).map((reminder) => (
                <li key={reminder.id || `${reminder.title}-${reminder.remindAt}`}>
                  <span>{reminder.title}</span>
                  <time dateTime={reminder.remindAt}>{new Date(reminder.remindAt).toLocaleString()}</time>
                </li>
              ))}
              {!reminders.length ? <li>No reminders yet.</li> : null}
            </ul>
          </div>
        </article>
      </section>

      <section className="system-grid fade-up delay-3">
        <article className="card system-panel">
          <div className="section-header">
            <p className="eyebrow">System Section</p>
            <h2>MongoDB Connection Checker</h2>
          </div>
          <p className="muted">{mongoCheck.message}</p>
          <div className="button-row">
            <button
              className="primary-btn interactive focus-ring"
              type="button"
              onClick={runMongoCheck}
              disabled={mongoCheck.status === "checking"}
            >
              {mongoCheck.status === "checking" ? "Checking..." : "Check connection"}
            </button>
          </div>
        </article>

        <article className="card system-panel">
          <div className="section-header">
            <p className="eyebrow">System Section</p>
            <h2>Laundry Analytics</h2>
          </div>
          <div className="stats-grid">
            <article><span>Total</span><strong>{laundryAnalytics?.totalSubmissions ?? "-"}</strong></article>
            <article><span>Successful</span><strong>{laundryAnalytics?.successfulSubmissions ?? "-"}</strong></article>
            <article><span>Failed</span><strong>{laundryAnalytics?.failedSubmissions ?? "-"}</strong></article>
            <article><span>Avg Items</span><strong>{laundryAnalytics?.averageItemsPerSubmission ?? "-"}</strong></article>
          </div>
          <div className="dual-col">
            <div className="list-block">
              <h3>Top Items</h3>
              <ul className="compact-list">
                {(laundryAnalytics?.items || []).map((item) => (
                  <li key={item.name}>
                    <span>{item.name}</span>
                    <strong>{item.totalCount}</strong>
                  </li>
                ))}
                {!laundryAnalytics?.items?.length ? <li>No items yet.</li> : null}
              </ul>
            </div>
            <div>
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
        </article>

        <article className="card system-panel">
          <div className="section-header">
            <p className="eyebrow">System Section</p>
            <h2>Runtime Logs</h2>
          </div>
          <details className="logs">
            <summary>Open runtime log stream</summary>
            <pre>
              {(laundryServer?.logs || [])
                .map((l) => `[${new Date(l.at).toLocaleTimeString()}] ${l.source}: ${l.text}`)
                .join("\n") || "No logs yet."}
            </pre>
          </details>
        </article>

        <article className="card system-panel">
          <div className="section-header">
            <p className="eyebrow">System Section</p>
            <h2>GitHub Trending</h2>
          </div>
          <ul className="compact-list">
            {trending.map((repo) => (
              <li key={repo.id}>
                <a className="interactive focus-ring" href={repo.html_url} target="_blank" rel="noreferrer">
                  {repo.full_name}
                </a>
                <span>{repo.stargazers_count} stars</span>
              </li>
            ))}
            {!trending.length ? <li>No trending repositories loaded.</li> : null}
          </ul>
        </article>

        <article className="card system-panel">
          <div className="section-header">
            <p className="eyebrow">System Section</p>
            <h2>Team</h2>
          </div>
          <div className="stats-grid">
            <article><span>Core Team</span><strong>3 coders</strong></article>
            <article><span>Coders</span><strong>3</strong></article>
            <article><span>Delivery Pods</span><strong>1</strong></article>
          </div>
        </article>
      </section>
        </div>
      </div>

      {settingsOpen ? (
        <div className="settings-modal-overlay" onClick={() => setSettingsOpen(false)}>
          <section
            id="dashboard-settings-modal"
            className="settings-modal card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="settings-modal-header">
              <div>
                <p className="eyebrow">Settings</p>
                <h2 id="settings-modal-title">Dashboard Settings Hub</h2>
              </div>
              <button
                type="button"
                className="settings-close-btn interactive focus-ring"
                onClick={() => setSettingsOpen(false)}
                aria-label="Close settings"
              >
                <X size={18} aria-hidden="true" />
                <span>Close</span>
              </button>
            </header>
            <div className="settings-modal-body">
              <nav className="settings-modal-tabs" role="tablist" aria-label="Settings tabs">
                {SETTINGS_TABS.map((tab) => {
                  const TabIcon = tab.icon;
                  const active = activeSettingsTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      id={`settings-tab-${tab.id}`}
                      type="button"
                      role="tab"
                      className={`settings-tab interactive focus-ring${active ? " active" : ""}`}
                      aria-selected={active}
                      aria-controls={`settings-panel-${tab.id}`}
                      onClick={() => setActiveSettingsTab(tab.id)}
                    >
                      <TabIcon size={16} aria-hidden="true" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
              <ThemedScroller
                id={`settings-panel-${activeSettingsTab}`}
                role="tabpanel"
                aria-labelledby={`settings-tab-${activeSettingsTab}`}
                className="settings-modal-panel"
              >
                {activeSettingsTab === "personalization" ? (
                  <section className="theme-settings" aria-label="Theme settings">
                    <div className="section-header">
                      <p className="eyebrow">Personalization</p>
                      <h3>Color Scheme Settings</h3>
                      <p>
                        Pick from luxury monochrome palettes, brand-inspired modes (Spotify, Discord, Steam, GitHub), or
                        futuristic transparent glass themes.
                      </p>
                    </div>
                    <p className="active-theme-note">
                      Active scheme: <strong>{selectedTheme.name}</strong>
                    </p>
                    <div className="theme-groups">
                      {THEME_GROUPS.map((group) => (
                        <article key={group.id} className="theme-group">
                          <header>
                            <h4>{group.title}</h4>
                            <p>{group.description}</p>
                          </header>
                          <div className="theme-options" role="list">
                            {group.themes.map((theme) => {
                              const active = theme.id === selectedThemeId;
                              return (
                                <button
                                  key={theme.id}
                                  type="button"
                                  className={`theme-option interactive focus-ring${active ? " active" : ""}`}
                                  onClick={() => setSelectedThemeId(theme.id)}
                                  aria-pressed={active}
                                >
                                  <span className="theme-option-head">
                                    <strong>{theme.name}</strong>
                                    <span>{theme.note}</span>
                                  </span>
                                  <span className="theme-swatches" aria-hidden="true">
                                    {theme.swatches.map((swatch) => (
                                      <span key={`${theme.id}-${swatch}`} className="theme-swatch" style={{ background: swatch }} />
                                    ))}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                ) : null}

                {activeSettingsTab === "workspace" ? (
                  <section className="settings-summary-grid">
                    <article className="settings-mini-card">
                      <span>Runtime status</span>
                      <strong className="status-label">{status}</strong>
                    </article>
                    <article className="settings-mini-card">
                      <span>Tracked repos</span>
                      <strong>{trending.length}</strong>
                    </article>
                    <article className="settings-mini-card">
                      <span>Configured repo path</span>
                      <strong>{repoPathInput || "Not set"}</strong>
                    </article>
                  </section>
                ) : null}

                {activeSettingsTab === "alerts" ? (
                  <section className="settings-summary-grid">
                    <article className="settings-mini-card">
                      <span>Pending reminders</span>
                      <strong>{reminders.length}</strong>
                    </article>
                    <article className="settings-mini-card">
                      <span>Due now</span>
                      <strong>{dueReminders.length}</strong>
                    </article>
                    <article className="settings-mini-card">
                      <span>Voice notifications</span>
                      <strong>Enabled</strong>
                    </article>
                  </section>
                ) : null}
              </ThemedScroller>
            </div>
          </section>
        </div>
      ) : null}
    </ThemedScroller>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ChartColumn,
  CircleDollarSign,
  FileText,
  LoaderCircle,
  MonitorPlay,
  UploadCloud,
  WalletCards,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useShell } from "../dashboard-shell";

function toDateTimeLocalValue(isoValue) {
  if (!isoValue) return "";
  const timestamp = Date.parse(isoValue);
  if (!Number.isFinite(timestamp)) return "";
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function currentYearStartLocalValue() {
  const now = new Date();
  return `${now.getFullYear()}-01-01T00:00`;
}

function currentDateTimeLocalValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

const SYNC_METHOD_GUIDE = {
  gmail_api: {
    label: "API method",
    summary: "Server-to-server through the Gmail API. Runs headless — no browser window opens.",
    requirement:
      "Requires Gmail OAuth credentials in .env (GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REDIRECT_URI, GMAIL_REFRESH_TOKEN). Best for unattended or scheduled syncs.",
  },
  playwright_chrome: {
    label: "Playwright method",
    summary: "Drives a real Chrome window that is already signed in to Gmail.",
    requirement:
      "No API credentials needed, but Chrome must be open and authenticated to the RCBC inbox (for example boaz.sze@gmail.com) before you sync. Best when OAuth is not set up.",
  },
};

// Upload limits. Keep in sync with the server-side validation in
// app/api/credit-card-statements/upload/route.js.
const UPLOAD_MAX_FILES = 20;
const UPLOAD_MAX_FILE_MB = 25;
const UPLOAD_MAX_BATCH_MB = 100;
const UPLOAD_ALLOWED_EXTENSIONS = [".pdf", ".csv"];

function hasAllowedExtension(name) {
  const lower = String(name || "").toLowerCase();
  return UPLOAD_ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function formatBytes(bytes) {
  const value = Number(bytes) || 0;
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ExpensesPage() {
  const SYNC_METHOD_API = "gmail_api";
  const SYNC_METHOD_PLAYWRIGHT = "playwright_chrome";

  const router = useRouter();
  const { setPendingStatements } = useShell();
  const [activeTab, setActiveTab] = useState("expenses");
  const [expenseAnalytics, setExpenseAnalytics] = useState(null);
  const [statementAnalytics, setStatementAnalytics] = useState(null);
  const [statementItems, setStatementItems] = useState([]);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [loadingStatements, setLoadingStatements] = useState(true);
  const [syncingStatements, setSyncingStatements] = useState(false);
  const [statementError, setStatementError] = useState("");
  const [periodStart, setPeriodStart] = useState(currentYearStartLocalValue);
  const [periodEnd, setPeriodEnd] = useState(currentDateTimeLocalValue);
  const [syncSummary, setSyncSummary] = useState(null);
  const [syncMethod, setSyncMethod] = useState(SYNC_METHOD_API);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadingStatements, setUploadingStatements] = useState(false);
  const [uploadSummary, setUploadSummary] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetch("/api/expenses/analytics", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setExpenseAnalytics(data))
      .catch(() => null);
  }, []);

  async function loadStatements() {
    setLoadingStatements(true);
    setStatementError("");
    try {
      const [analyticsRes, listRes] = await Promise.all([
        fetch("/api/credit-card-statements/analytics", { cache: "no-store" }),
        fetch("/api/credit-card-statements/list", { cache: "no-store" }),
      ]);

      if (!analyticsRes.ok) {
        throw new Error(await analyticsRes.text());
      }
      if (!listRes.ok) {
        throw new Error(await listRes.text());
      }

      const analyticsData = await analyticsRes.json();
      const listData = await listRes.json();
      setStatementAnalytics(analyticsData);
      setStatementItems(listData.items || []);
      setLastSyncedAt(listData.lastSyncedAt || analyticsData.lastSyncedAt || null);
      if (!periodStart && analyticsData?.oldestEmailDate) {
        setPeriodStart(toDateTimeLocalValue(analyticsData.oldestEmailDate));
      }
      if (!periodEnd && analyticsData?.latestEmailDate) {
        setPeriodEnd(toDateTimeLocalValue(analyticsData.latestEmailDate));
      }
    } catch (loadError) {
      setStatementError(loadError instanceof Error ? loadError.message : "Failed to load statements.");
    } finally {
      setLoadingStatements(false);
    }
  }

  useEffect(() => {
    loadStatements();
  }, []);

  async function syncStatementsFromGmail(options = {}) {
    setSyncingStatements(true);
    setStatementError("");
    try {
      const payload = {};
      const selectedMethod = options.method || syncMethod;
      payload.source = selectedMethod;
      const hasPeriodStartOverride = Object.prototype.hasOwnProperty.call(options, "periodStart");
      const hasPeriodEndOverride = Object.prototype.hasOwnProperty.call(options, "periodEnd");

      if (hasPeriodStartOverride) {
        if (options.periodStart) {
          payload.periodStart = options.periodStart;
        }
      } else if (periodStart) {
        payload.periodStart = periodStart;
      }

      if (hasPeriodEndOverride) {
        if (options.periodEnd) {
          payload.periodEnd = options.periodEnd;
        }
      } else if (periodEnd) {
        payload.periodEnd = periodEnd;
      }

      const res = await fetch("/api/credit-card-statements/sync", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const responsePayload = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          responsePayload?.error || responsePayload?.message || "Failed to sync statements.",
        );
      }
      setSyncSummary({
        ...(responsePayload || {}),
        method: responsePayload?.sourceUsed || selectedMethod,
      });
      await loadStatements();
    } catch (syncError) {
      setStatementError(syncError instanceof Error ? syncError.message : "Failed to sync statements.");
    } finally {
      setSyncingStatements(false);
    }
  }

  async function syncNewestSinceLatest() {
    if (!statementAnalytics?.latestEmailDate) {
      setStatementError("No latest statement timestamp found yet. Use a period sync first.");
      return;
    }
    const latestLocal = toDateTimeLocalValue(statementAnalytics.latestEmailDate);
    setPeriodStart(latestLocal);
    setPeriodEnd("");
    await syncStatementsFromGmail({
      periodStart: statementAnalytics.latestEmailDate,
      periodEnd: null,
    });
  }

  function addFiles(incoming) {
    const incomingList = Array.from(incoming || []);
    if (!incomingList.length) return;

    const problems = [];
    const seen = new Set(uploadFiles.map((file) => `${file.name}:${file.size}`));
    const accepted = [...uploadFiles];
    let batchBytes = uploadFiles.reduce((sum, file) => sum + file.size, 0);

    for (const file of incomingList) {
      const key = `${file.name}:${file.size}`;
      if (seen.has(key)) continue;
      if (!hasAllowedExtension(file.name)) {
        problems.push(`${file.name}: unsupported type`);
        continue;
      }
      if (file.size > UPLOAD_MAX_FILE_MB * 1024 * 1024) {
        problems.push(`${file.name}: over ${UPLOAD_MAX_FILE_MB} MB`);
        continue;
      }
      if (accepted.length >= UPLOAD_MAX_FILES) {
        problems.push(`Too many files (max ${UPLOAD_MAX_FILES})`);
        break;
      }
      if (batchBytes + file.size > UPLOAD_MAX_BATCH_MB * 1024 * 1024) {
        problems.push(`Batch over ${UPLOAD_MAX_BATCH_MB} MB`);
        break;
      }
      seen.add(key);
      accepted.push(file);
      batchBytes += file.size;
    }

    setUploadFiles(accepted);
    setUploadError(problems.length ? problems.join("; ") : "");
  }

  function removeFileAt(index) {
    setUploadFiles(uploadFiles.filter((_, fileIndex) => fileIndex !== index));
  }

  function clearFiles() {
    setUploadFiles([]);
    setUploadError("");
  }

  function openFilePicker() {
    if (uploadingStatements || loadingStatements) return;
    fileInputRef.current?.click();
  }

  function handleDragOver(event) {
    event.preventDefault();
    if (uploadingStatements || loadingStatements) return;
    if (!isDragging) setIsDragging(true);
  }

  function handleDragLeave(event) {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    if (uploadingStatements || loadingStatements) return;
    addFiles(event.dataTransfer?.files);
  }

  async function uploadStatements() {
    if (!uploadFiles.length) {
      setUploadError("Select at least one .pdf or .csv file to upload.");
      return;
    }
    setUploadingStatements(true);
    setStatementError("");
    setUploadError("");
    try {
      const body = new FormData();
      uploadFiles.forEach((file) => body.append("files", file));

      const res = await fetch("/api/credit-card-statements/upload", {
        method: "POST",
        cache: "no-store",
        body,
      });
      const responsePayload = await res.json().catch(() => null);
      if (res.status === 429) {
        const retryAfter = res.headers.get("Retry-After");
        throw new Error(
          responsePayload?.error ||
            `Rate limit exceeded.${retryAfter ? ` Try again in ${retryAfter}s.` : ""}`,
        );
      }
      if (!res.ok) {
        throw new Error(
          responsePayload?.error || responsePayload?.message || "Failed to upload statements.",
        );
      }
      setUploadSummary(responsePayload || {});
      setUploadFiles([]);
      await loadStatements();
    } catch (caughtError) {
      setUploadError(caughtError instanceof Error ? caughtError.message : "Failed to upload statements.");
    } finally {
      setUploadingStatements(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setActiveTab(params.get("tab") === "statements" ? "statements" : "expenses");
  }, []);

  function setTab(tab) {
    setActiveTab(tab);
    router.replace(tab === "statements" ? "/expenses?tab=statements" : "/expenses");
  }

  const totals = expenseAnalytics?.totals;
  const yearsCovered =
    totals?.firstYear && totals?.lastYear ? `${totals.firstYear}-${totals.lastYear}` : "-";
  const categories = (expenseAnalytics?.categories || []).slice(0, 12);
  const brands = (expenseAnalytics?.brands || []).slice(0, 12);
  const totalStatements = statementAnalytics?.totalStatements ?? 0;
  const totalProcessed = statementAnalytics?.totalProcessed ?? 0;
  const totalPending = statementAnalytics?.totalPending ?? 0;
  const methodGuide = SYNC_METHOD_GUIDE[syncMethod] || null;

  // Push the pending statement count up to the shared shell so the sidebar
  // badge reflects it across every route, not just while expenses is mounted.
  useEffect(() => {
    setPendingStatements(totalPending);
  }, [setPendingStatements, totalPending]);

  return (
    <>
        <section className="hero card fade-up expenses-hero">
          <h1>
            <WalletCards size={20} className="icon-inline" /> Expense Tracker
          </h1>
          <p>Expense analytics and credit card statement operations in one workspace.</p>
          <div className="button-row" role="tablist" aria-label="Expense and statements view">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "expenses"}
              className={activeTab === "expenses" ? "primary-btn interactive focus-ring" : "ghost-btn interactive focus-ring"}
              onClick={() => setTab("expenses")}
            >
              Expenses
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "statements"}
              className={activeTab === "statements" ? "primary-btn interactive focus-ring" : "ghost-btn interactive focus-ring"}
              onClick={() => setTab("statements")}
            >
              Credit Card Statements
            </button>
          </div>
        </section>

        {activeTab === "expenses" ? (
          <section className="card fade-up delay-1 expenses-kpi-block">
            <p className="expenses-source-link">
              <CircleDollarSign size={14} className="icon-inline" /> Source file:{" "}
              <a href="/api/expenses/source" target="_blank" rel="noreferrer">
                Assets and Expenses 2012-2024 - OUT.csv
              </a>
            </p>
            <h2>
              <ChartColumn size={18} className="icon-inline" /> Expense Tracker Analytics
            </h2>
            <div className="stats-grid expenses-kpi-grid">
              <article className="expenses-kpi-card">
                <span>Total Expenses (PHP)</span>
                <strong>{totals?.totalExpensesPhp ?? "-"}</strong>
              </article>
              <article className="expenses-kpi-card">
                <span>Transactions</span>
                <strong>{totals?.transactionCount ?? "-"}</strong>
              </article>
              <article className="expenses-kpi-card">
                <span>Average (PHP)</span>
                <strong>{totals?.averagePhp ?? "-"}</strong>
              </article>
              <article className="expenses-kpi-card">
                <span>Median (PHP)</span>
                <strong>{totals?.medianPhp ?? "-"}</strong>
              </article>
              <article className="expenses-kpi-card">
                <span>Categories</span>
                <strong>{totals?.categoryCount ?? "-"}</strong>
              </article>
              <article className="expenses-kpi-card">
                <span>Covered Years</span>
                <strong>{yearsCovered}</strong>
              </article>
            </div>

            <div className="dual-col expenses-analysis-grid">
              <article className="expenses-analysis-card">
                <h3>Organized Categories</h3>
                <ul className="expenses-analysis-list">
                  {categories.map((cat) => (
                    <li key={cat.name} className="expenses-analysis-item">
                      <span>{cat.name}</span>
                      <strong>PHP {cat.totalPhp}</strong>
                      <small>
                        {cat.transactionCount} tx | {cat.sharePct}%
                      </small>
                    </li>
                  ))}
                  {!categories.length && <li className="expenses-analysis-item">No category data yet.</li>}
                </ul>
              </article>

              <article className="expenses-analysis-card">
                <h3>Top Brands / Shops</h3>
                <ul className="expenses-analysis-list">
                  {brands.map((brand) => (
                    <li key={brand.name} className="expenses-analysis-item">
                      <span>{brand.name}</span>
                      <strong>PHP {brand.totalPhp}</strong>
                    </li>
                  ))}
                  {!brands.length && <li className="expenses-analysis-item">No brand data yet.</li>}
                </ul>
              </article>
            </div>
          </section>
        ) : (
          <>
            <section className="kpi-band fade-up delay-1" aria-label="Credit card statements KPIs">
              <article className="card kpi-card">
                <p className="kpi-label">Total statements</p>
                <strong className="kpi-value">{totalStatements}</strong>
                <p className="kpi-note">Downloaded statement files</p>
              </article>
              <article className="card kpi-card">
                <p className="kpi-label">Total processed</p>
                <strong className="kpi-value">{totalProcessed}</strong>
                <p className="kpi-note">Completed with local file archive</p>
              </article>
              <article className="card kpi-card">
                <p className="kpi-label">Total pending</p>
                <strong className="kpi-value">{totalPending}</strong>
                <p className="kpi-note">Pending review or retry</p>
              </article>
            </section>

            <section className="card fade-up delay-2 statements-upload-panel">
              <div className="section-header">
                <p className="eyebrow">Intake</p>
                <h2>Upload Statements</h2>
                <p>Upload your own .pdf or .csv credit card statements straight into the archive.</p>
              </div>
              <div
                role="button"
                tabIndex={0}
                aria-label="Upload statement files: drag and drop, or activate to browse"
                aria-disabled={uploadingStatements || loadingStatements}
                className="statements-dropzone interactive focus-ring"
                data-dragging={isDragging ? "true" : "false"}
                onClick={openFilePicker}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openFilePicker();
                  }
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  padding: "28px 20px",
                  textAlign: "center",
                  borderRadius: 12,
                  border: `1.5px dashed ${isDragging ? "var(--primary)" : "var(--border)"}`,
                  background: isDragging
                    ? "color-mix(in srgb, var(--primary) 8%, transparent)"
                    : "var(--card)",
                  cursor: uploadingStatements || loadingStatements ? "not-allowed" : "pointer",
                  transition: "border-color 120ms ease, background 120ms ease",
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.csv"
                  hidden
                  disabled={uploadingStatements || loadingStatements}
                  onChange={(event) => {
                    addFiles(event.target.files);
                    event.target.value = "";
                  }}
                />
                <UploadCloud size={28} aria-hidden="true" style={{ opacity: 0.8 }} />
                <p style={{ margin: 0, fontWeight: 600 }}>
                  {isDragging ? "Drop files to add them" : "Drag & drop statements here"}
                </p>
                <p className="kpi-note" style={{ margin: 0 }}>
                  or click to browse · .pdf or .csv · up to {UPLOAD_MAX_FILES} files ·{" "}
                  {UPLOAD_MAX_FILE_MB} MB each
                </p>
              </div>

              {uploadFiles.length ? (
                <ul
                  style={{
                    listStyle: "none",
                    margin: "12px 0 0",
                    padding: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  {uploadFiles.map((file, index) => (
                    <li
                      key={`${file.name}-${file.size}-${index}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 10px",
                        borderRadius: 8,
                        background: "color-mix(in srgb, var(--foreground) 6%, transparent)",
                      }}
                    >
                      <FileText size={15} className="icon-inline" aria-hidden="true" />
                      <span
                        style={{
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {file.name}
                      </span>
                      <span style={{ opacity: 0.7, fontSize: "0.85em" }}>{formatBytes(file.size)}</span>
                      <button
                        type="button"
                        className="interactive focus-ring"
                        aria-label={`Remove ${file.name}`}
                        onClick={() => removeFileAt(index)}
                        disabled={uploadingStatements}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "none",
                          background: "transparent",
                          color: "inherit",
                          cursor: uploadingStatements ? "not-allowed" : "pointer",
                          padding: 2,
                        }}
                      >
                        <X size={14} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="button-row">
                <Button
                  onClick={uploadStatements}
                  disabled={uploadingStatements || loadingStatements || !uploadFiles.length}
                >
                  {uploadingStatements
                    ? "Uploading..."
                    : `Upload${uploadFiles.length ? ` ${uploadFiles.length}` : ""} ${
                        uploadFiles.length === 1 ? "file" : "files"
                      }`}
                </Button>
                <Button
                  variant="outline"
                  onClick={clearFiles}
                  disabled={uploadingStatements || !uploadFiles.length}
                >
                  Clear
                </Button>
                {uploadingStatements ? (
                  <LoaderCircle size={16} className="spin-inline" aria-hidden="true" />
                ) : null}
              </div>
              {uploadError ? <p className="error">{uploadError}</p> : null}
              <p className="kpi-note">
                Files are stored under <code>data/credit-card-statements/raw/</code> and tracked in the
                statements manifest. Duplicate files (same contents) are skipped automatically.
              </p>
              {uploadSummary ? (
                <p className="kpi-note">
                  Last upload: added {uploadSummary.uploaded || 0}, skipped {uploadSummary.skipped || 0},
                  failed {uploadSummary.failed || 0}
                  {Array.isArray(uploadSummary.rejected) && uploadSummary.rejected.length
                    ? ` | rejected: ${uploadSummary.rejected
                        .map((entry) => `${entry.filename} (${entry.reason})`)
                        .join("; ")}`
                    : ""}
                </p>
              ) : null}
            </section>

            <section className="card fade-up delay-2 statements-sync-panel">
              <div className="section-header">
                <p className="eyebrow">Intake</p>
                <h2>Gmail Sync</h2>
                <p>Sync order is newest to oldest for RCBC statement emails.</p>
              </div>
              <div
                className="statements-method-segmented"
                role="radiogroup"
                aria-label="Sync method"
                data-active={syncMethod === SYNC_METHOD_API ? "api" : "playwright"}
              >
                <span className="statements-method-thumb" aria-hidden="true" />
                <button
                  type="button"
                  role="radio"
                  aria-checked={syncMethod === SYNC_METHOD_API}
                  className="statements-method-option"
                  onClick={() => setSyncMethod(SYNC_METHOD_API)}
                  disabled={syncingStatements || loadingStatements}
                >
                  <Zap size={15} className="icon-inline" aria-hidden="true" />
                  API method
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={syncMethod === SYNC_METHOD_PLAYWRIGHT}
                  className="statements-method-option"
                  onClick={() => setSyncMethod(SYNC_METHOD_PLAYWRIGHT)}
                  disabled={syncingStatements || loadingStatements}
                >
                  <MonitorPlay size={15} className="icon-inline" aria-hidden="true" />
                  Playwright method
                </button>
              </div>
              {methodGuide ? (
                <div className="statements-method-hint" role="note" aria-live="polite">
                  <p className="statements-method-hint-summary">
                    <span className="statements-method-hint-badge">Selected</span>
                    <strong>{methodGuide.label}</strong> — {methodGuide.summary}
                  </p>
                  <p className="statements-method-hint-req">{methodGuide.requirement}</p>
                  <p className="statements-method-hint-action">
                    Picking a method only chooses <em>how</em> statements are fetched — it does not
                    start a sync. Set the period below, then click “Sync selected period” or “Sync
                    newest since latest” to run it.
                  </p>
                </div>
              ) : null}
              <div className="statements-period-range">
                <label className="statements-period-field">
                  <span>From timestamp</span>
                  <Input
                    type="datetime-local"
                    value={periodStart}
                    onChange={(event) => setPeriodStart(event.target.value)}
                  />
                </label>
                <label className="statements-period-field">
                  <span>To timestamp</span>
                  <Input
                    type="datetime-local"
                    value={periodEnd}
                    onChange={(event) => setPeriodEnd(event.target.value)}
                  />
                </label>
              </div>
              <div className="kpi-note statements-known-range">
                <span>
                  Oldest in archive:{" "}
                  {statementAnalytics?.oldestEmailDate
                    ? new Date(statementAnalytics.oldestEmailDate).toLocaleString()
                    : "N/A"}
                </span>
                <span>
                  Latest in archive:{" "}
                  {statementAnalytics?.latestEmailDate
                    ? new Date(statementAnalytics.latestEmailDate).toLocaleString()
                    : "N/A"}
                </span>
              </div>
              <div className="button-row">
                <Button
                  onClick={syncStatementsFromGmail}
                  disabled={syncingStatements || loadingStatements}
                >
                  {syncingStatements ? "Syncing..." : "Sync selected period"}
                </Button>
                <Button
                  variant="outline"
                  onClick={syncNewestSinceLatest}
                  disabled={syncingStatements || loadingStatements}
                >
                  Sync newest since latest
                </Button>
                {syncingStatements ? <LoaderCircle size={16} className="spin-inline" aria-hidden="true" /> : null}
              </div>
              <p className="kpi-note">
                Playwright assumption: the target Gmail inbox for RCBC statements is already open/authenticated
                (for example, boaz.sze@gmail.com).
              </p>
              <p className="kpi-note">
                Last sync: {lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : "No sync completed yet"}
              </p>
              {syncSummary ? (
                <p className="kpi-note">
                  Method:{" "}
                  {syncSummary.method === SYNC_METHOD_PLAYWRIGHT
                    ? "Playwright method"
                    : "API method"}
                  {" | "}
                  Last run: scanned {syncSummary.messagesScanned || 0}, downloaded {syncSummary.downloaded || 0},
                  skipped {syncSummary.skipped || 0}, failed {syncSummary.failed || 0}
                  {syncSummary.periodStartUsed
                    ? ` | from ${new Date(syncSummary.periodStartUsed).toLocaleString()}`
                    : ""}
                  {syncSummary.periodEndUsed
                    ? ` | to ${new Date(syncSummary.periodEndUsed).toLocaleString()}`
                    : ""}
                </p>
              ) : null}
              {statementError ? <p className="error">{statementError}</p> : null}
            </section>

            <section className="card fade-up delay-3">
              <div className="section-header">
                <p className="eyebrow">Queue</p>
                <h2>Statements</h2>
              </div>
              {loadingStatements ? (
                <p className="muted">Loading statements...</p>
              ) : !statementItems.length ? (
                <p className="muted">No statements downloaded yet.</p>
              ) : (
                <div className="statements-table-wrap">
                  <table className="statements-table">
                    <thead>
                      <tr>
                        <th>Email Date</th>
                        <th>Filename</th>
                        <th>Status</th>
                        <th>Size</th>
                        <th>Saved Path</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statementItems.map((item) => (
                        <tr key={item.id}>
                          <td>{item.emailDate ? new Date(item.emailDate).toLocaleDateString() : "-"}</td>
                          <td>{item.filename || "-"}</td>
                          <td>
                            <span className={`statement-status status-${item.status || "pending"}`}>
                              {item.status || "pending"}
                            </span>
                          </td>
                          <td>{item.sizeBytes ? `${Math.round(item.sizeBytes / 1024)} KB` : "-"}</td>
                          <td className="statement-path">{item.savedPath || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
    </>
  );
}

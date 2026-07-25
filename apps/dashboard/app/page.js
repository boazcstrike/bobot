"use client";

import { useCallback, useEffect, useState } from "react";
import { CreditCard, Inbox, Wallet } from "lucide-react";

import OverviewTab from "./components/dashboard/overview-tab";
import SpendOverview from "./components/dashboard/spend-overview";
import StatCard from "./components/dashboard/stat-card";
import StatusBanner from "./components/dashboard/status-banner";
import TotalAssets from "./components/dashboard/total-assets";
import TrendingRepos from "./components/dashboard/trending-repos";
import Divider from "@/components/layout/shared/divider";
import { useShell } from "./dashboard-shell";

const RANGE_TO_MONTHS = {
  "Last 12 months": 12,
  "Last 6 months": 6,
};

const PESO = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

const EMPTY_TRENDING = {
  daily: [],
  weekly: [],
  monthly: [],
  source: null,
  snapshotDate: null,
  generatedAt: null,
  stale: false,
};

// Normalize the trending endpoint, which returns a bare array on the legacy
// shape and a keyed snapshot on the current one.
function normalizeTrending(payload) {
  if (Array.isArray(payload)) {
    return { ...EMPTY_TRENDING, daily: payload, weekly: payload, monthly: payload, source: "legacy" };
  }
  return {
    daily: Array.isArray(payload?.daily) ? payload.daily : [],
    weekly: Array.isArray(payload?.weekly) ? payload.weekly : [],
    monthly: Array.isArray(payload?.monthly) ? payload.monthly : [],
    source: typeof payload?.source === "string" ? payload.source : null,
    snapshotDate: typeof payload?.snapshotDate === "string" ? payload.snapshotDate : null,
    generatedAt: typeof payload?.generatedAt === "string" ? payload.generatedAt : null,
    stale: Boolean(payload?.stale),
  };
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`${url} failed (${response.status})`);
  return response.json();
}

export default function Page() {
  const { setPendingStatements } = useShell();

  const [range, setRange] = useState("Last 12 months");
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);
  const [expenses, setExpenses] = useState(null);
  const [statements, setStatements] = useState(null);
  const [trending, setTrending] = useState(EMPTY_TRENDING);

  const loadData = useCallback(async () => {
    setLoading(true);

    // Each panel owns its own failure: one dead endpoint must not blank the page.
    const [expensesResult, statementsResult, trendingResult] = await Promise.allSettled([
      fetchJson("/api/expenses/analytics"),
      fetchJson("/api/credit-card-statements/analytics"),
      fetchJson("/api/trending"),
    ]);

    if (expensesResult.status === "fulfilled") setExpenses(expensesResult.value);
    if (statementsResult.status === "fulfilled") {
      setStatements(statementsResult.value);
      setPendingStatements(statementsResult.value?.totalPending ?? 0);
    }
    if (trendingResult.status === "fulfilled") {
      setTrending(normalizeTrending(trendingResult.value));
    }

    setErrors(
      [expensesResult, statementsResult, trendingResult]
        .filter((result) => result.status === "rejected")
        .map((result) => result.reason?.message ?? "Request failed"),
    );
    setLoading(false);
  }, [setPendingStatements]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalPending = statements?.totalPending ?? 0;
  const totalProcessed = statements?.totalProcessed ?? 0;
  const totalStatements = statements?.totalStatements ?? 0;
  const processedPct = totalStatements
    ? `${Math.round((totalProcessed / totalStatements) * 100)}%`
    : null;

  return (
    <>
      <div className="pb-4">
        <OverviewTab
          range={range}
          onRangeChange={setRange}
          onRefresh={loadData}
          refreshing={loading}
        />
      </div>

      {errors.length > 0 && (
        <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {errors.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      )}

      <div className="grid grid-cols-12 gap-px bg-border p-px">
        <div className="col-span-12">
          <StatusBanner />
        </div>

        <div className="col-span-12">
          <Divider />
        </div>

        <div className="col-span-12 lg:col-span-7">
          <SpendOverview
            analytics={expenses}
            loading={loading}
            monthCount={RANGE_TO_MONTHS[range] ?? 12}
          />
        </div>

        <div className="col-span-12 lg:col-span-5">
          <TotalAssets expenses={expenses} statements={statements} loading={loading} />
        </div>

        <div className="col-span-12">
          <Divider />
        </div>

        <div className="col-span-12 lg:col-span-4">
          <StatCard
            label="Average transaction"
            value={PESO.format(expenses?.totals?.averagePhp ?? 0)}
            icon={Wallet}
            href="/expenses"
            loading={loading}
          />
        </div>

        <div className="col-span-12 lg:col-span-4">
          <StatCard
            label="Statements processed"
            value={totalProcessed.toLocaleString()}
            badge={processedPct}
            badgeTone="positive"
            icon={CreditCard}
            href="/credit-card-statements"
            loading={loading}
          />
        </div>

        <div className="col-span-12 lg:col-span-4">
          <StatCard
            label="Pending imports"
            value={totalPending.toLocaleString()}
            badge={totalPending > 0 ? "Action needed" : undefined}
            badgeTone={totalPending > 0 ? "destructive" : "positive"}
            icon={Inbox}
            href="/credit-card-statements"
            linkLabel="Review queue"
            loading={loading}
          />
        </div>

        <div className="col-span-12">
          <Divider />
        </div>

        <div className="col-span-12">
          <TrendingRepos snapshot={trending} loading={loading} />
        </div>
      </div>
    </>
  );
}

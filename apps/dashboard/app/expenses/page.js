"use client";

import { useEffect, useState } from "react";
import { ChartColumn, CircleDollarSign, House, Shirt, WalletCards } from "lucide-react";

export default function ExpensesPage() {
  const [expenseAnalytics, setExpenseAnalytics] = useState(null);

  useEffect(() => {
    fetch("/api/expenses/analytics", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setExpenseAnalytics(data))
      .catch(() => null);
  }, []);

  const totals = expenseAnalytics?.totals;
  const yearsCovered =
    totals?.firstYear && totals?.lastYear ? `${totals.firstYear}-${totals.lastYear}` : "-";
  const categories = (expenseAnalytics?.categories || []).slice(0, 12);
  const brands = (expenseAnalytics?.brands || []).slice(0, 12);

  return (
    <main className="dashboard expenses-dashboard-page">
      <div className="mesh-bg" aria-hidden="true" />

      <section className="hero card fade-up expenses-hero">
        <nav className="section-nav expenses-context-nav" aria-label="Expenses dashboard navigation">
          <a href="/">
            <House size={14} className="icon-inline" /> Back to hub
          </a>
          {" | "}
          <a href="/laundry">
            <Shirt size={14} className="icon-inline" /> Open laundry dashboard
          </a>
        </nav>
        <h1>
          <WalletCards size={20} className="icon-inline" /> Expense Tracker
        </h1>
        <p>Dedicated analytics view for assets and expenses data.</p>
        <p className="expenses-source-link">
          <CircleDollarSign size={14} className="icon-inline" /> Source file:{" "}
          <a href="/api/expenses/source" target="_blank" rel="noreferrer">
            Assets and Expenses 2012-2024 - OUT.csv
          </a>
        </p>
      </section>

      <section className="card fade-up delay-1 expenses-kpi-block">
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
    </main>
  );
}

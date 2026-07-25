"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { House, WalletCards } from "lucide-react";

import type { ExpenseDashboardData, NormalizedExpenseRecord } from "@/lib/expense-dashboard/types";
import {
  getCategoryTotals,
  getCategoryVolatility,
  getDataQualitySummary,
  getMerchantTotals,
  getMonthOverMonthChanges,
  getMonthlyCategoryTotals,
  getMonthlyTotals,
  getTopCategories,
  getTopCategoryPerMonth,
  getYearOverYearChanges,
  getYearlyCategoryTotals,
  getYearlyTotals,
} from "@/lib/expense-dashboard/aggregations";
import { linearRegressionForecast, movingAverageForecast, scenarioForecast } from "@/lib/expense-dashboard/forecasting";
import { getWordFrequency } from "@/lib/expense-dashboard/word-frequency";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { CategoryRankingByYear } from "./CategoryRankingByYear";
import { CategorySpendBreakdownChart } from "./CategorySpendBreakdownChart";
import { CategoryTrendChart } from "./CategoryTrendChart";
import { CategoryVolatilityTable } from "./CategoryVolatilityTable";
import { DataQualityPanel } from "./DataQualityPanel";
import { ExpenseKpiCards } from "./ExpenseKpiCards";
import { FiveYearForecastChart } from "./FiveYearForecastChart";
import { ForecastExplanationPanel } from "./ForecastExplanationPanel";
import { ForecastScenariosChart } from "./ForecastScenariosChart";
import { FrequentPurchasesTable } from "./FrequentPurchasesTable";
import { MonthOverMonthChangeChart } from "./MonthOverMonthChangeChart";
import { MonthlyCategoryStackedBarChart } from "./MonthlyCategoryStackedBarChart";
import { MonthlyExpenseBarChart } from "./MonthlyExpenseBarChart";
import { MonthlyExpenseHeatmap } from "./MonthlyExpenseHeatmap";
import { MonthlyExpenseTrendChart } from "./MonthlyExpenseTrendChart";
import { TopCategoriesChart } from "./TopCategoriesChart";
import { TopCategoryPerMonthChart } from "./TopCategoryPerMonthChart";
import { TopCategoryPerMonthTable } from "./TopCategoryPerMonthTable";
import { TopMerchantsChart } from "./TopMerchantsChart";
import { WordCloudPanel } from "./WordCloudPanel";
import { YearComparisonView } from "./YearComparisonView";
import { YearOverYearGrowthChart } from "./YearOverYearGrowthChart";
import { YearlyCategoryStackedBarChart } from "./YearlyCategoryStackedBarChart";
import { YearlyExpenseTrendChart } from "./YearlyExpenseTrendChart";

function applyFilters(
  records: NormalizedExpenseRecord[],
  filters: { year: string; category: string; startMonth: string; endMonth: string },
) {
  return records.filter((record) => {
    if (filters.year !== "all" && String(record.year) !== filters.year) return false;
    if (filters.category !== "all" && record.category !== filters.category) return false;
    if (filters.startMonth !== "all" && (!record.dateKey || record.dateKey < filters.startMonth)) return false;
    if (filters.endMonth !== "all" && (!record.dateKey || record.dateKey > filters.endMonth)) return false;
    return true;
  });
}

export function ExpenseDashboard({ data }: { data: ExpenseDashboardData }) {
  const monthOptions = data.monthlyTotals.map((item) => item.dateKey);
  const [year, setYear] = useState("all");
  const [category, setCategory] = useState("all");
  const [startMonth, setStartMonth] = useState("all");
  const [endMonth, setEndMonth] = useState("all");
  const [topN, setTopN] = useState("10");

  const filtered = useMemo(
    () => applyFilters(data.records, { year, category, startMonth, endMonth }),
    [category, data.records, endMonth, startMonth, year],
  );

  const analytics = useMemo(() => {
    const yearlyTotals = getYearlyTotals(filtered);
    return {
      dataQuality: getDataQualitySummary(filtered),
      monthlyTotals: getMonthlyTotals(filtered),
      yearlyTotals,
      categoryTotals: getCategoryTotals(filtered),
      topCategories: getTopCategories(filtered, Number(topN)),
      topCategoryPerMonth: getTopCategoryPerMonth(filtered),
      monthlyCategoryTotals: getMonthlyCategoryTotals(filtered),
      yearlyCategoryTotals: getYearlyCategoryTotals(filtered),
      monthOverMonthChanges: getMonthOverMonthChanges(filtered),
      yearOverYearChanges: getYearOverYearChanges(filtered),
      categoryVolatility: getCategoryVolatility(filtered),
      merchantTotals: getMerchantTotals(filtered),
      frequentPurchaseTerms: getWordFrequency(filtered).slice(0, 60),
      regressionForecast: linearRegressionForecast(yearlyTotals),
      movingAverageForecast: movingAverageForecast(yearlyTotals),
      forecastScenarios: scenarioForecast(yearlyTotals),
    };
  }, [filtered, topN]);

  const activeCategories = analytics.topCategories.map((item) => item.category);

  return (
    <div className="grid gap-5">
      <Card className="border border-border/80 bg-card/95 shadow-sm">
        <CardContent className="grid gap-4 p-4 sm:p-5">
          <nav className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground" aria-label="Expense dashboard navigation">
            <Link href="/" className="inline-flex items-center gap-1.5 hover:text-foreground">
              <House className="size-4" aria-hidden="true" />
              Back to hub
            </Link>
            <Link href="/expenses" className="inline-flex items-center gap-1.5 hover:text-foreground">
              <WalletCards className="size-4" aria-hidden="true" />
              Legacy expense tracker
            </Link>
          </nav>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Expense Analytics</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-normal">Expense Dashboard</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Historical CSV analytics with dirty-data visibility, category and merchant analysis, recurring word patterns, and five-year forecasts.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-5">
            <FilterSelect label="Year" value={year} onChange={setYear} options={["all", ...data.years.map(String)]} />
            <FilterSelect label="Category" value={category} onChange={setCategory} options={["all", ...data.categories]} />
            <FilterSelect label="Start Month" value={startMonth} onChange={setStartMonth} options={["all", ...monthOptions]} />
            <FilterSelect label="End Month" value={endMonth} onChange={setEndMonth} options={["all", ...monthOptions]} />
            <FilterSelect label="Top N" value={topN} onChange={setTopN} options={["5", "10", "15", "20"]} />
          </div>
          <div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setYear("all");
                setCategory("all");
                setStartMonth("all");
                setEndMonth("all");
                setTopN("10");
              }}
            >
              Reset filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <ExpenseKpiCards records={filtered} monthlyTotals={analytics.monthlyTotals} yearlyTotals={analytics.yearlyTotals} dataQuality={analytics.dataQuality} />
      <DataQualityPanel summary={data.dataQuality} />

      <section className="grid gap-4 xl:grid-cols-2">
        <MonthlyExpenseTrendChart data={analytics.monthlyTotals} />
        <MonthlyExpenseBarChart data={analytics.monthlyTotals} />
      </section>
      <MonthlyExpenseHeatmap data={analytics.monthlyTotals} />
      <MonthOverMonthChangeChart data={analytics.monthOverMonthChanges} />

      <section className="grid gap-4 xl:grid-cols-2">
        <CategorySpendBreakdownChart data={analytics.categoryTotals} />
        <TopCategoriesChart data={analytics.topCategories} />
      </section>
      <MonthlyCategoryStackedBarChart data={analytics.monthlyCategoryTotals} categories={activeCategories} />
      <section className="grid gap-4 xl:grid-cols-2">
        <TopCategoryPerMonthChart data={analytics.topCategoryPerMonth} />
        <TopCategoryPerMonthTable data={analytics.topCategoryPerMonth} />
      </section>
      <CategoryTrendChart data={analytics.monthlyCategoryTotals} categories={activeCategories} />
      <section className="grid gap-4 xl:grid-cols-2">
        <CategoryVolatilityTable data={analytics.categoryVolatility} />
        <CategoryRankingByYear data={analytics.yearlyCategoryTotals} years={analytics.yearlyTotals.map((item) => item.year)} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <YearlyExpenseTrendChart data={analytics.yearlyTotals} />
        <YearOverYearGrowthChart data={analytics.yearOverYearChanges} />
      </section>
      <YearlyCategoryStackedBarChart data={analytics.yearlyCategoryTotals} categories={activeCategories} />
      <YearComparisonView records={filtered} yearlyTotals={analytics.yearlyTotals} merchantTotals={analytics.merchantTotals} years={analytics.yearlyTotals.map((item) => item.year)} />

      <section className="grid gap-4 xl:grid-cols-2">
        <TopMerchantsChart data={analytics.merchantTotals} />
        <FrequentPurchasesTable data={analytics.merchantTotals} />
      </section>
      <WordCloudPanel data={analytics.frequentPurchaseTerms} />

      <section className="grid gap-4 xl:grid-cols-2">
        <FiveYearForecastChart data={analytics.regressionForecast} />
        <ForecastScenariosChart data={analytics.forecastScenarios} />
      </section>
      <ForecastExplanationPanel />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={(next) => next && onChange(next)}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {option === "all" ? "All" : option}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </label>
  );
}

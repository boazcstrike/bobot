"use client";

import type { NormalizedExpenseRecord, MonthlyTotal, YearlyTotal, DataQualitySummary } from "@/lib/expense-dashboard";
import { formatPeso, MetricGrid } from "./shared";

export function ExpenseKpiCards({
  records,
  monthlyTotals,
  yearlyTotals,
  dataQuality,
}: {
  records: NormalizedExpenseRecord[];
  monthlyTotals: MonthlyTotal[];
  yearlyTotals: YearlyTotal[];
  dataQuality: DataQualitySummary;
}) {
  const total = records.reduce((sum, record) => sum + (record.isValidAmount && record.php ? record.php : 0), 0);
  const highestMonth = [...monthlyTotals].sort((a, b) => b.totalPhp - a.totalPhp)[0];
  const highestYear = [...yearlyTotals].sort((a, b) => b.totalPhp - a.totalPhp)[0];
  const averageMonthly = monthlyTotals.length ? total / monthlyTotals.length : 0;
  const averageYearly = yearlyTotals.length ? total / yearlyTotals.length : 0;

  return (
    <MetricGrid
      stats={[
        { label: "Total Lifetime Spend", value: formatPeso(total), hint: "Valid PHP rows only" },
        { label: "Average Monthly Spend", value: formatPeso(averageMonthly), hint: `${monthlyTotals.length} valid months` },
        { label: "Average Yearly Spend", value: formatPeso(averageYearly), hint: `${yearlyTotals.length} valid years` },
        { label: "Highest Spending Month", value: highestMonth ? formatPeso(highestMonth.totalPhp) : "-", hint: highestMonth?.dateKey },
        { label: "Highest Spending Year", value: highestYear ? formatPeso(highestYear.totalPhp) : "-", hint: highestYear ? String(highestYear.year) : undefined },
        { label: "Rows Processed", value: dataQuality.totalRows, hint: "Raw CSV rows" },
        { label: "Rows Excluded", value: dataQuality.rowsExcludedFromTimeSeries, hint: "Invalid amount or date", tone: "warning" },
        { label: "Missing Categories", value: dataQuality.missingCategoryRows, hint: "Included as Uncategorized", tone: "warning" },
      ]}
    />
  );
}

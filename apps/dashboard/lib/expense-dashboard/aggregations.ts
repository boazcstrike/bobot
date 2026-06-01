import type {
  CategoryTotal,
  CategoryVolatility,
  ChangePoint,
  DataQualitySummary,
  MerchantTotal,
  MonthlyTotal,
  NormalizedExpenseRecord,
  TopCategoryPerMonth,
  YearlyTotal,
} from "./types";
import { roundCurrency, roundPct } from "./formatters";
import { getWordFrequency } from "./word-frequency";

const ISSUE_KEYS = [
  "missing_year",
  "missing_month",
  "invalid_month",
  "missing_php",
  "invalid_php",
  "missing_category",
] as const;

function validAmountRows(records: NormalizedExpenseRecord[]) {
  return records.filter((record) => record.isValidAmount && record.php !== null);
}

function validTimeSeriesRows(records: NormalizedExpenseRecord[]) {
  return records.filter((record) => record.isValidAmount && record.isValidDate && record.php !== null && record.dateKey);
}

function sortByTotalThenName<T extends { totalPhp: number }>(
  items: T[],
  getName: (item: T) => string,
) {
  return [...items].sort((a, b) => b.totalPhp - a.totalPhp || getName(a).localeCompare(getName(b)));
}

export function getMonthlyTotals(records: NormalizedExpenseRecord[]): MonthlyTotal[] {
  const buckets = new Map<string, MonthlyTotal>();

  for (const record of validTimeSeriesRows(records)) {
    const dateKey = record.dateKey as string;
    const existing =
      buckets.get(dateKey) ??
      ({
        dateKey,
        year: record.year as number,
        month: record.month as number,
        totalPhp: 0,
        transactionCount: 0,
      } satisfies MonthlyTotal);

    existing.totalPhp += record.php as number;
    existing.transactionCount += 1;
    buckets.set(dateKey, existing);
  }

  return [...buckets.values()]
    .map((item) => ({ ...item, totalPhp: roundCurrency(item.totalPhp) }))
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
}

export function getYearlyTotals(records: NormalizedExpenseRecord[]): YearlyTotal[] {
  const buckets = new Map<number, YearlyTotal>();

  for (const record of validTimeSeriesRows(records)) {
    const year = record.year as number;
    const existing =
      buckets.get(year) ??
      ({
        year,
        totalPhp: 0,
        transactionCount: 0,
      } satisfies YearlyTotal);

    existing.totalPhp += record.php as number;
    existing.transactionCount += 1;
    buckets.set(year, existing);
  }

  return [...buckets.values()]
    .map((item) => ({ ...item, totalPhp: roundCurrency(item.totalPhp) }))
    .sort((a, b) => a.year - b.year);
}

export function getCategoryTotals(records: NormalizedExpenseRecord[]): CategoryTotal[] {
  const buckets = new Map<string, { category: string; totalPhp: number; transactionCount: number }>();
  let grandTotal = 0;

  for (const record of validAmountRows(records)) {
    const existing =
      buckets.get(record.category) ??
      ({
        category: record.category,
        totalPhp: 0,
        transactionCount: 0,
      });
    existing.totalPhp += record.php as number;
    existing.transactionCount += 1;
    grandTotal += record.php as number;
    buckets.set(record.category, existing);
  }

  return sortByTotalThenName(
    [...buckets.values()].map((item) => ({
      ...item,
      totalPhp: roundCurrency(item.totalPhp),
      sharePct: grandTotal ? roundPct((item.totalPhp / grandTotal) * 100) : 0,
    })),
    (item) => item.category,
  );
}

export function getTopCategories(records: NormalizedExpenseRecord[], limit = 10) {
  return getCategoryTotals(records).slice(0, limit);
}

export function getMonthlyCategoryTotals(records: NormalizedExpenseRecord[]) {
  const buckets = new Map<string, Map<string, number>>();

  for (const record of validTimeSeriesRows(records)) {
    const dateKey = record.dateKey as string;
    const categoryTotals = buckets.get(dateKey) ?? new Map<string, number>();
    categoryTotals.set(record.category, (categoryTotals.get(record.category) ?? 0) + (record.php as number));
    buckets.set(dateKey, categoryTotals);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, categoryTotals]) => {
      const row: Record<string, string | number> = { dateKey };
      [...categoryTotals.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([category, total]) => {
          row[category] = roundCurrency(total);
        });
      return row;
    });
}

export function getYearlyCategoryTotals(records: NormalizedExpenseRecord[]) {
  const buckets = new Map<number, Map<string, number>>();

  for (const record of validTimeSeriesRows(records)) {
    const year = record.year as number;
    const categoryTotals = buckets.get(year) ?? new Map<string, number>();
    categoryTotals.set(record.category, (categoryTotals.get(record.category) ?? 0) + (record.php as number));
    buckets.set(year, categoryTotals);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a - b)
    .map(([year, categoryTotals]) => {
      const row: Record<string, string | number> = { year };
      [...categoryTotals.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([category, total]) => {
          row[category] = roundCurrency(total);
        });
      return row;
    });
}

export function getTopCategoryPerMonth(records: NormalizedExpenseRecord[]): TopCategoryPerMonth[] {
  return getMonthlyCategoryTotals(records).map((row) => {
    const dateKey = String(row.dateKey);
    const entries = Object.entries(row)
      .filter(([key]) => key !== "dateKey")
      .map(([category, value]) => [category, Number(value)] as const);
    const monthTotal = entries.reduce((sum, [, value]) => sum + value, 0);
    const [category = "Uncategorized", amount = 0] =
      entries.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0] ?? [];
    return {
      dateKey,
      category,
      amount: roundCurrency(amount),
      monthTotal: roundCurrency(monthTotal),
      percentageOfMonthTotal: monthTotal ? roundPct((amount / monthTotal) * 100) : 0,
    };
  });
}

function getChanges<T extends { totalPhp: number }>(
  items: T[],
  getKey: (item: T) => string,
): ChangePoint[] {
  return items.map((item, index) => {
    const previous = index > 0 ? items[index - 1] : null;
    const absoluteChange = previous ? roundCurrency(item.totalPhp - previous.totalPhp) : null;
    return {
      key: getKey(item),
      previousKey: previous ? getKey(previous) : null,
      totalPhp: item.totalPhp,
      absoluteChange,
      percentageChange:
        previous && previous.totalPhp
          ? roundPct(((item.totalPhp - previous.totalPhp) / previous.totalPhp) * 100)
          : null,
    };
  });
}

export function getMonthOverMonthChanges(records: NormalizedExpenseRecord[]) {
  return getChanges(getMonthlyTotals(records), (item) => item.dateKey);
}

export function getYearOverYearChanges(records: NormalizedExpenseRecord[]) {
  return getChanges(getYearlyTotals(records), (item) => String(item.year));
}

export function getCategoryVolatility(records: NormalizedExpenseRecord[]): CategoryVolatility[] {
  const monthlyRows = getMonthlyCategoryTotals(records);
  const categories = [...new Set(monthlyRows.flatMap((row) => Object.keys(row).filter((key) => key !== "dateKey")))];

  return categories
    .map((category) => {
      const values = monthlyRows.map((row) => Number(row[category] ?? 0));
      const average = values.reduce((sum, value) => sum + value, 0) / (values.length || 1);
      const variance =
        values.reduce((sum, value) => sum + (value - average) ** 2, 0) / (values.length || 1);
      const range = values.length ? Math.max(...values) - Math.min(...values) : 0;
      return {
        category,
        variance: roundCurrency(variance),
        standardDeviation: roundCurrency(Math.sqrt(variance)),
        range: roundCurrency(range),
        averageMonthlySpend: roundCurrency(average),
      };
    })
    .sort((a, b) => b.standardDeviation - a.standardDeviation || a.category.localeCompare(b.category));
}

export function getMerchantTotals(records: NormalizedExpenseRecord[]): MerchantTotal[] {
  const buckets = new Map<string, MerchantTotal>();

  for (const record of validAmountRows(records)) {
    const existing =
      buckets.get(record.brandShop) ??
      ({
        merchant: record.brandShop,
        totalPhp: 0,
        transactionCount: 0,
      } satisfies MerchantTotal);
    existing.totalPhp += record.php as number;
    existing.transactionCount += 1;
    buckets.set(record.brandShop, existing);
  }

  return sortByTotalThenName(
    [...buckets.values()].map((item) => ({ ...item, totalPhp: roundCurrency(item.totalPhp) })),
    (item) => item.merchant,
  );
}

export function getFrequentPurchaseTerms(records: NormalizedExpenseRecord[], limit = 40) {
  return getWordFrequency(records).slice(0, limit);
}

export function getDataQualitySummary(records: NormalizedExpenseRecord[]): DataQualitySummary {
  const issueCounts = ISSUE_KEYS.reduce(
    (counts, issue) => ({ ...counts, [issue]: 0 }),
    {} as DataQualitySummary["issueCounts"],
  );

  for (const record of records) {
    for (const issue of record.issues) {
      issueCounts[issue] += 1;
    }
  }

  const invalidAmountRows = records.filter((record) => !record.isValidAmount).length;
  const invalidDateRows = records.filter((record) => !record.isValidDate).length;

  return {
    totalRows: records.length,
    validRows: records.filter((record) => record.isValidAmount && record.isValidDate).length,
    invalidAmountRows,
    invalidDateRows,
    missingCategoryRows: issueCounts.missing_category,
    invalidMonthRows: issueCounts.invalid_month,
    rowsExcludedFromFinancialTotals: invalidAmountRows,
    rowsExcludedFromTimeSeries: records.filter((record) => !record.isValidAmount || !record.isValidDate).length,
    issueCounts,
  };
}

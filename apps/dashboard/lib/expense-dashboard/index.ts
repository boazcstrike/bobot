import { getExpenseTrackerPath, loadExpenseRows } from "./parse-expenses";
import { normalizeExpenses } from "./normalize-expenses";
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
} from "./aggregations";
import { linearRegressionForecast, movingAverageForecast, scenarioForecast } from "./forecasting";
import { getWordFrequency } from "./word-frequency";

export * from "./aggregations";
export * from "./forecasting";
export * from "./formatters";
export * from "./normalize-expenses";
export * from "./parse-expenses";
export * from "./types";
export * from "./validation";
export * from "./word-frequency";

export function loadExpenseDashboardData() {
  const records = normalizeExpenses(loadExpenseRows());
  const yearlyTotals = getYearlyTotals(records);
  const categoryTotals = getCategoryTotals(records);

  return {
    sourcePath: getExpenseTrackerPath(),
    records,
    dataQuality: getDataQualitySummary(records),
    monthlyTotals: getMonthlyTotals(records),
    yearlyTotals,
    categoryTotals,
    topCategories: getTopCategories(records, 12),
    topCategoryPerMonth: getTopCategoryPerMonth(records),
    monthlyCategoryTotals: getMonthlyCategoryTotals(records),
    yearlyCategoryTotals: getYearlyCategoryTotals(records),
    monthOverMonthChanges: getMonthOverMonthChanges(records),
    yearOverYearChanges: getYearOverYearChanges(records),
    categoryVolatility: getCategoryVolatility(records),
    merchantTotals: getMerchantTotals(records),
    frequentPurchaseTerms: getWordFrequency(records).slice(0, 60),
    regressionForecast: linearRegressionForecast(yearlyTotals),
    movingAverageForecast: movingAverageForecast(yearlyTotals),
    forecastScenarios: scenarioForecast(yearlyTotals),
    categories: categoryTotals.map((item) => item.category),
    years: yearlyTotals.map((item) => item.year),
  };
}

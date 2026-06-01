import type { ForecastPoint, ForecastScenarioPoint, NormalizedExpenseRecord, YearlyTotal } from "./types";
import { getYearlyTotals } from "./aggregations";
import { roundCurrency } from "./formatters";

type ForecastInput = NormalizedExpenseRecord[] | YearlyTotal[];

function clampGrowth(value: number) {
  return Math.max(-0.15, Math.min(0.15, value));
}

function toYearlyTotals(input: ForecastInput): YearlyTotal[] {
  if (!input.length) return [];
  if ("totalPhp" in input[0]) return input as YearlyTotal[];
  return getYearlyTotals(input as NormalizedExpenseRecord[]);
}

export function linearRegressionForecast(input: ForecastInput, yearsAhead = 5): ForecastPoint[] {
  const yearlyTotals = toYearlyTotals(input);
  if (!yearlyTotals.length) return [];
  const points = yearlyTotals.map((item, index) => ({ x: index, y: item.totalPhp }));
  const n = points.length;
  const sumX = points.reduce((sum, point) => sum + point.x, 0);
  const sumY = points.reduce((sum, point) => sum + point.y, 0);
  const sumXY = points.reduce((sum, point) => sum + point.x * point.y, 0);
  const sumXX = points.reduce((sum, point) => sum + point.x * point.x, 0);
  const denominator = n * sumXX - sumX * sumX;
  const slope = denominator ? (n * sumXY - sumX * sumY) / denominator : 0;
  const intercept = (sumY - slope * sumX) / n;
  const lastYear = yearlyTotals[yearlyTotals.length - 1].year;

  return Array.from({ length: yearsAhead }, (_, index) => {
    const x = points.length + index;
    return {
      year: lastYear + index + 1,
      projectedPhp: roundCurrency(Math.max(0, intercept + slope * x)),
    };
  });
}

export function movingAverageForecast(input: ForecastInput, yearsAhead = 5, windowSize = 3): ForecastPoint[] {
  const yearlyTotals = toYearlyTotals(input);
  if (!yearlyTotals.length) return [];
  const lastYear = yearlyTotals[yearlyTotals.length - 1].year;
  const values = yearlyTotals.slice(-windowSize).map((item) => item.totalPhp);
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Array.from({ length: yearsAhead }, (_, index) => ({
    year: lastYear + index + 1,
    projectedPhp: roundCurrency(average),
  }));
}

export function scenarioForecast(input: ForecastInput, yearsAhead = 5): ForecastScenarioPoint[] {
  const yearlyTotals = toYearlyTotals(input);
  if (!yearlyTotals.length) return [];
  const regression = linearRegressionForecast(yearlyTotals, yearsAhead);
  const last = yearlyTotals[yearlyTotals.length - 1];
  const first = yearlyTotals[0];
  const periods = Math.max(1, yearlyTotals.length - 1);
  const rawCagr = first.totalPhp > 0 ? (last.totalPhp / first.totalPhp) ** (1 / periods) - 1 : 0;
  const cagr = clampGrowth(rawCagr);
  const lowGrowth = Math.min(0.03, Math.max(-0.05, cagr * 0.4));
  const highGrowth = Math.max(0.04, cagr);

  return regression.map((point, index) => ({
    year: point.year,
    low: roundCurrency(Math.max(0, last.totalPhp * (1 + lowGrowth) ** (index + 1))),
    base: point.projectedPhp,
    high: roundCurrency(Math.max(0, last.totalPhp * (1 + highGrowth) ** (index + 1))),
  }));
}

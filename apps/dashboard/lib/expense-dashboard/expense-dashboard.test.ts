import { describe, expect, test } from "vitest";

import {
  getDataQualitySummary,
  getMonthlyTotals,
  getTopCategoryPerMonth,
  getWordFrequency,
  getYearOverYearChanges,
  getYearlyTotals,
  linearRegressionForecast,
  movingAverageForecast,
  normalizeExpenses,
  parseCsvLine,
  parseExpenseCsv,
  scenarioForecast,
} from "./index";

const rawRows = [
  {
    id: "1",
    year: "2024",
    month: "1",
    day: "3",
    category: "Food",
    brand_shop: "Cafe One",
    description: "Coffee breakfast",
    php: "1,000.50",
  },
  {
    id: "2",
    year: "2024",
    month: "1",
    day: "4",
    category: "",
    brand_shop: "",
    description: "Coffee lunch",
    php: "500",
  },
  {
    id: "3",
    year: "2025",
    month: "2",
    day: "5",
    category: "Travel",
    brand_shop: "Airline",
    description: "Annual trip ticket",
    php: "3000",
  },
  {
    id: "4",
    year: "",
    month: "0",
    day: "0",
    category: "Gas",
    brand_shop: "Shell",
    description: "Fuel",
    php: "",
  },
];

describe("expense dashboard data layer", () => {
  test("parses quoted CSV values with commas", () => {
    expect(parseCsvLine('1,"5,000.00",travel')).toEqual(["1", "5,000.00", "travel"]);
    const parsed = parseExpenseCsv("year,month,php\n2024,1,\"5,000.00\"");
    expect(parsed[0].php).toBe("5,000.00");
  });

  test("normalizes missing category, invalid month, and missing PHP", () => {
    const records = normalizeExpenses(rawRows);
    expect(records[1].category).toBe("Uncategorized");
    expect(records[1].brandShop).toBe("Unknown Merchant");
    expect(records[3].issues).toEqual(
      expect.arrayContaining(["missing_year", "invalid_month", "missing_php"]),
    );
    expect(records[3].isValidAmount).toBe(false);
    expect(records[3].isValidDate).toBe(false);
  });

  test("computes monthly and yearly totals from valid amount and date rows", () => {
    const records = normalizeExpenses(rawRows);
    expect(getMonthlyTotals(records)).toEqual([
      { dateKey: "2024-01", year: 2024, month: 1, totalPhp: 1500.5, transactionCount: 2 },
      { dateKey: "2025-02", year: 2025, month: 2, totalPhp: 3000, transactionCount: 1 },
    ]);
    expect(getYearlyTotals(records)).toEqual([
      { year: 2024, totalPhp: 1500.5, transactionCount: 2 },
      { year: 2025, totalPhp: 3000, transactionCount: 1 },
    ]);
  });

  test("computes top category per month and year-over-year change", () => {
    const records = normalizeExpenses(rawRows);
    expect(getTopCategoryPerMonth(records)[0]).toMatchObject({
      dateKey: "2024-01",
      category: "Food",
      amount: 1000.5,
    });
    expect(getYearOverYearChanges(records)[1]).toMatchObject({
      key: "2025",
      previousKey: "2024",
      absoluteChange: 1499.5,
      percentageChange: 99.93,
    });
  });

  test("extracts frequent words from descriptions and merchants", () => {
    const words = getWordFrequency(normalizeExpenses(rawRows));
    expect(words.find((item) => item.word === "coffee")?.frequency).toBe(2);
    expect(words.some((item) => item.word === "php")).toBe(false);
  });

  test("summarizes data quality without dropping dirty rows", () => {
    const summary = getDataQualitySummary(normalizeExpenses(rawRows));
    expect(summary.totalRows).toBe(4);
    expect(summary.invalidAmountRows).toBe(1);
    expect(summary.invalidDateRows).toBe(1);
    expect(summary.missingCategoryRows).toBe(1);
    expect(summary.invalidMonthRows).toBe(1);
  });

  test("forecasts future yearly expense scenarios", () => {
    const yearly = getYearlyTotals(normalizeExpenses(rawRows));
    expect(linearRegressionForecast(yearly, 2)).toHaveLength(2);
    expect(movingAverageForecast(yearly, 2)[0].year).toBe(2026);
    expect(scenarioForecast(yearly, 2)[0]).toEqual(
      expect.objectContaining({ year: 2026, low: expect.any(Number), base: expect.any(Number), high: expect.any(Number) }),
    );
  });
});

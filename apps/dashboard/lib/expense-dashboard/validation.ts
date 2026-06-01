import type { ExpenseDataIssue } from "./types";

export function isBlank(value: unknown) {
  return value === null || value === undefined || String(value).trim() === "";
}

export function parseNumeric(value: unknown): number | null {
  if (isBlank(value)) return null;
  const cleaned = String(value).replace(/,/g, "").trim();
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseInteger(value: unknown): number | null {
  const numeric = parseNumeric(value);
  if (numeric === null) return null;
  return Number.isInteger(numeric) ? numeric : Math.trunc(numeric);
}

export function validateMonth(value: unknown): {
  month: number | null;
  issue: Extract<ExpenseDataIssue, "missing_month" | "invalid_month"> | null;
} {
  if (isBlank(value)) return { month: null, issue: "missing_month" };
  const month = parseInteger(value);
  if (month === null || month < 1 || month > 12) {
    return { month: month ?? null, issue: "invalid_month" };
  }
  return { month, issue: null };
}

export function toDateKey(year: number | null, month: number | null) {
  if (!year || !month || month < 1 || month > 12) return null;
  return `${year}-${String(month).padStart(2, "0")}`;
}

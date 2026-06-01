import type { ExpenseDataIssue, NormalizedExpenseRecord, RawExpenseRecord } from "./types";
import { isBlank, parseInteger, parseNumeric, toDateKey, validateMonth } from "./validation";

function normalizeText(value: unknown, fallback: string) {
  const text = String(value ?? "").trim();
  return text || fallback;
}

export function normalizeExpenseRecord(
  raw: RawExpenseRecord,
  index: number,
): NormalizedExpenseRecord {
  const issues: ExpenseDataIssue[] = [];
  const year = isBlank(raw.year) ? null : parseInteger(raw.year);
  if (!year) issues.push("missing_year");

  const { month, issue: monthIssue } = validateMonth(raw.month);
  if (monthIssue) issues.push(monthIssue);

  const day = isBlank(raw.day) ? null : parseInteger(raw.day);
  const categoryMissing = isBlank(raw.category);
  if (categoryMissing) issues.push("missing_category");

  let php: number | null = null;
  if (isBlank(raw.php)) {
    issues.push("missing_php");
  } else {
    php = parseNumeric(raw.php);
    if (php === null) issues.push("invalid_php");
  }

  const dateKey = toDateKey(year, month);

  return {
    id: String(raw.id ?? `row-${index + 1}`),
    year,
    month: month && month >= 1 && month <= 12 ? month : null,
    day,
    dateKey,
    category: categoryMissing ? "Uncategorized" : normalizeText(raw.category, "Uncategorized"),
    brandShop: normalizeText(raw.brand_shop, "Unknown Merchant"),
    description: normalizeText(raw.description, ""),
    php,
    isValidAmount: php !== null && Number.isFinite(php),
    isValidDate: dateKey !== null,
    issues,
  };
}

export function normalizeExpenses(rows: RawExpenseRecord[]) {
  return rows.map((row, index) => normalizeExpenseRecord(row, index));
}

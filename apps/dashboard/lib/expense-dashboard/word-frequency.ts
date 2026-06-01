import type { NormalizedExpenseRecord, WordFrequency } from "./types";
import { roundCurrency } from "./formatters";

const STOP_WORDS = new Set([
  "and",
  "the",
  "for",
  "with",
  "from",
  "php",
  "peso",
  "pesos",
  "usd",
  "hkd",
  "sgd",
  "eur",
  "jpy",
  "card",
  "payment",
  "purchase",
]);

export function getWordFrequency(records: NormalizedExpenseRecord[]): WordFrequency[] {
  const buckets = new Map<string, { word: string; frequency: number; totalSpend: number }>();

  for (const record of records) {
    const source = `${record.description} ${record.brandShop}`.toLowerCase();
    const words = source
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .map((word) => word.replace(/^-+|-+$/g, ""))
      .filter((word) => word.length >= 3 && !/^\d+$/.test(word) && !STOP_WORDS.has(word));

    for (const word of words) {
      const existing = buckets.get(word) ?? { word, frequency: 0, totalSpend: 0 };
      existing.frequency += 1;
      existing.totalSpend += record.isValidAmount && record.php ? record.php : 0;
      buckets.set(word, existing);
    }
  }

  return [...buckets.values()]
    .map((item) => ({
      ...item,
      totalSpend: roundCurrency(item.totalSpend),
      weight: roundCurrency(item.frequency * Math.max(1, Math.log10(item.totalSpend + 10))),
    }))
    .sort((a, b) => b.frequency - a.frequency || b.totalSpend - a.totalSpend || a.word.localeCompare(b.word));
}

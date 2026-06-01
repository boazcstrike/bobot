import fs from "node:fs";
import path from "node:path";

import type { RawExpenseRecord } from "./types";

export function getExpenseTrackerPath() {
  return path.resolve(process.cwd(), "..", "..", "data", "Assets and Expenses 2012-2024 - OUT.csv");
}

export function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

export function parseExpenseCsv(contents: string): RawExpenseRecord[] {
  const lines = contents.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (!lines.length) return [];

  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return headers.reduce<RawExpenseRecord>((row, header, index) => {
      row[header] = values[index] ?? "";
      return row;
    }, {});
  });
}

export function loadExpenseRows() {
  return parseExpenseCsv(fs.readFileSync(getExpenseTrackerPath(), "utf8"));
}

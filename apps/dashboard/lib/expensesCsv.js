import fs from "fs";
import path from "path";

const CATEGORY_MAP = {
  groceries: "grocery",
  grocery: "grocery",
  food: "food",
  gas: "gas",
  parking: "parking",
  travel: "travel",
  office: "office",
  music: "music",
  accessories: "accessories",
  phone: "phone",
  shoes: "shoes",
  sports: "sports",
};

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
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

function toNumber(value) {
  if (value === undefined || value === null) return 0;
  const cleaned = String(value).replace(/,/g, "").trim();
  if (!cleaned) return 0;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeCategory(rawCategory) {
  const normalized = String(rawCategory || "").trim().toLowerCase();
  if (!normalized) return "uncategorized";
  return CATEGORY_MAP[normalized] || normalized;
}

function buildDate(year, month, day) {
  const y = toNumber(year);
  if (!y) return null;

  const m = toNumber(month);
  const d = toNumber(day);
  if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
    return new Date(Date.UTC(y, m - 1, d));
  }
  return new Date(Date.UTC(y, 0, 1));
}

function formatMonthKey(date) {
  return date.toISOString().slice(0, 7);
}

function formatCurrency(value) {
  return Number(value.toFixed(2));
}

export function getExpenseTrackerPath() {
  return path.resolve(process.cwd(), "..", "..", "data", "Assets and Expenses 2012-2024 - OUT.csv");
}

export function loadExpenseRows() {
  const csvPath = getExpenseTrackerPath();
  const raw = fs.readFileSync(csvPath, "utf8");
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (!lines.length) return [];

  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    return row;
  });
}

export function computeExpenseAnalytics(rows) {
  const totalsByCategory = new Map();
  const countsByCategory = new Map();
  const totalsByBrand = new Map();
  const totalsByCurrency = new Map();
  const totalsByYear = new Map();
  const totalsByMonth = new Map();
  const largest = [];

  const normalizedRows = rows.map((row) => {
    const php = toNumber(row.php);
    const currency = String(row.currency || "").trim().toUpperCase() || "UNKNOWN";
    const category = normalizeCategory(row.category);
    const brand = String(row.brand_shop || "").trim() || "unknown";
    const date = buildDate(row.year, row.month, row.day);

    totalsByCategory.set(category, (totalsByCategory.get(category) || 0) + php);
    countsByCategory.set(category, (countsByCategory.get(category) || 0) + 1);
    totalsByBrand.set(brand, (totalsByBrand.get(brand) || 0) + php);
    totalsByCurrency.set(currency, (totalsByCurrency.get(currency) || 0) + php);

    const yearKey = String(toNumber(row.year) || "unknown");
    totalsByYear.set(yearKey, (totalsByYear.get(yearKey) || 0) + php);

    if (date) {
      const monthKey = formatMonthKey(date);
      totalsByMonth.set(monthKey, (totalsByMonth.get(monthKey) || 0) + php);
    }

    largest.push({
      id: row.id,
      category,
      brand,
      description: String(row.description || "").trim(),
      php: formatCurrency(php),
      currency,
      total: toNumber(row.total),
      date: date ? date.toISOString().slice(0, 10) : null,
    });

    return { php, category, brand, currency, date };
  });

  const totalExpensesPhp = normalizedRows.reduce((sum, row) => sum + row.php, 0);
  const count = normalizedRows.length;
  const averagePhp = count ? totalExpensesPhp / count : 0;
  const sorted = normalizedRows.map((row) => row.php).sort((a, b) => a - b);
  const midpoint = Math.floor(sorted.length / 2);
  const medianPhp = sorted.length
    ? (sorted.length % 2 === 0 ? (sorted[midpoint - 1] + sorted[midpoint]) / 2 : sorted[midpoint])
    : 0;

  const categories = [...totalsByCategory.entries()]
    .map(([name, totalPhp]) => ({
      name,
      totalPhp: formatCurrency(totalPhp),
      transactionCount: countsByCategory.get(name) || 0,
      averagePhp: formatCurrency(totalPhp / (countsByCategory.get(name) || 1)),
      sharePct: totalExpensesPhp ? formatCurrency((totalPhp / totalExpensesPhp) * 100) : 0,
    }))
    .sort((a, b) => b.totalPhp - a.totalPhp);

  const brands = [...totalsByBrand.entries()]
    .map(([name, totalPhp]) => ({ name, totalPhp: formatCurrency(totalPhp) }))
    .sort((a, b) => b.totalPhp - a.totalPhp)
    .slice(0, 12);

  const currencies = [...totalsByCurrency.entries()]
    .map(([currency, totalPhp]) => ({ currency, totalPhp: formatCurrency(totalPhp) }))
    .sort((a, b) => b.totalPhp - a.totalPhp);

  const yearly = [...totalsByYear.entries()]
    .map(([year, totalPhp]) => ({ year, totalPhp: formatCurrency(totalPhp) }))
    .filter((item) => item.year !== "unknown")
    .sort((a, b) => Number(a.year) - Number(b.year));

  const yoy = yearly
    .map((current, index) => {
      if (!index) return null;
      const prev = yearly[index - 1];
      const delta = current.totalPhp - prev.totalPhp;
      const growthPct = prev.totalPhp ? (delta / prev.totalPhp) * 100 : 0;
      return {
        year: current.year,
        prevYear: prev.year,
        deltaPhp: formatCurrency(delta),
        growthPct: formatCurrency(growthPct),
      };
    })
    .filter(Boolean);

  const monthly = [...totalsByMonth.entries()]
    .map(([month, totalPhp]) => ({ month, totalPhp: formatCurrency(totalPhp) }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const recentMonths = monthly.slice(-12);

  largest.sort((a, b) => b.php - a.php);

  return {
    sourcePath: getExpenseTrackerPath(),
    totals: {
      totalExpensesPhp: formatCurrency(totalExpensesPhp),
      transactionCount: count,
      averagePhp: formatCurrency(averagePhp),
      medianPhp: formatCurrency(medianPhp),
      categoryCount: categories.length,
      firstYear: yearly[0]?.year || null,
      lastYear: yearly[yearly.length - 1]?.year || null,
    },
    categories,
    brands,
    currencies,
    yearly,
    yoy,
    monthly,
    recentMonths,
    largestTransactions: largest.slice(0, 15),
  };
}

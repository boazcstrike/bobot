export const phpFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

export function formatPhp(value: number | null | undefined) {
  return phpFormatter.format(Number.isFinite(value) ? Number(value) : 0);
}

export function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function roundPct(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function monthName(month: number) {
  return new Date(Date.UTC(2024, month - 1, 1)).toLocaleString("en-US", {
    month: "short",
  });
}

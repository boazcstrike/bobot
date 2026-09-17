// Shared number and time formatting for the trading page. Prices and sizes on
// this page update every poll, so every figure renders with tabular figures at
// a fixed precision and never jitters between widths.

const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export function money(value) {
  if (!Number.isFinite(value)) return "—";
  return USD.format(value);
}

// Anything under half a cent displays as flat. Without this, a position marked
// to its own fill price renders as "-$0.00", which reads as a loss.
const FLAT_THRESHOLD = 0.005;

// PnL carries its sign explicitly so the meaning survives without the color.
export function signedMoney(value) {
  if (!Number.isFinite(value)) return "—";
  if (Math.abs(value) < FLAT_THRESHOLD) return USD.format(0);
  return `${value > 0 ? "+" : "-"}${USD.format(Math.abs(value))}`;
}

export function pnlTone(value) {
  if (!Number.isFinite(value) || Math.abs(value) < FLAT_THRESHOLD) return "text-muted-foreground";
  return value > 0 ? "text-chart-2" : "text-destructive";
}

export function plural(count, noun) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

export function quantity(value, digits = 8) {
  if (!Number.isFinite(value)) return "—";
  return value.toFixed(digits).replace(/0+$/, "").replace(/\.$/, "");
}

export function percent(value) {
  if (!Number.isFinite(value)) return "—";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function clockTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString("en-GB", { hour12: false });
}

export function relativeTime(value) {
  if (!value) return "never";
  const elapsed = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(elapsed)) return "never";
  if (elapsed < 1000) return "just now";
  if (elapsed < 60_000) return `${Math.floor(elapsed / 1000)}s ago`;
  if (elapsed < 3_600_000) return `${Math.floor(elapsed / 60_000)}m ago`;
  if (elapsed < 86_400_000) return `${Math.floor(elapsed / 3_600_000)}h ago`;
  return `${Math.floor(elapsed / 86_400_000)}d ago`;
}

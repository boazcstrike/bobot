import { MODE_IDS, TRADING_MODES } from "./modes.mjs";
import { STRATEGIES, STRATEGY_IDS } from "./strategies.mjs";

// The single BotConfig row, normalized. Both the worker and the API routes go
// through here so an out-of-range value written by either side is clamped
// rather than reaching the exchange.

export const CONFIG_ID = 1;
export const HEARTBEAT_ID = 1;

export const DEFAULT_CONFIG = {
  id: CONFIG_ID,
  mode: "paper",
  symbol: "BTCUSDT",
  strategy: "sma_cross",
  params: JSON.stringify(STRATEGIES.sma_cross.defaults),
  enabled: false,
  quoteBudget: 100,
  maxOrderQuote: 20,
  intervalMs: 15000,
};

const MIN_INTERVAL_MS = 5000;
const MAX_INTERVAL_MS = 60 * 60 * 1000;

function clamp(value, low, high, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(high, Math.max(low, number));
}

export function parseParams(raw, strategyId) {
  const defaults = STRATEGIES[strategyId]?.defaults ?? {};
  if (!raw) return { ...defaults };
  let parsed;
  try {
    parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return { ...defaults };
  }
  // Only keys the chosen strategy declares survive, so switching strategies
  // does not carry the previous one settings along in the stored blob.
  const merged = { ...defaults };
  for (const key of Object.keys(defaults)) {
    if (parsed?.[key] !== undefined) merged[key] = parsed[key];
  }
  return merged;
}

// Accepts anything and returns a config the worker can act on without further
// checking. Unknown modes and strategies fall back rather than throwing,
// because the worker must keep running when the dashboard writes nonsense.
export function normalizeConfig(input = {}) {
  const mode = MODE_IDS.includes(input.mode) ? input.mode : DEFAULT_CONFIG.mode;
  const strategy = STRATEGY_IDS.includes(input.strategy) ? input.strategy : DEFAULT_CONFIG.strategy;
  const symbol = String(input.symbol ?? DEFAULT_CONFIG.symbol).toUpperCase().replace(/[^A-Z0-9]/g, "");
  const quoteBudget = clamp(input.quoteBudget, 0, 1_000_000, DEFAULT_CONFIG.quoteBudget);
  const maxOrderQuote = clamp(input.maxOrderQuote, 0, quoteBudget, DEFAULT_CONFIG.maxOrderQuote);

  return {
    id: CONFIG_ID,
    mode,
    strategy,
    symbol: symbol || DEFAULT_CONFIG.symbol,
    params: JSON.stringify(parseParams(input.params, strategy)),
    enabled: Boolean(input.enabled),
    quoteBudget,
    maxOrderQuote,
    intervalMs: Math.round(clamp(input.intervalMs, MIN_INTERVAL_MS, MAX_INTERVAL_MS, DEFAULT_CONFIG.intervalMs)),
  };
}

// Metadata the settings UI renders. Every field is listed rather than spread,
// so neither a strategy function nor an env-var name can leak to the client by
// being added to the source object later.
export function configCatalog() {
  return {
    modes: MODE_IDS.map((id) => ({
      id: TRADING_MODES[id].id,
      label: TRADING_MODES[id].label,
      summary: TRADING_MODES[id].summary,
      placesRealOrders: TRADING_MODES[id].placesRealOrders,
      needsKeys: TRADING_MODES[id].needsKeys,
    })),
    strategies: STRATEGY_IDS.map((id) => ({
      id: STRATEGIES[id].id,
      label: STRATEGIES[id].label,
      summary: STRATEGIES[id].summary,
      interval: STRATEGIES[id].interval,
      defaults: STRATEGIES[id].defaults,
      fields: STRATEGIES[id].fields,
    })),
    limits: { minIntervalMs: MIN_INTERVAL_MS, maxIntervalMs: MAX_INTERVAL_MS },
  };
}

// Binance caps newClientOrderId at 36 characters from [A-Za-z0-9-_.].
export function makeClientOrderId(prefix = "bobot") {
  const stamp = Date.now().toString(36);
  const noise = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${stamp}-${noise}`.slice(0, 36);
}

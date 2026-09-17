// Binance rejects any order whose quantity or price is off the symbol's grid
// (error -1013). This module turns a raw `exchangeInfo` symbol into the three
// numbers that matter and rounds against them with integer math, because
// floating-point division by a step like 0.00001 drifts.

const FILTER_DEFAULTS = { stepSize: 0, tickSize: 0, minQty: 0, maxQty: Infinity, minNotional: 0 };

export function decimalsOf(step) {
  if (!Number.isFinite(step) || step <= 0) return 0;
  const text = String(step);
  if (text.includes("e") || text.includes("E")) {
    return Math.max(0, -Math.floor(Math.log10(step)));
  }
  const dot = text.indexOf(".");
  if (dot < 0) return 0;
  return text.length - dot - 1;
}

// Floors `value` onto the `step` grid. Both sides are scaled to integers first
// so 0.1 + 0.2 style error never pushes the result a tick over the limit.
export function floorToStep(value, step) {
  if (!Number.isFinite(value)) return 0;
  if (!Number.isFinite(step) || step <= 0) return value;
  const scale = 10 ** decimalsOf(step);
  // toFixed absorbs float noise (0.00022 * 1e5 is 22.000000000000004) at a
  // precision finer than one step; the floor then never rounds a size upward.
  const scaledValue = Math.floor(Number((value * scale).toFixed(6)));
  const scaledStep = Math.max(1, Math.round(step * scale));
  return (scaledValue - (scaledValue % scaledStep)) / scale;
}

export function formatToStep(value, step) {
  return floorToStep(value, step).toFixed(decimalsOf(step));
}

// Collapses the filter array into a flat record. Binance has renamed and
// re-nested these filters over time, so each lookup tolerates a miss.
export function parseSymbolFilters(symbolInfo) {
  if (!symbolInfo?.symbol) {
    throw new Error("parseSymbolFilters requires an exchangeInfo symbol entry");
  }
  const byType = new Map((symbolInfo.filters ?? []).map((filter) => [filter.filterType, filter]));
  const lot = byType.get("LOT_SIZE");
  const price = byType.get("PRICE_FILTER");
  const notional = byType.get("NOTIONAL") ?? byType.get("MIN_NOTIONAL");

  return {
    ...FILTER_DEFAULTS,
    symbol: symbolInfo.symbol,
    status: symbolInfo.status,
    baseAsset: symbolInfo.baseAsset,
    quoteAsset: symbolInfo.quoteAsset,
    stepSize: Number(lot?.stepSize ?? 0),
    minQty: Number(lot?.minQty ?? 0),
    maxQty: Number(lot?.maxQty ?? Infinity),
    tickSize: Number(price?.tickSize ?? 0),
    minNotional: Number(notional?.minNotional ?? notional?.notional ?? 0),
  };
}

// Converts an intended spend in quote currency into an order the exchange will
// accept, or an explanation of why no such order exists.
export function planOrder({ filters, side, quoteAmount, price }) {
  if (!(price > 0)) return { ok: false, reason: "no price available" };
  if (!(quoteAmount > 0)) return { ok: false, reason: "quote amount must be positive" };

  const qty = floorToStep(quoteAmount / price, filters.stepSize);
  const notional = qty * price;

  if (qty <= 0) {
    return { ok: false, reason: `quantity rounds to zero at step ${filters.stepSize}` };
  }
  if (qty < filters.minQty) {
    return { ok: false, reason: `quantity ${qty} below minQty ${filters.minQty}` };
  }
  if (qty > filters.maxQty) {
    return { ok: false, reason: `quantity ${qty} above maxQty ${filters.maxQty}` };
  }
  if (notional < filters.minNotional) {
    return {
      ok: false,
      reason: `notional ${notional.toFixed(2)} below minNotional ${filters.minNotional}`,
    };
  }

  return {
    ok: true,
    side,
    quantity: formatToStep(qty, filters.stepSize),
    qty,
    price,
    notional,
  };
}

// Sell path: the size is already known in base asset, only the grid applies.
export function planSell({ filters, baseQty, price }) {
  const qty = floorToStep(baseQty, filters.stepSize);
  const notional = qty * price;
  if (qty <= 0) return { ok: false, reason: "nothing to sell after rounding" };
  if (qty < filters.minQty) {
    return { ok: false, reason: `quantity ${qty} below minQty ${filters.minQty}` };
  }
  if (notional < filters.minNotional) {
    return {
      ok: false,
      reason: `notional ${notional.toFixed(2)} below minNotional ${filters.minNotional}`,
    };
  }
  return { ok: true, side: "SELL", quantity: formatToStep(qty, filters.stepSize), qty, price, notional };
}

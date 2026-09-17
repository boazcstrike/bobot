// Strategies live in a registry keyed by id, so adding one is a new entry
// rather than another branch in the worker loop. Every `evaluate` is pure:
// candles and position in, a signal out, no I/O and no clock reads.

/** @typedef {{ action: "BUY"|"SELL"|"HOLD", reason: string, indicators: Record<string, number> }} Signal */

const HOLD = (reason, indicators = {}) => ({ action: "HOLD", reason, indicators });

export function sma(values, period) {
  if (values.length < period) return null;
  const window = values.slice(-period);
  return window.reduce((sum, value) => sum + value, 0) / period;
}

export function rsi(values, period) {
  if (values.length < period + 1) return null;
  let gains = 0;
  let losses = 0;
  for (let i = values.length - period; i < values.length; i += 1) {
    const change = values[i] - values[i - 1];
    if (change >= 0) gains += change;
    else losses -= change;
  }
  if (losses === 0) return 100;
  const rs = gains / period / (losses / period);
  return 100 - 100 / (1 + rs);
}

export const STRATEGIES = {
  sma_cross: {
    id: "sma_cross",
    label: "SMA crossover",
    summary: "Buys when the fast average crosses above the slow one, sells on the way back down.",
    interval: "15m",
    defaults: { fastPeriod: 9, slowPeriod: 21 },
    fields: [
      { key: "fastPeriod", label: "Fast period", min: 2, max: 200, step: 1 },
      { key: "slowPeriod", label: "Slow period", min: 3, max: 400, step: 1 },
    ],
    candlesNeeded: (params) => Number(params.slowPeriod ?? 21) + 2,

    evaluate(closes, params, position) {
      const fastPeriod = Number(params.fastPeriod ?? 9);
      const slowPeriod = Number(params.slowPeriod ?? 21);
      if (fastPeriod >= slowPeriod) return HOLD("fast period must be shorter than slow period");
      if (closes.length < slowPeriod + 1) return HOLD("not enough candles yet");

      const previous = closes.slice(0, -1);
      const fastNow = sma(closes, fastPeriod);
      const slowNow = sma(closes, slowPeriod);
      const fastBefore = sma(previous, fastPeriod);
      const slowBefore = sma(previous, slowPeriod);
      const indicators = { fastNow, slowNow, fastBefore, slowBefore };

      const crossedUp = fastBefore <= slowBefore && fastNow > slowNow;
      const crossedDown = fastBefore >= slowBefore && fastNow < slowNow;

      if (crossedUp && !position.hasPosition) {
        return { action: "BUY", reason: `fast SMA crossed above slow (${fastNow.toFixed(2)} > ${slowNow.toFixed(2)})`, indicators };
      }
      if (crossedDown && position.hasPosition) {
        return { action: "SELL", reason: `fast SMA crossed below slow (${fastNow.toFixed(2)} < ${slowNow.toFixed(2)})`, indicators };
      }
      if (crossedUp) return HOLD("already long, skipping the buy signal", indicators);
      if (crossedDown) return HOLD("flat already, nothing to sell", indicators);
      return HOLD(fastNow > slowNow ? "trend up, no fresh cross" : "trend down, no fresh cross", indicators);
    },
  },

  rsi_reversion: {
    id: "rsi_reversion",
    label: "RSI reversion",
    summary: "Buys oversold, sells overbought. Suits a range, loses in a trend.",
    interval: "15m",
    defaults: { period: 14, buyBelow: 30, sellAbove: 70 },
    fields: [
      { key: "period", label: "RSI period", min: 2, max: 100, step: 1 },
      { key: "buyBelow", label: "Buy below", min: 1, max: 50, step: 1 },
      { key: "sellAbove", label: "Sell above", min: 50, max: 99, step: 1 },
    ],
    candlesNeeded: (params) => Number(params.period ?? 14) + 2,

    evaluate(closes, params, position) {
      const period = Number(params.period ?? 14);
      const buyBelow = Number(params.buyBelow ?? 30);
      const sellAbove = Number(params.sellAbove ?? 70);
      if (buyBelow >= sellAbove) return HOLD("buy threshold must sit below the sell threshold");

      const value = rsi(closes, period);
      if (value === null) return HOLD("not enough candles yet");
      const indicators = { rsi: value };

      if (value <= buyBelow && !position.hasPosition) {
        return { action: "BUY", reason: `RSI ${value.toFixed(1)} at or below ${buyBelow}`, indicators };
      }
      if (value >= sellAbove && position.hasPosition) {
        return { action: "SELL", reason: `RSI ${value.toFixed(1)} at or above ${sellAbove}`, indicators };
      }
      return HOLD(`RSI ${value.toFixed(1)} between thresholds`, indicators);
    },
  },
};

export const STRATEGY_IDS = Object.keys(STRATEGIES);

export function resolveStrategy(id) {
  const strategy = STRATEGIES[id];
  if (!strategy) {
    throw new Error(`unknown strategy "${id}" (expected one of ${STRATEGY_IDS.join(", ")})`);
  }
  return strategy;
}

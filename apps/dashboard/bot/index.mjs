import { prisma } from "./db.mjs";
import { createBinanceClient, BinanceError } from "../lib/binance/client.mjs";
import { describeModeReadiness, readModeCredentials } from "../lib/binance/modes.mjs";
import { parseSymbolFilters, planOrder, planSell } from "../lib/binance/filters.mjs";
import { resolveStrategy } from "../lib/binance/strategies.mjs";
import {
  CONFIG_ID,
  HEARTBEAT_ID,
  DEFAULT_CONFIG,
  makeClientOrderId,
  normalizeConfig,
  parseParams,
} from "../lib/binance/config.mjs";

// Standalone trading worker.
//
// The dashboard and this process share prisma/dev.db and nothing else. The
// dashboard owns BotConfig; this process owns BotHeartbeat, BotEvent, and
// BotOrder. Neither writes the other table, so the two can start, stop, and
// crash independently.

const EVENT_RETENTION = 2000;
const FILTER_TTL_MS = 60 * 60 * 1000;
const IDLE_POLL_MS = 3000;

let shuttingDown = false;
const filterCache = new Map();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function log(level, kind, message, { symbol = null, data = null } = {}) {
  const line = `[${new Date().toISOString()}] ${level.toUpperCase().padEnd(5)} ${kind.padEnd(9)} ${message}`;
  if (level === "error") console.error(line);
  else console.log(line);
  await prisma.botEvent.create({
    data: { level, kind, message, symbol, data: data ? JSON.stringify(data) : null },
  });
}

async function heartbeat(patch) {
  const create = { ...patch, id: HEARTBEAT_ID, pid: process.pid };
  await prisma.botHeartbeat.upsert({
    where: { id: HEARTBEAT_ID },
    create,
    update: { ...patch, pid: process.pid },
  });
}

async function loadConfig() {
  const row = await prisma.botConfig.findUnique({ where: { id: CONFIG_ID } });
  if (!row) return normalizeConfig(await prisma.botConfig.create({ data: DEFAULT_CONFIG }));
  return normalizeConfig(row);
}

async function loadFilters(client, symbol) {
  const cached = filterCache.get(symbol);
  if (cached && Date.now() - cached.at < FILTER_TTL_MS) return cached.filters;

  const info = await client.exchangeInfo(symbol);
  const entry = info?.symbols?.[0];
  if (!entry) throw new Error(`symbol ${symbol} is not listed on ${client.mode.id}`);
  if (entry.status !== "TRADING") {
    throw new Error(`symbol ${symbol} is ${entry.status}, not TRADING`);
  }
  const filters = parseSymbolFilters(entry);
  filterCache.set(symbol, { at: Date.now(), filters });
  return filters;
}

// Paper mode has no exchange balance, so the position is replayed from the
// order log. Real modes read the account, the only source that also reflects a
// trade made by hand outside the bot.
async function readPosition({ client, config, filters, price }) {
  if (!client.mode.placesRealOrders) {
    const fills = await prisma.botOrder.findMany({
      where: { mode: config.mode, symbol: config.symbol, status: "FILLED" },
    });
    const baseQty = fills.reduce(
      (total, order) => total + (order.side === "BUY" ? order.filledQty : -order.filledQty),
      0,
    );
    const costBasis = fills.reduce(
      (total, order) => total + (order.side === "BUY" ? order.quoteSpent : -order.quoteSpent),
      0,
    );
    return { baseQty, costBasis, hasPosition: baseQty * price >= filters.minNotional };
  }

  const account = await client.account();
  const balance = account.balances?.find((entry) => entry.asset === filters.baseAsset);
  const baseQty = Number(balance?.free ?? 0);
  return { baseQty, costBasis: null, hasPosition: baseQty * price >= filters.minNotional };
}

// The row is written before the exchange call and updated after, so a crash in
// between leaves a PENDING row for reconcilePending to resolve rather than a
// silent second order on the next start.
async function execute({ client, config, plan, side, reason, price }) {
  const clientOrderId = makeClientOrderId();
  const row = await prisma.botOrder.create({
    data: {
      clientOrderId,
      mode: config.mode,
      symbol: config.symbol,
      side,
      type: "MARKET",
      status: "PENDING",
      qty: plan.qty,
      price,
      reason,
    },
  });

  if (!client.mode.placesRealOrders) {
    const filled = await prisma.botOrder.update({
      where: { id: row.id },
      data: { status: "FILLED", filledQty: plan.qty, avgPrice: price, quoteSpent: plan.notional },
    });
    await log("info", "fill", `paper ${side} ${plan.quantity} ${config.symbol} at ${price}`, {
      symbol: config.symbol,
      data: { reason, notional: plan.notional },
    });
    return filled;
  }

  try {
    const response = await client.newOrder({
      symbol: config.symbol,
      side,
      type: "MARKET",
      quantity: plan.quantity,
      newClientOrderId: clientOrderId,
    });
    const filledQty = Number(response.executedQty ?? 0);
    const quoteSpent = Number(response.cummulativeQuoteQty ?? 0);
    const updated = await prisma.botOrder.update({
      where: { id: row.id },
      data: {
        exchangeOrderId: String(response.orderId ?? ""),
        status: response.status ?? "FILLED",
        filledQty,
        quoteSpent,
        avgPrice: filledQty > 0 ? quoteSpent / filledQty : null,
      },
    });
    await log("info", "fill", `${side} ${filledQty} ${config.symbol} for ${quoteSpent.toFixed(2)}`, {
      symbol: config.symbol,
      data: { reason, orderId: response.orderId },
    });
    return updated;
  } catch (error) {
    await prisma.botOrder.update({
      where: { id: row.id },
      data: { status: "REJECTED", error: error.message },
    });
    await log("error", "reject", `${side} rejected: ${error.message}`, { symbol: config.symbol });
    throw error;
  }
}

// Resolves rows left PENDING by a crash. Asking the exchange is the only way to
// learn whether the order landed, and asking is safe to repeat.
async function reconcilePending(client, config) {
  const pending = await prisma.botOrder.findMany({
    where: { mode: config.mode, status: "PENDING" },
  });

  for (const row of pending) {
    if (!client.mode.placesRealOrders) {
      await prisma.botOrder.update({
        where: { id: row.id },
        data: { status: "CANCELED", error: "paper run interrupted" },
      });
      continue;
    }
    try {
      const order = await client.queryOrder({
        symbol: row.symbol,
        origClientOrderId: row.clientOrderId,
      });
      const filledQty = Number(order.executedQty ?? 0);
      const quoteSpent = Number(order.cummulativeQuoteQty ?? 0);
      await prisma.botOrder.update({
        where: { id: row.id },
        data: {
          status: order.status,
          exchangeOrderId: String(order.orderId ?? ""),
          filledQty,
          quoteSpent,
          avgPrice: filledQty > 0 ? quoteSpent / filledQty : null,
        },
      });
      await log("warn", "lifecycle", `recovered pending order ${row.clientOrderId} as ${order.status}`, {
        symbol: row.symbol,
      });
    } catch (error) {
      const neverSent = error instanceof BinanceError && error.code === -2013;
      await prisma.botOrder.update({
        where: { id: row.id },
        data: { status: neverSent ? "NOT_SENT" : "UNKNOWN", error: error.message },
      });
      await log("warn", "lifecycle", `pending order ${row.clientOrderId} resolved as ${neverSent ? "never sent" : "unknown"}`, {
        symbol: row.symbol,
      });
    }
  }
}

async function tick(client, config) {
  const filters = await loadFilters(client, config.symbol);
  const strategy = resolveStrategy(config.strategy);
  const params = parseParams(config.params, config.strategy);

  const candles = await client.klines(
    config.symbol,
    strategy.interval,
    strategy.candlesNeeded(params) + 5,
  );
  const closes = candles.map((candle) => Number(candle[4]));
  const price = closes.at(-1);

  const position = await readPosition({ client, config, filters, price });
  const signal = strategy.evaluate(closes, params, position);

  await heartbeat({
    state: "running",
    mode: config.mode,
    symbol: config.symbol,
    lastTickAt: new Date(),
    lastPrice: price,
    lastSignal: `${signal.action}: ${signal.reason}`,
    lastError: null,
  });

  if (signal.action === "HOLD") return;

  if (signal.action === "BUY") {
    const deployed = position.baseQty * price;
    const headroom = Math.max(0, config.quoteBudget - deployed);
    const quoteAmount = Math.min(config.maxOrderQuote, headroom);
    const plan = planOrder({ filters, side: "BUY", quoteAmount, price });
    if (!plan.ok) {
      await log("warn", "signal", `BUY skipped: ${plan.reason}`, {
        symbol: config.symbol,
        data: { headroom, signal },
      });
      return;
    }
    await execute({ client, config, plan, side: "BUY", reason: signal.reason, price });
    return;
  }

  const plan = planSell({ filters, baseQty: position.baseQty, price });
  if (!plan.ok) {
    await log("warn", "signal", `SELL skipped: ${plan.reason}`, {
      symbol: config.symbol,
      data: { signal },
    });
    return;
  }
  await execute({ client, config, plan, side: "SELL", reason: signal.reason, price });
}

async function trimEvents() {
  const stale = await prisma.botEvent.findMany({
    orderBy: { id: "desc" },
    skip: EVENT_RETENTION,
    select: { id: true },
  });
  if (stale.length === 0) return;
  await prisma.botEvent.deleteMany({ where: { id: { in: stale.map((event) => event.id) } } });
}

async function main() {
  await trimEvents();
  await heartbeat({ state: "starting", lastError: null });
  await log("info", "lifecycle", `worker started (pid ${process.pid})`);

  let reconciledFor = null;

  while (!shuttingDown) {
    let config;
    try {
      config = await loadConfig();
    } catch (error) {
      await log("error", "lifecycle", `cannot read config: ${error.message}`);
      await sleep(IDLE_POLL_MS);
      continue;
    }

    if (!config.enabled) {
      await heartbeat({
        state: "stopped",
        mode: config.mode,
        symbol: config.symbol,
        lastError: null,
      });
      await sleep(IDLE_POLL_MS);
      continue;
    }

    const readiness = describeModeReadiness(config.mode);
    if (!readiness.ready) {
      await heartbeat({
        state: "error",
        mode: config.mode,
        symbol: config.symbol,
        lastError: readiness.reason,
      });
      await log("error", "lifecycle", `mode ${config.mode} not ready: ${readiness.reason}`);
      await sleep(10_000);
      continue;
    }

    const { apiKey, apiSecret } = readModeCredentials(config.mode);
    const client = createBinanceClient({ mode: config.mode, apiKey, apiSecret });

    try {
      if (reconciledFor !== config.mode) {
        await reconcilePending(client, config);
        reconciledFor = config.mode;
      }
      await tick(client, config);
    } catch (error) {
      if (error instanceof BinanceError && error.banned) {
        await heartbeat({ state: "error", lastError: error.message });
        await log("error", "lifecycle", `${error.message} Worker halted; restart after the ban expires.`);
        break;
      }
      await heartbeat({
        state: "error",
        mode: config.mode,
        symbol: config.symbol,
        lastError: error.message,
      });
      await log("error", "tick", error.message, { symbol: config.symbol });
    }

    await sleep(config.intervalMs);
  }

  await heartbeat({ state: "stopped", lastError: null });
  await log("info", "lifecycle", "worker stopped");
  await prisma.$disconnect();
}

for (const name of ["SIGINT", "SIGTERM"]) {
  process.on(name, () => {
    if (shuttingDown) process.exit(1);
    shuttingDown = true;
    console.log(`\n${name} received, finishing the current tick...`);
  });
}

main().catch(async (error) => {
  console.error(error);
  await heartbeat({ state: "error", lastError: error.message }).catch(() => {});
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});

import { createBinanceClient } from "../../../../lib/binance/client.mjs";
import { readModeCredentials, resolveMode, MODE_IDS } from "../../../../lib/binance/modes.mjs";
import { parseSymbolFilters } from "../../../../lib/binance/filters.mjs";
import { resolveStrategy, STRATEGY_IDS } from "../../../../lib/binance/strategies.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Candles and the 24h ticker for the chart. Split out from /status so the
// chart can refresh on its own cadence and a slow exchange never stalls the
// status panel.
export async function GET(request) {
  const url = new URL(request.url);
  const modeId = MODE_IDS.includes(url.searchParams.get("mode")) ? url.searchParams.get("mode") : "paper";
  const symbol = (url.searchParams.get("symbol") ?? "BTCUSDT").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const strategyId = STRATEGY_IDS.includes(url.searchParams.get("strategy"))
    ? url.searchParams.get("strategy")
    : "sma_cross";
  const limit = Math.min(500, Math.max(30, Number(url.searchParams.get("limit")) || 120));

  try {
    const mode = resolveMode(modeId);
    const { apiKey } = readModeCredentials(modeId);
    const client = createBinanceClient({ mode: modeId, apiKey });
    const interval = resolveStrategy(strategyId).interval;

    const [candles, ticker, info] = await Promise.all([
      client.klines(symbol, interval, limit),
      client.ticker24h(symbol),
      client.exchangeInfo(symbol),
    ]);

    return Response.json({
      symbol,
      mode: mode.id,
      interval,
      usedWeight: client.usedWeight,
      filters: info?.symbols?.[0] ? parseSymbolFilters(info.symbols[0]) : null,
      ticker: {
        lastPrice: Number(ticker.lastPrice),
        priceChangePercent: Number(ticker.priceChangePercent),
        highPrice: Number(ticker.highPrice),
        lowPrice: Number(ticker.lowPrice),
        quoteVolume: Number(ticker.quoteVolume),
      },
      candles: candles.map((candle) => ({
        openTime: candle[0],
        open: Number(candle[1]),
        high: Number(candle[2]),
        low: Number(candle[3]),
        close: Number(candle[4]),
        volume: Number(candle[5]),
      })),
    });
  } catch (error) {
    return new Response(`failed to load market data: ${error.message}`, { status: 502 });
  }
}

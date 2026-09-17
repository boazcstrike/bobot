import crypto from "node:crypto";
import { resolveMode } from "./modes.mjs";

// Signed REST client for Binance spot.
//
// Three failure modes get handled here rather than at every call site:
//   -1021  the local clock drifted outside recvWindow. Corrected by tracking
//          the offset against /api/v3/time instead of widening recvWindow.
//   429    rate limited. Retried once after the server's Retry-After.
//   418    the IP is banned for ignoring 429s. Never retried; bans compound.

export class BinanceError extends Error {
  constructor(message, { status, code, retryAfterSeconds, banned } = {}) {
    super(message);
    this.name = "BinanceError";
    this.status = status ?? null;
    this.code = code ?? null;
    this.retryAfterSeconds = retryAfterSeconds ?? null;
    this.banned = Boolean(banned);
  }
}

const RECV_WINDOW_MS = 5000;
const CLOCK_RESYNC_INTERVAL_MS = 30 * 60 * 1000;

function toQueryString(params) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    search.append(key, String(value));
  }
  return search.toString();
}

export function createBinanceClient({ mode, apiKey = null, apiSecret = null, fetchImpl = fetch }) {
  const modeConfig = resolveMode(mode);
  const base = modeConfig.restBase;

  let clockOffsetMs = 0;
  let clockSyncedAt = 0;
  // Last value of the X-MBX-USED-WEIGHT-1m header, so callers can throttle
  // before the exchange does it for them.
  let usedWeight = 0;

  async function raw(method, path, { query = "", signed = false, retryOn429 = true } = {}) {
    const url = `${base}${path}${query ? `?${query}` : ""}`;
    const headers = {};
    if (signed || apiKey) headers["X-MBX-APIKEY"] = apiKey ?? "";

    const response = await fetchImpl(url, { method, headers });
    const weightHeader = response.headers.get("x-mbx-used-weight-1m");
    if (weightHeader) usedWeight = Number(weightHeader);

    if (response.status === 418) {
      throw new BinanceError("Binance banned this IP (418). Stop all requests.", {
        status: 418,
        banned: true,
        retryAfterSeconds: Number(response.headers.get("retry-after")) || null,
      });
    }

    if (response.status === 429) {
      const retryAfterSeconds = Number(response.headers.get("retry-after")) || 5;
      if (!retryOn429) {
        throw new BinanceError(`rate limited, retry in ${retryAfterSeconds}s`, {
          status: 429,
          retryAfterSeconds,
        });
      }
      await new Promise((resolve) => setTimeout(resolve, retryAfterSeconds * 1000));
      return raw(method, path, { query, signed, retryOn429: false });
    }

    const text = await response.text();
    let payload = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = null;
    }

    if (!response.ok) {
      const code = payload?.code ?? null;
      const detail = payload?.msg ?? text.slice(0, 300) ?? response.statusText;
      throw new BinanceError(`${method} ${path} failed (${response.status}): ${detail}`, {
        status: response.status,
        code,
      });
    }
    return payload;
  }

  async function syncClock(force = false) {
    if (!force && Date.now() - clockSyncedAt < CLOCK_RESYNC_INTERVAL_MS) return clockOffsetMs;
    const sentAt = Date.now();
    const { serverTime } = await raw("GET", "/api/v3/time");
    const roundTrip = Date.now() - sentAt;
    clockOffsetMs = serverTime - (sentAt + roundTrip / 2);
    clockSyncedAt = Date.now();
    return clockOffsetMs;
  }

  async function signedRequest(method, path, params = {}) {
    if (!apiKey || !apiSecret) {
      throw new BinanceError(`${path} needs API credentials for mode "${modeConfig.id}"`);
    }
    await syncClock();

    const send = async () => {
      const query = toQueryString({
        ...params,
        recvWindow: RECV_WINDOW_MS,
        timestamp: Math.round(Date.now() + clockOffsetMs),
      });
      const signature = crypto.createHmac("sha256", apiSecret).update(query).digest("hex");
      return raw(method, path, { query: `${query}&signature=${signature}`, signed: true });
    };

    try {
      return await send();
    } catch (error) {
      // -1021 means the offset went stale between syncs. Resync and retry once.
      if (error instanceof BinanceError && error.code === -1021) {
        await syncClock(true);
        return send();
      }
      throw error;
    }
  }

  return {
    mode: modeConfig,
    get usedWeight() {
      return usedWeight;
    },
    get clockOffsetMs() {
      return clockOffsetMs;
    },
    syncClock,
    ping: () => raw("GET", "/api/v3/ping"),
    serverTime: () => raw("GET", "/api/v3/time"),
    exchangeInfo: (symbol) =>
      raw("GET", "/api/v3/exchangeInfo", { query: toQueryString({ symbol }) }),
    price: (symbol) =>
      raw("GET", "/api/v3/ticker/price", { query: toQueryString({ symbol }) }),
    ticker24h: (symbol) =>
      raw("GET", "/api/v3/ticker/24hr", { query: toQueryString({ symbol }) }),
    klines: (symbol, interval, limit = 200) =>
      raw("GET", "/api/v3/klines", { query: toQueryString({ symbol, interval, limit }) }),
    account: () => signedRequest("GET", "/api/v3/account"),
    openOrders: (symbol) => signedRequest("GET", "/api/v3/openOrders", { symbol }),
    // newClientOrderId is the idempotency key. Binance rejects a repeat with
    // -2010 "Duplicate order sent", which makes a retry after a timeout safe.
    newOrder: ({ symbol, side, type = "MARKET", quantity, price, newClientOrderId }) =>
      signedRequest("POST", "/api/v3/order", {
        symbol,
        side,
        type,
        quantity,
        price,
        timeInForce: type === "LIMIT" ? "GTC" : undefined,
        newClientOrderId,
      }),
    queryOrder: ({ symbol, origClientOrderId }) =>
      signedRequest("GET", "/api/v3/order", { symbol, origClientOrderId }),
    cancelOrder: ({ symbol, origClientOrderId }) =>
      signedRequest("DELETE", "/api/v3/order", { symbol, origClientOrderId }),
  };
}

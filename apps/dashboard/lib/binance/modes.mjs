// Trading modes as a table rather than an if-chain. Every difference between
// paper, testnet, and live trading is a column here, so adding a mode never
// means hunting for branches.

export const TRADING_MODES = {
  paper: {
    id: "paper",
    label: "Paper",
    summary: "Real prices from mainnet, simulated fills. Places nothing.",
    restBase: "https://api.binance.com",
    wsBase: "wss://stream.binance.com:9443",
    placesRealOrders: false,
    needsKeys: false,
    keyPrefix: null,
  },
  testnet: {
    id: "testnet",
    label: "Testnet",
    summary: "Binance spot testnet. Real order flow, fake money.",
    restBase: "https://testnet.binance.vision",
    wsBase: "wss://stream.testnet.binance.vision",
    placesRealOrders: true,
    needsKeys: true,
    keyPrefix: "BINANCE_TESTNET",
  },
  live: {
    id: "live",
    label: "Live",
    summary: "Mainnet with real funds. Every order spends money.",
    restBase: "https://api.binance.com",
    wsBase: "wss://stream.binance.com:9443",
    placesRealOrders: true,
    needsKeys: true,
    keyPrefix: "BINANCE",
  },
};

export const MODE_IDS = Object.keys(TRADING_MODES);

export function resolveMode(id) {
  const mode = TRADING_MODES[id];
  if (!mode) {
    throw new Error(`unknown trading mode "${id}" (expected one of ${MODE_IDS.join(", ")})`);
  }
  return mode;
}

// Live trading stays off unless the operator opts in explicitly, so a stray
// config write can never move the bot onto mainnet funds on its own.
export function liveTradingAllowed(env = process.env) {
  return env.BINANCE_ALLOW_LIVE === "true";
}

export function readModeCredentials(modeId, env = process.env) {
  const mode = resolveMode(modeId);
  if (!mode.needsKeys) return { apiKey: null, apiSecret: null };
  return {
    apiKey: env[`${mode.keyPrefix}_API_KEY`] ?? null,
    apiSecret: env[`${mode.keyPrefix}_API_SECRET`] ?? null,
  };
}

// Reports whether a mode is usable without ever returning the key material.
export function describeModeReadiness(modeId, env = process.env) {
  const mode = resolveMode(modeId);
  const { apiKey, apiSecret } = readModeCredentials(modeId, env);
  const hasKeys = Boolean(apiKey && apiSecret);

  if (mode.needsKeys && !hasKeys) {
    return {
      ready: false,
      hasKeys,
      reason: `set ${mode.keyPrefix}_API_KEY and ${mode.keyPrefix}_API_SECRET in apps/dashboard/.env`,
    };
  }
  if (modeId === "live" && !liveTradingAllowed(env)) {
    return { ready: false, hasKeys, reason: "set BINANCE_ALLOW_LIVE=true to arm mainnet trading" };
  }
  return { ready: true, hasKeys, reason: null };
}

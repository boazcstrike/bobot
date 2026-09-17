# Binance Spot Trading Bot

## Status

Built and verified 2026-09-18. Paper mode works end to end. Testnet and live
modes are implemented but unproven, because neither has API keys on this
machine yet.

## Relationship to the rest of the plans

This is not in the Instagram revenue plan (`docs/plans/README.md`). It belongs
to the Bobot personal assistant direction in
`14-bobot-personal-assistant-platform.md`: a private tool on the operator's own
dashboard, alongside expenses, credit card statements, and GitHub repos. It is
not a product, has no customer, and carries no KPI in `08-kpis-scorecard.md`.
If it ever becomes something to sell, that needs its own plan file first.

## What it is

A standalone Node worker that trades one Binance spot symbol on a schedule, and
a dashboard page at `/trading` that configures and monitors it.

```
apps/dashboard/
  bot/index.mjs              worker loop, runs as its own process
  bot/db.mjs                 the worker's own Prisma client
  lib/binance/modes.mjs      paper | testnet | live, as a table
  lib/binance/client.mjs     signed REST, clock-skew and 429/418 handling
  lib/binance/filters.mjs    exchangeInfo rounding (step size, tick, notional)
  lib/binance/strategies.mjs strategy registry
  lib/binance/config.mjs     config normalization and clamping
  lib/binance/portfolio.mjs  PnL from the order log, heartbeat liveness
  app/api/trading/*          status, market, config, control
  app/trading/page.js        the page
```

## How the two processes talk

Through `prisma/dev.db` and nothing else. Table ownership is split so no table
has two writers:

| Table | Written by | Read by |
|---|---|---|
| `BotConfig` | dashboard | worker, each tick |
| `BotHeartbeat` | worker | dashboard |
| `BotEvent` | worker | dashboard |
| `BotOrder` | worker | dashboard |

Start and stop flip `BotConfig.enabled`. The dashboard never spawns or signals
a process, so pressing start while the worker is down changes only that flag,
and the worker picks it up when it comes back.

## Running it

```bash
npm run dashboard:dev     # the UI on :3010
npm run dashboard:bot     # the worker, in a second terminal
```

The worker stays up across start and stop. Stopping the bot idles the loop; it
does not exit the process.

## Modes

| Mode | Prices | Orders | Keys |
|---|---|---|---|
| `paper` | mainnet, real | simulated, recorded in `BotOrder` | none |
| `testnet` | testnet | real order flow, fake money | `BINANCE_TESTNET_*` |
| `live` | mainnet | real money | `BINANCE_*` plus `BINANCE_ALLOW_LIVE=true` |

Live needs two separate opt-ins: the keys, and the env flag. A config write
alone cannot arm it.

## Safety properties worth keeping

These are the parts that are easy to break in a later edit.

- **Order sizes floor onto the symbol grid.** `floorToStep` scales to integers
  before flooring. An earlier version used `Math.round` and turned a $20 budget
  into a $20.07 order. Any change here needs the grid cases re-run.
- **`newClientOrderId` is written to the database before the exchange call.**
  A crash between send and acknowledgement leaves a `PENDING` row that
  `reconcilePending` resolves by asking the exchange, instead of a silent
  second order on the next start.
- **Clock skew is corrected, not papered over.** The client tracks its offset
  against `/api/v3/time` and resyncs on error `-1021`, rather than widening
  `recvWindow`. Measured offset on this machine at build time: about 1.1s.
- **Budget is enforced on the buy path.** An order is capped at
  `min(maxOrderQuote, quoteBudget - deployed)`.
- **Liveness is derived from heartbeat staleness**, never from the worker's own
  `state` field, because a killed process never writes "stopped".

## Known limits

- REST polling only. No WebSocket streams, so the tick interval is the
  resolution. A 15s interval on 15m candles is fine; scalping is not possible
  on this design.
- Market orders only. No limit orders, no stops, no take-profit.
- One symbol at a time.
- Testnet and live paths are written against the documented API but have not
  been run against a real key from this machine.
- Two strategies, `sma_cross` and `rsi_reversion`. Both are demonstrations, not
  edges. Neither has been backtested.

## Next steps, if it continues

1. Point it at testnet with real keys and let it run a week. That is the only
   way the order path gets proven.
2. Add a backtest command over historical klines, so a strategy can be judged
   before it trades.
3. Add stop-loss handling. The current design can ride a position down with no
   floor other than the strategy's own sell signal.

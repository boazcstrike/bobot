# Page Override: /trading

Overrides `design-system/bobot-dashboard/MASTER.md` for the Binance spot bot
control panel. Generated from `ui-ux-pro-max --density 9 --motion 2`, then
mapped onto the semantic tokens this dashboard actually ships, because
`agents.md` forbids the legacy `--color-*` variables in new pages.

## Pattern

Data-Dense Dashboard. Control above the fold, evidence below it. The operator
opens this page to answer one question first: is the bot running and is it
winning. Everything else is secondary.

Band order, top to bottom:

1. Status bar. Liveness pill, mode badge, symbol, last price, start/stop.
2. Four stat tiles. Position, average cost, unrealized PnL, realized PnL.
3. Price chart (8 cols) beside the config form (4 cols).
4. Order history (7 cols) beside the event log (5 cols).

Bands sit in `grid grid-cols-12 gap-px bg-border p-px` with
`components/layout/shared/divider.jsx` between them, matching every other page.

## Token mapping

The generated palette maps onto the shipped semantic tokens. No raw hex.

| Generated role | Token used here | Applied to |
|---|---|---|
| Accent `#22C55E` | `var(--chart-2)` | Running state, BUY side, positive PnL |
| Destructive `#EF4444` | `var(--destructive)` | Error state, SELL side, negative PnL, live-mode warning |
| Primary `#0F172A` | `var(--primary)` | Price line, primary action |
| Muted `#1A1E2F` | `var(--muted)` / `var(--muted-foreground)` | Idle state, secondary labels, timestamps |
| Border `#334155` | `var(--border)` | Grid bands, dividers, table rules |

Light and dark both work because every value resolves through the token layer
rather than the OLED-only palette the generator proposed.

## Density

Dense tier, 9/10. Table rows are `py-2`, log lines `text-xs`, tile values
`text-2xl`. Spacing runs on the 8/12/16/24 step, not the 24/32/48 step the
marketing pages use.

## Motion

Subtle tier, 2/10. Chart lines animate once at 700ms on mount, matching
`spend-overview.jsx`. Nothing else moves. No scroll reveal: every element on
this page is status, and status that fades in reads as stale.

## Numbers

Monospace tabular figures (`font-mono tabular-nums`) for every price, quantity,
and PnL figure, so digits do not jitter between polls. This is the one place
the page departs from the body font.

## Page-specific rules

- Live mode is visually distinct from paper and testnet. A red badge and a
  confirm step on the mode switch, because this control spends real money.
- Liveness comes from heartbeat staleness, never from a self-reported state
  field, and the UI says "Worker offline" rather than implying the bot is idle.
- PnL sign is carried by both color and an explicit `+` or `-`, so the meaning
  survives a color-blind reader (MASTER anti-pattern: color alone).
- Empty states name the next action ("start the worker with `npm run bot`"),
  never a bare "No data".

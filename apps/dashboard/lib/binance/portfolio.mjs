// Turns the order log into the numbers the dashboard shows. Pure, so the same
// function serves paper and live history without knowing which it is reading.
//
// Cost basis uses the running-average method: every sell realizes against the
// average price paid so far, which is what a spot position on one symbol
// actually behaves like.

export function summarizeOrders(orders, lastPrice) {
  const chronological = [...orders]
    .filter((order) => order.status === "FILLED" || order.status === "PARTIALLY_FILLED")
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  let baseQty = 0;
  let costBasis = 0;
  let realizedPnl = 0;
  let totalSpent = 0;
  let totalProceeds = 0;
  let buys = 0;
  let sells = 0;

  for (const order of chronological) {
    const qty = Number(order.filledQty ?? 0);
    const quote = Number(order.quoteSpent ?? 0);
    if (qty <= 0) continue;

    if (order.side === "BUY") {
      baseQty += qty;
      costBasis += quote;
      totalSpent += quote;
      buys += 1;
      continue;
    }

    const averageCost = baseQty > 0 ? costBasis / baseQty : 0;
    const soldQty = Math.min(qty, baseQty);
    realizedPnl += quote - averageCost * soldQty;
    costBasis -= averageCost * soldQty;
    baseQty -= soldQty;
    totalProceeds += quote;
    sells += 1;
  }

  const averageCost = baseQty > 0 ? costBasis / baseQty : null;
  const marketValue = lastPrice > 0 ? baseQty * lastPrice : 0;
  const unrealizedPnl = averageCost === null || !(lastPrice > 0) ? 0 : marketValue - costBasis;

  return {
    baseQty,
    averageCost,
    costBasis,
    marketValue,
    realizedPnl,
    unrealizedPnl,
    totalPnl: realizedPnl + unrealizedPnl,
    totalSpent,
    totalProceeds,
    buys,
    sells,
    tradeCount: buys + sells,
  };
}

// The worker writes a heartbeat every tick. A state field alone cannot be
// trusted, because a killed process never gets to write "stopped", so liveness
// is derived from how stale the last tick is.
export function deriveLiveness(heartbeat, { now = Date.now(), intervalMs = 15000 } = {}) {
  if (!heartbeat) {
    return { alive: false, state: "never-run", staleMs: null, label: "Never run" };
  }
  const lastTickAt = heartbeat.lastTickAt ? new Date(heartbeat.lastTickAt).getTime() : null;
  const beatAt = new Date(heartbeat.updatedAt).getTime();
  const staleMs = now - Math.max(beatAt, lastTickAt ?? 0);
  // Three missed beats. The idle poll is 3s, so an idle worker still counts.
  const alive = staleMs < Math.max(intervalMs, 3000) * 3 + 5000;

  if (!alive) return { alive: false, state: "offline", staleMs, label: "Worker offline" };
  if (heartbeat.state === "error") return { alive: true, state: "error", staleMs, label: "Error" };
  if (heartbeat.state === "running") return { alive: true, state: "running", staleMs, label: "Running" };
  return { alive: true, state: "idle", staleMs, label: "Idle" };
}

"use client";

import { Coins, Receipt, TrendingDown, TrendingUp } from "lucide-react";

import { CardContent } from "@/components/ui/card";
import { DashboardCard } from "@/components/shared/dashboard-card";
import { Skeleton } from "@/components/ui/skeleton";

import { money, plural, pnlTone, quantity, signedMoney } from "./format";

function Tile({ label, value, sub, icon: Icon, tone = "" }) {
  return (
    <DashboardCard className="py-5">
      <CardContent className="flex items-start justify-between gap-4 px-5">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={`truncate font-mono text-2xl font-semibold tabular-nums ${tone}`}>{value}</p>
          <p className="truncate text-xs text-muted-foreground">{sub}</p>
        </div>
        <div className="w-fit shrink-0 rounded-md border border-border p-2">
          <Icon size={15} />
        </div>
      </CardContent>
    </DashboardCard>
  );
}

export default function PnlTiles({ portfolio, config, loading }) {
  if (loading || !portfolio) {
    return Array.from({ length: 4 }, (_, index) => (
      <div key={index} className="col-span-12 sm:col-span-6 xl:col-span-3">
        <DashboardCard className="py-5">
          <CardContent className="px-5">
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </DashboardCard>
      </div>
    ));
  }

  const base = config.symbol.replace(/USDT$|BUSD$|USDC$/, "") || "base";
  const unrealized = portfolio.unrealizedPnl;
  const realized = portfolio.realizedPnl;

  const tiles = [
    {
      label: "Position",
      value: quantity(portfolio.baseQty, 6),
      sub: `${base} · ${money(portfolio.marketValue)} at market`,
      icon: Coins,
    },
    {
      label: "Average cost",
      value: portfolio.averageCost === null ? "—" : money(portfolio.averageCost),
      sub: portfolio.baseQty > 0 ? `${money(portfolio.costBasis)} deployed` : "flat, nothing held",
      icon: Receipt,
    },
    {
      label: "Unrealized PnL",
      value: signedMoney(unrealized),
      sub: "open position, marked to last price",
      icon: unrealized >= 0 ? TrendingUp : TrendingDown,
      tone: pnlTone(unrealized),
    },
    {
      label: "Realized PnL",
      value: signedMoney(realized),
      sub: `${plural(portfolio.tradeCount, "fill")} · ${portfolio.buys} buy / ${portfolio.sells} sell`,
      icon: realized >= 0 ? TrendingUp : TrendingDown,
      tone: pnlTone(realized),
    },
  ];

  return tiles.map((tile) => (
    <div key={tile.label} className="col-span-12 sm:col-span-6 xl:col-span-3">
      <Tile {...tile} />
    </div>
  ));
}

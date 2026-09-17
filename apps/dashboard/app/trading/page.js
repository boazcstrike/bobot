"use client";

import { useCallback, useEffect, useState } from "react";
import { TriangleAlert } from "lucide-react";

import Divider from "@/components/layout/shared/divider";

import BotConfigForm from "../components/trading/bot-config-form";
import EventLog from "../components/trading/event-log";
import OrderTable from "../components/trading/order-table";
import PnlTiles from "../components/trading/pnl-tiles";
import PriceChart from "../components/trading/price-chart";
import StatusBar from "../components/trading/status-bar";

// Status is sqlite-only and costs no exchange weight, so it polls fast. Market
// data is a Binance call, so it polls slowly enough to stay far inside the
// 6000 weight per minute IP budget even with the worker trading alongside.
const STATUS_POLL_MS = 3000;
const MARKET_POLL_MS = 20000;

async function getJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  const body = await response.text();
  if (!response.ok) throw new Error(body || `${url} failed (${response.status})`);
  return JSON.parse(body);
}

async function sendJson(url, method, payload) {
  const response = await fetch(url, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.text();
  if (!response.ok) throw new Error(body || `${url} failed (${response.status})`);
  return JSON.parse(body);
}

export default function TradingPage() {
  const [status, setStatus] = useState(null);
  const [market, setMarket] = useState(null);
  const [marketError, setMarketError] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  // The market poller depends on the series only, not on the whole status
  // object, so a 3s status refresh does not restart the 20s candle timer.
  const symbol = status?.config?.symbol;
  const mode = status?.config?.mode;
  const strategy = status?.config?.strategy;

  const loadStatus = useCallback(async () => {
    try {
      setStatus(await getJson("/api/trading/status"));
      setError(null);
    } catch (cause) {
      setError(cause.message);
    }
  }, []);

  const loadMarket = useCallback(async () => {
    if (!symbol) return;
    try {
      const params = new URLSearchParams({ symbol, mode, strategy, limit: "120" });
      setMarket(await getJson(`/api/trading/market?${params}`));
      setMarketError(null);
    } catch (cause) {
      setMarketError(cause.message);
    }
  }, [symbol, mode, strategy]);

  useEffect(() => {
    loadStatus();
    const timer = setInterval(loadStatus, STATUS_POLL_MS);
    return () => clearInterval(timer);
  }, [loadStatus]);

  useEffect(() => {
    if (!symbol) return undefined;
    loadMarket();
    const timer = setInterval(loadMarket, MARKET_POLL_MS);
    return () => clearInterval(timer);
  }, [loadMarket, symbol]);

  const toggleBot = async () => {
    if (!status) return;
    setBusy(true);
    try {
      await sendJson("/api/trading/control", "POST", {
        action: status.config.enabled ? "stop" : "start",
      });
      setError(null);
      await loadStatus();
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  };

  const saveConfig = async (draft) => {
    setSaving(true);
    try {
      await sendJson("/api/trading/config", "PUT", draft);
      setError(null);
      await loadStatus();
      await loadMarket();
    } catch (cause) {
      setError(cause.message);
    } finally {
      setSaving(false);
    }
  };

  const loading = status === null;

  return (
    <div className="flex flex-col">
      {error ? (
        <div className="flex items-start gap-2 border-b border-border bg-destructive/5 px-6 py-3">
          <TriangleAlert size={15} className="mt-0.5 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : null}

      <div className="grid grid-cols-12 gap-px bg-border p-px">
        <div className="col-span-12">
          <StatusBar
            status={status}
            ticker={market?.ticker ?? null}
            busy={busy}
            onToggle={toggleBot}
            loading={loading}
          />
        </div>

        <div className="col-span-12">
          <Divider />
        </div>

        <PnlTiles portfolio={status?.portfolio} config={status?.config} loading={loading} />

        <div className="col-span-12">
          <Divider />
        </div>

        <div className="col-span-12 xl:col-span-8">
          <PriceChart
            market={market}
            orders={status?.orders ?? []}
            loading={loading}
            error={marketError}
          />
        </div>
        <div className="col-span-12 xl:col-span-4">
          <BotConfigForm status={status} saving={saving} onSave={saveConfig} loading={loading} />
        </div>

        <div className="col-span-12">
          <Divider />
        </div>

        <div className="col-span-12 xl:col-span-7">
          <OrderTable orders={status?.orders ?? []} loading={loading} />
        </div>
        <div className="col-span-12 xl:col-span-5">
          <EventLog events={status?.events ?? []} loading={loading} />
        </div>
      </div>
    </div>
  );
}

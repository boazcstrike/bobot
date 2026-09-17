"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, Save, ShieldAlert, SlidersHorizontal } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardCard } from "@/components/shared/dashboard-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";

function Field({ label, hint, htmlFor, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor} className="text-xs text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export default function BotConfigForm({ status, saving, onSave, loading }) {
  const [draft, setDraft] = useState(null);
  const [pendingLiveMode, setPendingLiveMode] = useState(false);

  // The server owns the config. The draft resets whenever the saved value
  // changes so a save elsewhere is never silently overwritten from here.
  useEffect(() => {
    if (status?.config) setDraft(status.config);
  }, [status?.config]);

  if (loading || !draft || !status) {
    return (
      <DashboardCard className="py-6">
        <CardContent className="px-6">
          <Skeleton className="h-[420px] w-full" />
        </CardContent>
      </DashboardCard>
    );
  }

  const { catalog, readiness } = status;
  const strategy = catalog.strategies.find((entry) => entry.id === draft.strategy);
  const modeInfo = catalog.modes.find((entry) => entry.id === draft.mode);
  const modeReady = readiness[draft.mode];
  const locked = status.config.enabled;

  const set = (patch) => setDraft((current) => ({ ...current, ...patch }));
  const setParam = (key, value) => set({ params: { ...draft.params, [key]: value } });

  // Switching to live mode arms real funds, so it goes through a confirm step
  // rather than landing on a one-click select.
  const chooseMode = (next) => {
    if (next === "live" && draft.mode !== "live") {
      setPendingLiveMode(true);
      return;
    }
    set({ mode: next });
  };

  const chooseStrategy = (id) => {
    const defaults = catalog.strategies.find((entry) => entry.id === id)?.defaults ?? {};
    set({ strategy: id, params: { ...defaults } });
  };

  return (
    <DashboardCard className="py-6">
      <CardHeader className="px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base">Bot configuration</CardTitle>
            <p className="text-xs text-muted-foreground">
              {locked ? "Stop the bot to change these." : "Saved to the database; the worker reads it each tick."}
            </p>
          </div>
          <div className="w-fit rounded-md border border-border p-2">
            <SlidersHorizontal size={15} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 px-6">
        <Field label="Mode" hint={modeInfo?.summary} htmlFor="bot-mode">
          <NativeSelect
            id="bot-mode"
            className="w-full cursor-pointer"
            value={draft.mode}
            disabled={locked}
            onChange={(event) => chooseMode(event.target.value)}
          >
            {catalog.modes.map((mode) => (
              <NativeSelectOption key={mode.id} value={mode.id}>
                {mode.label}
                {readiness[mode.id]?.ready ? "" : " (not configured)"}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>

        {modeReady && !modeReady.ready ? (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
            <ShieldAlert size={15} className="mt-0.5 shrink-0 text-destructive" />
            <p className="text-xs text-destructive">{modeReady.reason}</p>
          </div>
        ) : null}

        {draft.mode === "live" ? (
          <Badge variant="destructive" className="w-fit gap-1.5">
            <ShieldAlert size={13} />
            Orders will spend real funds
          </Badge>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Symbol" htmlFor="bot-symbol">
            <Input
              id="bot-symbol"
              value={draft.symbol}
              disabled={locked}
              className="font-mono"
              onChange={(event) => set({ symbol: event.target.value.toUpperCase() })}
            />
          </Field>
          <Field label="Tick interval" hint="seconds between checks" htmlFor="bot-interval">
            <Input
              id="bot-interval"
              type="number"
              min={5}
              step={5}
              value={Math.round(draft.intervalMs / 1000)}
              disabled={locked}
              className="font-mono tabular-nums"
              onChange={(event) => set({ intervalMs: Number(event.target.value) * 1000 })}
            />
          </Field>
        </div>

        <Field label="Strategy" hint={strategy?.summary} htmlFor="bot-strategy">
          <NativeSelect
            id="bot-strategy"
            className="w-full cursor-pointer"
            value={draft.strategy}
            disabled={locked}
            onChange={(event) => chooseStrategy(event.target.value)}
          >
            {catalog.strategies.map((entry) => (
              <NativeSelectOption key={entry.id} value={entry.id}>
                {entry.label} ({entry.interval} candles)
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>

        {strategy ? (
          <div className="grid grid-cols-3 gap-3 rounded-lg border border-border p-3">
            {strategy.fields.map((field) => (
              <Field key={field.key} label={field.label} htmlFor={`param-${field.key}`}>
                <Input
                  id={`param-${field.key}`}
                  type="number"
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  value={draft.params[field.key] ?? ""}
                  disabled={locked}
                  className="font-mono tabular-nums"
                  onChange={(event) => setParam(field.key, Number(event.target.value))}
                />
              </Field>
            ))}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Total budget" hint="USDT the bot may deploy" htmlFor="bot-budget">
            <Input
              id="bot-budget"
              type="number"
              min={0}
              step={10}
              value={draft.quoteBudget}
              disabled={locked}
              className="font-mono tabular-nums"
              onChange={(event) => set({ quoteBudget: Number(event.target.value) })}
            />
          </Field>
          <Field label="Max per order" hint="USDT cap on one buy" htmlFor="bot-max-order">
            <Input
              id="bot-max-order"
              type="number"
              min={0}
              step={5}
              value={draft.maxOrderQuote}
              disabled={locked}
              className="font-mono tabular-nums"
              onChange={(event) => set({ maxOrderQuote: Number(event.target.value) })}
            />
          </Field>
        </div>

        <Button
          onClick={() => onSave(draft)}
          disabled={saving || locked}
          className="cursor-pointer gap-2 transition-colors duration-200"
        >
          {saving ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />}
          Save configuration
        </Button>
      </CardContent>

      <AlertDialog open={pendingLiveMode} onOpenChange={setPendingLiveMode}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Switch to live trading?</AlertDialogTitle>
            <AlertDialogDescription>
              Live mode places orders against your real Binance balance. Every buy spends money and
              every sell disposes of an asset you own. The bot still respects the budget caps below,
              and it will not start until BINANCE_ALLOW_LIVE is set to true on the server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Stay on {draft.mode}</AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer"
              onClick={() => {
                set({ mode: "live" });
                setPendingLiveMode(false);
              }}
            >
              Use live mode
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardCard>
  );
}

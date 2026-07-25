"use client";

import Link from "next/link";
import { Inbox } from "lucide-react";

const QUEUE_CAPACITY = 20;

// Compact status panel in the sidebar footer: how full the credit-card
// statement import queue currently is.
export function NavSecondary({ pendingStatements = 0 }) {
  const capped = Math.min(pendingStatements, QUEUE_CAPACITY);
  const percent = Math.round((capped / QUEUE_CAPACITY) * 100);

  return (
    <div className="hide-menu -mx-4 border-y border-border px-5 py-5">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Inbox className="size-5 shrink-0" />
                <span className="text-base font-medium leading-6 text-foreground">Statements</span>
              </div>
              <span className="text-base font-medium leading-6 text-foreground">{percent}%</span>
            </div>

            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10"
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Statement queue usage"
            >
              <div
                className="h-full rounded-full bg-foreground transition-[width] duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          <p className="text-center text-sm font-normal leading-5 text-muted-foreground">
            {pendingStatements}/{QUEUE_CAPACITY} pending imports
          </p>
        </div>

        <Link
          href="/credit-card-statements"
          className="flex h-9 w-full cursor-pointer items-center justify-center rounded-lg bg-foreground text-sm font-medium text-background hover:bg-foreground/90"
        >
          Review queue
        </Link>
      </div>
    </div>
  );
}

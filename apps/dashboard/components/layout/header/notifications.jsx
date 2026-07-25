"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlarmClock, Bell } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

function formatRemindAt(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Reminders due now or in the past are the ones worth surfacing as unread.
function isDue(reminder) {
  const date = new Date(reminder.remindAt);
  return !Number.isNaN(date.getTime()) && date.getTime() <= Date.now();
}

export default function Notifications({ className }) {
  const [reminders, setReminders] = useState([]);
  const [readIds, setReadIds] = useState(() => new Set());
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadReminders() {
      try {
        const response = await fetch("/api/reminders", { cache: "no-store" });
        if (!response.ok) throw new Error(`Reminders request failed (${response.status})`);
        const payload = await response.json();
        if (!cancelled) setReminders(Array.isArray(payload) ? payload : []);
      } catch (loadError) {
        if (!cancelled) setError(loadError.message);
      }
    }

    loadReminders();
    return () => {
      cancelled = true;
    };
  }, []);

  const unread = reminders.filter((item) => isDue(item) && !readIds.has(item.id));

  const markAsRead = (id) => {
    setReadIds((previous) => new Set([...previous, id]));
  };

  return (
    <div className={cn("", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="relative cursor-pointer rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          aria-label={`Notifications${unread.length ? `, ${unread.length} unread` : ""}`}
        >
          {unread.length > 0 && (
            <>
              <span className="absolute end-2 top-1 z-1 h-2.5 w-2.5 animate-ping rounded-full bg-destructive" />
              <span className="absolute end-2 top-1 z-1 h-2.5 w-2.5 rounded-full bg-destructive" />
            </>
          )}
          <span className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-primary/5">
            <Bell className="size-5" />
          </span>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-screen px-0 py-6 sm:w-[360px]">
          <div className="flex items-center justify-between px-6">
            <h3 className="text-lg font-semibold">Reminders</h3>
            {unread.length > 0 && <Badge className="px-3">{unread.length} due</Badge>}
          </div>

          <div className="mt-3 max-h-80 overflow-y-auto">
            {error ? (
              <p className="px-6 py-6 text-sm text-destructive">{error}</p>
            ) : reminders.length ? (
              <div className="flex flex-col">
                {reminders.map((item) => {
                  const due = isDue(item) && !readIds.has(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => markAsRead(item.id)}
                      className="flex w-full cursor-pointer items-center justify-between px-6 py-3 text-left hover:bg-primary/5"
                    >
                      <span className="flex w-full items-center">
                        <span
                          className={cn(
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                            due ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground",
                          )}
                        >
                          <AlarmClock size={20} />
                        </span>
                        <span className="flex w-full justify-between ps-4">
                          <span className="w-3/4 text-start">
                            <span
                              className={cn("mb-1 block text-sm", due ? "font-semibold" : "font-normal")}
                            >
                              {item.title}
                            </span>
                            <span className="line-clamp-1 block text-xs text-muted-foreground">
                              {due ? "Due now" : "Scheduled"}
                            </span>
                          </span>
                          <span className="self-start pt-1.5 text-xs text-muted-foreground">
                            {formatRemindAt(item.remindAt)}
                          </span>
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="px-6 py-6 text-sm text-muted-foreground">No reminders scheduled.</p>
            )}
          </div>

          <div className="px-6 pt-5">
            <Button className="w-full" nativeButton={false} render={<Link href="/" />}>
              Go to Control Center
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

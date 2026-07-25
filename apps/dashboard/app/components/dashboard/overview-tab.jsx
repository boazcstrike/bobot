"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Moon, RefreshCcw, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const RANGE_OPTIONS = ["Last 12 months", "Last 6 months"];

function greetingFor(hour) {
  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  if (hour >= 17 && hour < 21) return "Good Evening";
  return "Good Night";
}

export default function OverviewTab({ userName = "Boaz", range, onRangeChange, onRefresh, refreshing }) {
  // Resolved after mount: the server has no way to know the viewer's clock.
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    setGreeting(greetingFor(new Date().getHours()));
  }, []);

  const isDaytime = greeting === "Good Morning" || greeting === "Good Afternoon";

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 lg:flex-nowrap lg:gap-0">
      <div className="flex flex-col items-start">
        <h2 className="flex items-center gap-2 text-xl">
          {greeting ? `${greeting}, ${userName}` : `Welcome back, ${userName}`}
          <span className="flex items-center">
            {isDaytime ? <Sun size={25} color="orange" /> : <Moon size={25} />}
          </span>
        </h2>
        <p className="text-sm font-normal text-muted-foreground">
          Spend, statements, and repository activity at a glance
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
        <Button
          variant="outline"
          className="h-auto cursor-pointer rounded-lg p-2.5 outline"
          onClick={onRefresh}
          disabled={refreshing}
          aria-label="Refresh dashboard data"
        >
          <RefreshCcw size={16} className={refreshing ? "animate-spin" : undefined} />
        </Button>

        <Select value={range} onValueChange={(value) => value && onRangeChange(value)}>
          <SelectTrigger className="h-auto! w-fit cursor-pointer text-foreground">
            <div className="flex items-center gap-2">
              <CalendarDays size={16} />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            {RANGE_OPTIONS.map((option) => (
              <SelectItem key={option} value={option} className="cursor-pointer">
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export { RANGE_OPTIONS };

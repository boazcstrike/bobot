"use client";

import type { WordFrequency } from "@/lib/expense-dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function WordCloudPanel({ data }: { data: WordFrequency[] }) {
  const max = Math.max(...data.map((item) => item.frequency), 1);
  return (
    <Card className="border border-border/80 bg-card/95 shadow-sm">
      <CardHeader>
        <CardTitle>Word Analysis</CardTitle>
        <CardDescription>Frequent words in descriptions and merchants.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex min-h-72 flex-wrap content-center items-center justify-center gap-3 rounded-xl border border-border/70 bg-background/70 p-5">
          {data.slice(0, 50).map((item) => (
            <span
              key={item.word}
              className="rounded-full border border-border/70 bg-card px-3 py-1 font-medium"
              style={{ fontSize: `${0.78 + (item.frequency / max) * 1.4}rem` }}
              title={`${item.frequency} mentions`}
            >
              {item.word}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

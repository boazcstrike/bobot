"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ForecastExplanationPanel() {
  return (
    <Card className="border border-border/80 bg-card/95 shadow-sm">
      <CardHeader>
        <CardTitle>Forecast Methodology</CardTitle>
        <CardDescription>Assumptions and limitations behind the projections.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm leading-6 text-muted-foreground">
        <p>
          Base forecasts use linear regression over valid yearly totals. The moving-average view uses the trailing
          three valid years when available.
        </p>
        <p>
          Low scenario applies conservative capped growth. High scenario uses CAGR-based growth capped to avoid
          unrealistic compounding from noisy historical data.
        </p>
        <p>
          Forecasts are estimates, not budgets. Dirty rows, one-off purchases, lifestyle changes, and missing source
          data can materially change future spend.
        </p>
      </CardContent>
    </Card>
  );
}

"use client";

import type { CategoryVolatility } from "@/lib/expense-dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPeso } from "./shared";

export function CategoryVolatilityTable({ data }: { data: CategoryVolatility[] }) {
  return (
    <Card className="border border-border/80 bg-card/95 shadow-sm">
      <CardHeader>
        <CardTitle>Category Volatility</CardTitle>
        <CardDescription>Variance, standard deviation, and range ranked by volatility.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Std Dev</TableHead>
              <TableHead>Range</TableHead>
              <TableHead>Average</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.slice(0, 12).map((item) => (
              <TableRow key={item.category}>
                <TableCell>{item.category}</TableCell>
                <TableCell>{formatPeso(item.standardDeviation)}</TableCell>
                <TableCell>{formatPeso(item.range)}</TableCell>
                <TableCell>{formatPeso(item.averageMonthlySpend)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

"use client";

import type { TopCategoryPerMonth } from "@/lib/expense-dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPeso } from "./shared";

export function TopCategoryPerMonthTable({ data }: { data: TopCategoryPerMonth[] }) {
  return (
    <Card className="border border-border/80 bg-card/95 shadow-sm">
      <CardHeader>
        <CardTitle>Top Category Per Month</CardTitle>
        <CardDescription>Winning category, amount, and percentage of month total.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead>Winning Category</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Percentage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.slice(-24).map((item) => (
              <TableRow key={item.dateKey}>
                <TableCell>{item.dateKey}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{formatPeso(item.amount)}</TableCell>
                <TableCell>{item.percentageOfMonthTotal}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

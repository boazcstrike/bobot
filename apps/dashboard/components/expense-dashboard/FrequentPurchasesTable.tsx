"use client";

import type { MerchantTotal } from "@/lib/expense-dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPeso } from "./shared";

export function FrequentPurchasesTable({ data }: { data: MerchantTotal[] }) {
  return (
    <Card className="border border-border/80 bg-card/95 shadow-sm">
      <CardHeader>
        <CardTitle>Frequent Purchases</CardTitle>
        <CardDescription>Merchant frequency and total spend.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Merchant</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Total Spend</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...data].sort((a, b) => b.transactionCount - a.transactionCount || b.totalPhp - a.totalPhp).slice(0, 15).map((item) => (
              <TableRow key={item.merchant}>
                <TableCell>{item.merchant}</TableCell>
                <TableCell>{item.transactionCount}</TableCell>
                <TableCell>{formatPeso(item.totalPhp)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

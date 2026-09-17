"use client";

import { ArrowDownLeft, ArrowUpRight, ReceiptText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardCard } from "@/components/shared/dashboard-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { clockTime, money, quantity } from "./format";

const STATUS_TONE = {
  FILLED: "bg-chart-2/10! text-chart-2!",
  PARTIALLY_FILLED: "bg-chart-2/10! text-chart-2!",
  PENDING: "bg-muted! text-muted-foreground!",
  REJECTED: "bg-destructive/10! text-destructive!",
  NOT_SENT: "bg-destructive/10! text-destructive!",
  UNKNOWN: "bg-destructive/10! text-destructive!",
  CANCELED: "bg-muted! text-muted-foreground!",
};

export default function OrderTable({ orders, loading }) {
  return (
    <DashboardCard className="py-6">
      <CardHeader className="px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base">Orders</CardTitle>
            <p className="text-xs text-muted-foreground">
              Every order the bot intended, including the ones the exchange refused.
            </p>
          </div>
          <div className="w-fit rounded-md border border-border p-2">
            <ReceiptText size={15} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-0">
        {loading ? (
          <div className="px-6">
            <Skeleton className="h-[240px] w-full" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex h-[240px] flex-col items-center justify-center gap-1 px-6 text-center">
            <p className="text-sm text-muted-foreground">No orders yet.</p>
            <p className="text-xs text-muted-foreground">
              Start the bot and wait for the strategy to fire its first signal.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[240px]">
            {/* The seven columns do not fit a phone, so the table scrolls
                sideways inside the card rather than clipping its right edge. */}
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Time</TableHead>
                  <TableHead className="w-20">Side</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="w-28">Status</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const isBuy = order.side === "BUY";
                  const SideIcon = isBuy ? ArrowDownLeft : ArrowUpRight;
                  return (
                    <TableRow key={order.clientOrderId}>
                      <TableCell className="py-2 font-mono text-xs text-muted-foreground tabular-nums">
                        {clockTime(order.createdAt)}
                      </TableCell>
                      <TableCell className="py-2">
                        <span
                          className={`flex items-center gap-1 text-xs font-medium ${isBuy ? "text-chart-2" : "text-destructive"}`}
                        >
                          <SideIcon size={13} />
                          {order.side}
                        </span>
                      </TableCell>
                      <TableCell className="py-2 text-right font-mono text-xs tabular-nums">
                        {quantity(order.filledQty || order.qty, 6)}
                      </TableCell>
                      <TableCell className="py-2 text-right font-mono text-xs tabular-nums">
                        {money(order.avgPrice ?? order.price)}
                      </TableCell>
                      <TableCell className="py-2 text-right font-mono text-xs tabular-nums">
                        {order.quoteSpent > 0 ? money(order.quoteSpent) : "—"}
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge className={`text-xs ${STATUS_TONE[order.status] ?? ""}`}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[240px] truncate py-2 text-xs text-muted-foreground">
                        {order.error ?? order.reason ?? "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </DashboardCard>
  );
}

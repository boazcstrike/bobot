"use client";

import { Box, FileText, Layers, Receipt } from "lucide-react";

import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardCard } from "@/components/shared/dashboard-card";
import { Skeleton } from "@/components/ui/skeleton";

function AssetTile({ title, value, icon: Icon, loading }) {
  return (
    <div className="flex flex-col justify-between gap-6 bg-background p-6">
      <div className="w-fit rounded-md border border-border p-2">
        <Icon width={16} height={16} />
      </div>
      <div>
        {loading ? (
          <Skeleton className="mb-1 h-8 w-16" />
        ) : (
          <h6 className="text-2xl font-semibold">{value}</h6>
        )}
        <p className="text-sm font-normal">{title}</p>
      </div>
    </div>
  );
}

export default function TotalAssets({ expenses, statements, loading }) {
  const tiles = [
    {
      id: "transactions",
      title: "Transactions",
      value: (expenses?.totals?.transactionCount ?? 0).toLocaleString(),
      icon: Receipt,
    },
    {
      id: "categories",
      title: "Categories",
      value: (expenses?.totals?.categoryCount ?? 0).toLocaleString(),
      icon: Layers,
    },
    {
      id: "statements",
      title: "Statements",
      value: (statements?.totalStatements ?? 0).toLocaleString(),
      icon: FileText,
    },
    {
      id: "years",
      title: "Years tracked",
      value: (expenses?.yearly?.length ?? 0).toLocaleString(),
      icon: Box,
    },
  ];

  return (
    <DashboardCard className="flex flex-col gap-0! pb-0!">
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2">
          <Box size={16} className="text-muted-foreground" />
          Tracked Totals
        </CardTitle>
      </CardHeader>

      <CardContent className="h-full! px-0!">
        <div className="grid h-full! grid-cols-2 gap-px bg-border">
          {tiles.map((tile) => (
            <AssetTile key={tile.id} {...tile} loading={loading} />
          ))}
        </div>
      </CardContent>
    </DashboardCard>
  );
}

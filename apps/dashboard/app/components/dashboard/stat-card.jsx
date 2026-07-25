import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { DashboardCard } from "@/components/shared/dashboard-card";
import { Skeleton } from "@/components/ui/skeleton";

// Single-metric tile: label, headline value, optional delta badge, and a link
// through to the page that owns the detail.
export default function StatCard({
  label,
  value,
  badge,
  badgeTone = "neutral",
  icon: Icon,
  href,
  linkLabel = "See details",
  loading = false,
}) {
  return (
    <DashboardCard className="py-6">
      <CardContent className="flex flex-row justify-between px-6">
        <div className="flex w-full flex-col items-start gap-4">
          <div className="flex w-full items-center justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-normal text-foreground">{label}</p>
              <div className="flex items-center gap-2">
                {loading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <h3 className="text-2xl font-semibold">{value}</h3>
                )}
                {badge && !loading ? (
                  <Badge
                    variant={badgeTone === "destructive" ? "destructive" : "default"}
                    className={badgeTone === "positive" ? "bg-chart-2/10! text-chart-2!" : undefined}
                  >
                    {badge}
                  </Badge>
                ) : null}
              </div>
            </div>

            {Icon ? (
              <div className="w-fit rounded-md border border-border p-2.5">
                <Icon size={16} />
              </div>
            ) : null}
          </div>

          {href ? (
            <Button
              variant="outline"
              nativeButton={false}
              className="flex h-auto cursor-pointer gap-1.5 rounded-md px-4 py-2"
              render={<Link href={href} />}
            >
              {linkLabel}
              <ArrowRight width={18} height={18} />
            </Button>
          ) : null}
        </div>
      </CardContent>
    </DashboardCard>
  );
}

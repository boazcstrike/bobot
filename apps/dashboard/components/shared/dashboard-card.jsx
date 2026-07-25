import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Flat, full-height card used across the dashboard grid. Borders come from the
// grid's `gap-px bg-border` band rather than from the card itself.
export function DashboardCard({ className, ...props }) {
  return (
    <Card
      className={cn("h-full rounded-none bg-background shadow-none ring-0", className)}
      {...props}
    />
  );
}

import Link from "next/link";
import { Bot } from "lucide-react";

export default function FullLogo() {
  return (
    <Link href="/" className="flex items-center gap-2 overflow-hidden">
      <span className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Bot className="size-4" />
      </span>
      {/* A div, not a span: the collapsed-rail hover rules stack `div.hide-menu`
          into a column but force `span.hide-menu` inline. */}
      <div className="hide-menu flex flex-col leading-tight">
        <span className="truncate text-sm font-semibold uppercase tracking-wide">Bobot</span>
        <span className="truncate text-xs text-muted-foreground">Control Deck</span>
      </div>
    </Link>
  );
}

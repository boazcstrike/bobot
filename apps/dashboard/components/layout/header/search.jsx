"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Component, Search as SearchIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import sidebarItems from "@/components/layout/sidebar/sidebar-items";

// Walk the nav tree and collect every routable entry whose name matches.
function searchItems(items, query, parentPath = "") {
  return items.flatMap((item) => {
    const currentPath = parentPath ? `${parentPath} / ${item.name}` : item.name;
    const isMatch = item.name && item.url && item.name.toLowerCase().includes(query);
    const self = isMatch ? [{ ...item, path: currentPath }] : [];
    const children = item.items ? searchItems(item.items, query, currentPath) : [];
    return [...self, ...children];
  });
}

export default function Search() {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];
    return searchItems(
      sidebarItems.flatMap((section) => section.items ?? []),
      trimmed,
    );
  }, [query]);

  return (
    <div className="relative w-full">
      <div className="relative mx-auto flex w-xs items-center">
        <SearchIcon
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Search..."
          aria-label="Search navigation"
          className="rounded-lg pl-10!"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div
        className={`absolute start-0 top-11 z-10 w-full rounded-md border border-border bg-card shadow-md ${
          query ? "block" : "hidden"
        }`}
      >
        <div className="max-h-72 overflow-y-auto p-4">
          {results.length ? (
            results.map((item) => (
              <Link
                key={item.id}
                href={item.url}
                onClick={() => setQuery("")}
                className="mb-1.5 flex w-full items-center gap-2 overflow-hidden rounded-md bg-input/30 p-2 text-sm font-medium last:mb-0 hover:bg-primary/5 hover:text-primary"
              >
                <Component width={18} height={18} />
                <span className="ps-3 text-left">
                  <span className="mb-1 block text-sm">{item.path}</span>
                  <span className="block max-w-60 truncate text-xs text-muted-foreground">
                    {item.url}
                  </span>
                </span>
              </Link>
            ))
          ) : (
            <p className="py-8 text-center text-sm font-medium text-muted-foreground">
              No pages found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

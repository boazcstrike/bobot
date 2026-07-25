"use client";

import { useState } from "react";
import { GitFork, Star } from "lucide-react";

import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardCard } from "@/components/shared/dashboard-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TREND_WINDOWS = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
];

export default function TrendingRepos({ snapshot, loading }) {
  const [activeWindow, setActiveWindow] = useState("weekly");
  const repos = snapshot?.[activeWindow] ?? [];

  const generatedAt = snapshot?.generatedAt ? new Date(snapshot.generatedAt) : null;
  const generatedLabel =
    generatedAt && !Number.isNaN(generatedAt.getTime()) ? generatedAt.toLocaleString() : null;

  return (
    <DashboardCard className="flex flex-col gap-0!">
      <CardHeader className="flex flex-wrap items-center justify-between gap-3 border-b border-border">
        <CardTitle className="flex items-center gap-2">
          <GitFork size={16} className="text-muted-foreground" />
          GitHub Trending
        </CardTitle>

        <Tabs value={activeWindow} onValueChange={setActiveWindow}>
          <TabsList>
            {TREND_WINDOWS.map((window) => (
              <TabsTrigger key={window.id} value={window.id} className="cursor-pointer">
                {window.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="px-0!">
        <div className="max-h-96 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 ps-6">#</TableHead>
                <TableHead>Repository</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead className="pe-6 text-right">Stars</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                Array.from({ length: 5 }, (_, index) => (
                  <TableRow key={index}>
                    <TableCell className="ps-6">
                      <Skeleton className="h-4 w-6" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Skeleton className="h-4 w-64" />
                    </TableCell>
                    <TableCell className="pe-6">
                      <Skeleton className="ml-auto h-4 w-16" />
                    </TableCell>
                  </TableRow>
                ))
              ) : repos.length ? (
                repos.map((repo, index) => (
                  <TableRow key={repo.id ?? repo.full_name}>
                    <TableCell className="ps-6 text-muted-foreground">{index + 1}</TableCell>
                    <TableCell>
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium hover:text-primary hover:underline"
                      >
                        {repo.full_name}
                      </a>
                    </TableCell>
                    <TableCell className="hidden max-w-md truncate text-muted-foreground md:table-cell">
                      {repo.description || "No description provided."}
                    </TableCell>
                    <TableCell className="pe-6 text-right">
                      <span className="inline-flex items-center gap-1.5 tabular-nums">
                        <Star size={14} className="text-muted-foreground" />
                        {Number(repo.stargazers_count || 0).toLocaleString()}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    No trending repositories loaded.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <p className="px-6 pt-4 text-xs text-muted-foreground">
          Source: {snapshot?.source || "unknown"}
          {snapshot?.snapshotDate ? ` · Snapshot: ${snapshot.snapshotDate}` : ""}
          {generatedLabel ? ` · Generated: ${generatedLabel}` : ""}
          {snapshot?.stale ? " · stale fallback" : ""}
        </p>
      </CardContent>
    </DashboardCard>
  );
}

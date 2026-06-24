"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import type { Trade } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney, formatDateOnly, pnlColor } from "@/lib/utils";

interface RecentTradesProps {
  trades: Trade[];
  isLoading?: boolean;
}

export function RecentTrades({ trades, isLoading }: RecentTradesProps) {
  const recent = trades
    .filter((t) => t.status === "CLOSED")
    .sort(
      (a, b) =>
        new Date(b.close_time ?? b.open_time).getTime() -
        new Date(a.close_time ?? a.open_time).getTime()
    )
    .slice(0, 5);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Trades</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Trades</CardTitle>
        <Link href="/trades" className="text-xs text-primary hover:underline">
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {recent.length === 0 ? (
          <p className="text-sm text-text-muted py-4 text-center">
            No trades yet — import from MT5 or add your first trade.
          </p>
        ) : (
          <div className="space-y-1">
            {recent.map((t) => (
              <Link
                key={t.id}
                href={`/trades/${t.id}`}
                className="flex items-center justify-between rounded-md px-3 py-2.5 hover:bg-background transition-colors"
              >
                <div className="flex items-center gap-3">
                  {t.starred && <Star className="h-3.5 w-3.5 fill-warning text-warning" />}
                  <Badge variant={t.type === "BUY" ? "buy" : "sell"}>{t.type}</Badge>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-text-primary">{t.symbol}</span>
                    <span className="text-xs text-text-muted">
                      {formatDateOnly(t.close_time ?? t.open_time)}
                    </span>
                  </div>
                </div>
                <span className={`text-sm font-mono font-medium ${pnlColor(t.profit)}`}>
                  {formatMoney(t.profit)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

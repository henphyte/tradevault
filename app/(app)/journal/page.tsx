"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useTrades } from "@/hooks/useTrades";
import { JournalCalendar } from "@/components/journal/JournalCalendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { calculateDailyPnL } from "@/lib/analytics";
import { formatMoney, formatDateOnly, pnlColor } from "@/lib/utils";

export default function JournalListPage() {
  const { trades, isLoading } = useTrades();

  const recentDays = useMemo(() => {
    return calculateDailyPnL(trades)
      .slice()
      .reverse()
      .slice(0, 10);
  }, [trades]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-medium text-text-primary tracking-tight">
          Journal
        </h1>
        <p className="text-sm text-text-muted">
          Daily pre-market plans, mental state, and post-session reviews
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          {isLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <JournalCalendar trades={trades} />
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Trading Days</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : recentDays.length === 0 ? (
              <p className="text-sm text-text-muted py-4 text-center">
                No trading days logged yet.
              </p>
            ) : (
              <div className="space-y-1">
                {recentDays.map((day) => (
                  <Link
                    key={day.date}
                    href={`/journal/${day.date}`}
                    className="flex items-center justify-between rounded-md px-3 py-2.5 hover:bg-background transition-colors"
                  >
                    <span className="text-sm text-text-primary">{formatDateOnly(day.date)}</span>
                    <span className={`text-sm font-mono font-medium ${pnlColor(day.pnl)}`}>
                      {formatMoney(day.pnl)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

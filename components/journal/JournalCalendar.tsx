"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Trade } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { calculateDailyPnL } from "@/lib/analytics";
import { cn } from "@/lib/utils";

interface JournalCalendarProps {
  trades: Trade[];
}

function toDateKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function JournalCalendar({ trades }: JournalCalendarProps) {
  const router = useRouter();
  const [viewDate, setViewDate] = useState(new Date());

  const dailyPnLMap = useMemo(() => {
    const daily = calculateDailyPnL(trades);
    const map = new Map<string, number>();
    for (const d of daily) map.set(d.date, d.pnl);
    return map;
  }, [trades]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const startOffset = (firstDayOfMonth.getDay() + 6) % 7; // make Monday=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  const monthLabel = viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const today = toDateKey(new Date());

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{monthLabel}</CardTitle>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewDate(new Date(year, month - 1, 1))}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewDate(new Date(year, month + 1, 1))}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="text-center text-xs text-text-muted py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((date, i) => {
            if (!date) return <div key={i} />;
            const key = toDateKey(date);
            const pnl = dailyPnLMap.get(key);
            const hasTrades = pnl !== undefined;
            const isToday = key === today;

            return (
              <button
                key={i}
                onClick={() => router.push(`/journal/${key}`)}
                className={cn(
                  "aspect-square rounded-md flex flex-col items-center justify-center gap-0.5 text-xs transition-colors hover:bg-background",
                  isToday && "ring-1 ring-primary"
                )}
              >
                <span className="text-text-primary">{date.getDate()}</span>
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    !hasTrades && "bg-border",
                    hasTrades && pnl! > 0 && "bg-profit",
                    hasTrades && pnl! < 0 && "bg-loss",
                    hasTrades && pnl === 0 && "bg-text-muted"
                  )}
                />
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

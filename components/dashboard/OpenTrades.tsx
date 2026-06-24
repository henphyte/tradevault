"use client";

import { useState } from "react";
import { Radio } from "lucide-react";
import type { Trade } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney, pnlColor } from "@/lib/utils";
import { useProfile } from "@/hooks/useProfile";
import { useRealtime } from "@/hooks/useRealtime";

interface OpenTradesProps {
  trades: Trade[];
  isLoading?: boolean;
}

export function OpenTrades({ trades, isLoading }: OpenTradesProps) {
  const { activeProfileId } = useProfile();
  const [liveTrades, setLiveTrades] = useState<Trade[]>([]);

  useRealtime({
    profileId: activeProfileId,
    onInsert: (trade) => {
      if (trade.status === "OPEN") {
        setLiveTrades((prev) => [trade, ...prev.filter((t) => t.id !== trade.id)]);
      }
    },
    onUpdate: (trade) => {
      setLiveTrades((prev) =>
        trade.status === "OPEN"
          ? prev.map((t) => (t.id === trade.id ? trade : t))
          : prev.filter((t) => t.id !== trade.id)
      );
    },
    onDelete: (id) => {
      setLiveTrades((prev) => prev.filter((t) => t.id !== id));
    },
  });

  const openFromProps = trades.filter((t) => t.status === "OPEN");
  const merged = [
    ...liveTrades,
    ...openFromProps.filter((t) => !liveTrades.some((lt) => lt.id === t.id)),
  ];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Open Positions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Open Positions</CardTitle>
        {merged.length > 0 && (
          <span className="flex items-center gap-1 text-xs text-profit">
            <Radio className="h-3 w-3 animate-pulse-glow" />
            Live
          </span>
        )}
      </CardHeader>
      <CardContent>
        {merged.length === 0 ? (
          <p className="text-sm text-text-muted py-4 text-center">
            No open positions right now.
          </p>
        ) : (
          <div className="space-y-2">
            {merged.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2.5"
              >
                <div className="flex items-center gap-3">
                  <Badge variant={t.type === "BUY" ? "buy" : "sell"}>{t.type}</Badge>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-text-primary">{t.symbol}</span>
                    <span className="text-xs text-text-muted">{t.lot_size} lots</span>
                  </div>
                </div>
                <span className={`text-sm font-mono font-medium ${pnlColor(t.profit)}`}>
                  {t.profit !== null ? formatMoney(t.profit) : "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

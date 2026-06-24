"use client";

import { TrendingUp, Percent, Target, Scale, ListOrdered, Trophy } from "lucide-react";
import type { AnalyticsSummary } from "@/types";
import { formatMoney, formatPct, formatRR, pnlColor } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsCardsProps {
  summary: AnalyticsSummary;
  isLoading?: boolean;
}

interface StatItem {
  label: string;
  value: string;
  icon: React.ElementType;
  valueClassName?: string;
}

export function StatsCards({ summary, isLoading }: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-6 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const items: StatItem[] = [
    {
      label: "Total P&L",
      value: formatMoney(summary.totalPnL),
      icon: TrendingUp,
      valueClassName: pnlColor(summary.totalPnL),
    },
    {
      label: "Win Rate",
      value: formatPct(summary.winRate),
      icon: Percent,
    },
    {
      label: "Profit Factor",
      value: summary.profitFactor.toFixed(2),
      icon: Scale,
    },
    {
      label: "Avg RR",
      value: formatRR(summary.averageRR),
      icon: Target,
    },
    {
      label: "Total Trades",
      value: String(summary.totalTrades),
      icon: ListOrdered,
    },
    {
      label: "Best Trade",
      value: formatMoney(summary.bestTrade),
      icon: Trophy,
      valueClassName: pnlColor(summary.bestTrade),
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-text-muted">{item.label}</span>
                <Icon className="h-3.5 w-3.5 text-text-muted" />
              </div>
              <span className={`text-lg font-mono font-medium ${item.valueClassName ?? "text-text-primary"}`}>
                {item.value}
              </span>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

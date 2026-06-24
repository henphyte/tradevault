"use client";

import { useProfile } from "@/hooks/useProfile";
import { useTrades } from "@/hooks/useTrades";
import { useAnalytics } from "@/hooks/useAnalytics";
import { EquityCurve } from "@/components/dashboard/EquityCurve";
import { WinRateBySymbol } from "@/components/analytics/WinRateBySymbol";
import { DayOfWeekChart } from "@/components/analytics/DayOfWeekChart";
import { SessionPerformance } from "@/components/analytics/SessionPerformance";
import { SessionHeatmap } from "@/components/analytics/SessionHeatmap";
import { EmotionPnL } from "@/components/analytics/EmotionPnL";
import { DrawdownChart } from "@/components/analytics/DrawdownChart";
import { RRDistribution } from "@/components/analytics/RRDistribution";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsPage() {
  const { activeProfile, isLoading: profileLoading } = useProfile();
  const { trades, isLoading: tradesLoading } = useTrades();
  const startingBalance = activeProfile?.starting_balance ?? 10000;

  const {
    summary,
    dailyPnL,
    sessionStats,
    symbolStats,
    dayOfWeekStats,
    drawdownSeries,
    rrDistribution,
    heatmap,
  } = useAnalytics(trades, startingBalance);

  const isLoading = profileLoading || tradesLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-medium text-text-primary tracking-tight">
          Analytics
        </h1>
        <p className="text-sm text-text-muted">Deep dive into your trading performance</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryStat label="Profit Factor" value={summary.profitFactor.toFixed(2)} isLoading={isLoading} />
        <SummaryStat
          label="Sharpe-like Ratio"
          value={summary.sharpeLike.toFixed(2)}
          isLoading={isLoading}
        />
        <SummaryStat
          label="Expectancy / Trade"
          value={`$${summary.expectancy.toFixed(2)}`}
          isLoading={isLoading}
        />
        <SummaryStat
          label="Max Consecutive Losses"
          value={String(summary.maxConsecutiveLosses)}
          isLoading={isLoading}
        />
      </div>

      <EquityCurve data={dailyPnL} isLoading={isLoading} startingBalance={startingBalance} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WinRateBySymbol data={symbolStats} />
        <DayOfWeekChart data={dayOfWeekStats} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SessionPerformance data={sessionStats} />
        <RRDistribution data={rrDistribution} />
      </div>

      <SessionHeatmap data={heatmap} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <EmotionPnL trades={trades} />
        <DrawdownChart data={drawdownSeries} />
      </div>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  isLoading,
}: {
  label: string;
  value: string;
  isLoading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-7 w-16" />
        ) : (
          <span className="text-xl font-mono font-medium text-text-primary">{value}</span>
        )}
      </CardContent>
    </Card>
  );
}

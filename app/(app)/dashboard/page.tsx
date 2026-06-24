"use client";

import { useMemo } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useTrades } from "@/hooks/useTrades";
import { useAnalytics } from "@/hooks/useAnalytics";
import { EquityCurve } from "@/components/dashboard/EquityCurve";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { DrawdownMeter } from "@/components/dashboard/DrawdownMeter";
import { OpenTrades } from "@/components/dashboard/OpenTrades";
import { RecentTrades } from "@/components/dashboard/RecentTrades";
import { calculateDailyPnL } from "@/lib/analytics";

export default function DashboardPage() {
  const { activeProfile, isLoading: profileLoading } = useProfile();
  const { trades, isLoading: tradesLoading } = useTrades();

  const monthTrades = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    return trades.filter((t) => t.open_time >= monthStart);
  }, [trades]);

  const { summary, dailyPnL } = useAnalytics(monthTrades, activeProfile?.starting_balance ?? 10000);

  const todayLoss = useMemo(() => {
    const daily = calculateDailyPnL(trades);
    const today = new Date().toISOString().slice(0, 10);
    const todayEntry = daily.find((d) => d.date === today);
    const pnl = todayEntry?.pnl ?? 0;
    return pnl < 0 ? Math.abs(pnl) : 0;
  }, [trades]);

  const dailyLossLimitAbs = activeProfile
    ? (activeProfile.daily_loss_limit_pct / 100) * activeProfile.account_size
    : 0;

  const isLoading = profileLoading || tradesLoading;

  if (!profileLoading && !activeProfile) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="font-display text-lg font-medium text-text-primary mb-2">
          No trading profile yet
        </h2>
        <p className="text-sm text-text-muted max-w-sm">
          Create a prop firm profile to start tracking trades, P&amp;L, and risk limits.
        </p>
        <a
          href="/profiles"
          className="mt-4 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Create your first profile
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-medium text-text-primary tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-text-muted">This month's performance overview</p>
        </div>
      </div>

      <StatsCards summary={summary} isLoading={isLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <EquityCurve
            data={dailyPnL}
            isLoading={isLoading}
            startingBalance={activeProfile?.starting_balance ?? 10000}
          />
        </div>
        <DrawdownMeter
          currentDailyLoss={todayLoss}
          dailyLossLimit={dailyLossLimitAbs}
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <OpenTrades trades={trades} isLoading={isLoading} />
        <RecentTrades trades={trades} isLoading={isLoading} />
      </div>
    </div>
  );
}

"use client";

import { useMemo } from "react";
import type { Trade } from "@/types";
import {
  calculateAnalyticsSummary,
  calculateDailyPnL,
  groupBySession,
  groupBySymbol,
  groupByDayOfWeek,
  groupByEmotion,
  calculateStreak,
  buildHeatmap,
  calculateDrawdownSeries,
  calculateRRDistribution,
} from "@/lib/analytics";

export function useAnalytics(trades: Trade[], startingBalance = 10000) {
  const summary = useMemo(
    () => calculateAnalyticsSummary(trades, startingBalance),
    [trades, startingBalance]
  );

  const dailyPnL = useMemo(() => calculateDailyPnL(trades), [trades]);
  const sessionStats = useMemo(() => groupBySession(trades), [trades]);
  const symbolStats = useMemo(() => groupBySymbol(trades), [trades]);
  const dayOfWeekStats = useMemo(() => groupByDayOfWeek(trades), [trades]);
  const emotionStats = useMemo(() => groupByEmotion(trades), [trades]);
  const streak = useMemo(() => calculateStreak(trades), [trades]);
  const heatmap = useMemo(() => buildHeatmap(trades), [trades]);
  const drawdownSeries = useMemo(
    () => calculateDrawdownSeries(trades, startingBalance),
    [trades, startingBalance]
  );
  const rrDistribution = useMemo(() => calculateRRDistribution(trades), [trades]);

  return {
    summary,
    dailyPnL,
    sessionStats,
    symbolStats,
    dayOfWeekStats,
    emotionStats,
    streak,
    heatmap,
    drawdownSeries,
    rrDistribution,
  };
}

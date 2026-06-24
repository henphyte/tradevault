import type {
  Trade,
  DailyPnL,
  SessionStats,
  SymbolStats,
  DayStats,
  EmotionStats,
  StreakInfo,
  HeatmapCell,
  AnalyticsSummary,
  Session,
  Emotion,
} from "@/types";

/** Only closed trades count toward performance stats. */
function closedTrades(trades: Trade[]): Trade[] {
  return trades.filter((t) => t.status === "CLOSED" && t.profit !== null);
}

export function calculateWinRate(trades: Trade[]): number {
  const closed = closedTrades(trades);
  if (closed.length === 0) return 0;
  const wins = closed.filter((t) => (t.profit ?? 0) > 0).length;
  return (wins / closed.length) * 100;
}

export function calculateProfitFactor(trades: Trade[]): number {
  const closed = closedTrades(trades);
  const grossProfit = closed
    .filter((t) => (t.profit ?? 0) > 0)
    .reduce((sum, t) => sum + (t.profit ?? 0), 0);
  const grossLoss = Math.abs(
    closed.filter((t) => (t.profit ?? 0) < 0).reduce((sum, t) => sum + (t.profit ?? 0), 0)
  );
  if (grossLoss === 0) return grossProfit > 0 ? grossProfit : 0;
  return grossProfit / grossLoss;
}

export function calculateAverageRR(trades: Trade[]): number {
  const withRR = closedTrades(trades).filter((t) => t.rr !== null && t.rr !== undefined);
  if (withRR.length === 0) return 0;
  const sum = withRR.reduce((acc, t) => acc + (t.rr ?? 0), 0);
  return sum / withRR.length;
}

export function calculateExpectancy(trades: Trade[]): number {
  const closed = closedTrades(trades);
  if (closed.length === 0) return 0;
  const wins = closed.filter((t) => (t.profit ?? 0) > 0);
  const losses = closed.filter((t) => (t.profit ?? 0) < 0);

  const winRate = wins.length / closed.length;
  const lossRate = losses.length / closed.length;

  const avgWin = wins.length
    ? wins.reduce((sum, t) => sum + (t.profit ?? 0), 0) / wins.length
    : 0;
  const avgLoss = losses.length
    ? Math.abs(losses.reduce((sum, t) => sum + (t.profit ?? 0), 0) / losses.length)
    : 0;

  return winRate * avgWin - lossRate * avgLoss;
}

/** Calculates max drawdown (%) based on running equity from a starting balance. */
export function calculateMaxDrawdown(trades: Trade[], startingBalance = 10000): number {
  const closed = closedTrades(trades).slice().sort(
    (a, b) => new Date(a.close_time ?? a.open_time).getTime() - new Date(b.close_time ?? b.open_time).getTime()
  );

  let equity = startingBalance;
  let peak = startingBalance;
  let maxDD = 0;

  for (const t of closed) {
    equity += t.profit ?? 0;
    if (equity > peak) peak = equity;
    const dd = peak > 0 ? ((peak - equity) / peak) * 100 : 0;
    if (dd > maxDD) maxDD = dd;
  }

  return maxDD;
}

export function calculateDailyPnL(trades: Trade[]): DailyPnL[] {
  const closed = closedTrades(trades);
  const byDate = new Map<string, { pnl: number; trades: number }>();

  for (const t of closed) {
    const dateKey = (t.close_time ?? t.open_time).slice(0, 10);
    const existing = byDate.get(dateKey) ?? { pnl: 0, trades: 0 };
    existing.pnl += t.profit ?? 0;
    existing.trades += 1;
    byDate.set(dateKey, existing);
  }

  const sortedDates = Array.from(byDate.keys()).sort();
  let cumulative = 0;
  return sortedDates.map((date) => {
    const entry = byDate.get(date)!;
    cumulative += entry.pnl;
    return {
      date,
      pnl: entry.pnl,
      cumulative,
      trades: entry.trades,
    };
  });
}

export function groupBySession(trades: Trade[]): SessionStats[] {
  const closed = closedTrades(trades);
  const sessions: Session[] = ["London", "New York", "Tokyo", "Sydney", "Overlap"];

  return sessions
    .map((session) => {
      const sessionTrades = closed.filter((t) => t.session === session);
      const wins = sessionTrades.filter((t) => (t.profit ?? 0) > 0).length;
      const totalPnL = sessionTrades.reduce((sum, t) => sum + (t.profit ?? 0), 0);
      return {
        session,
        trades: sessionTrades.length,
        winRate: sessionTrades.length ? (wins / sessionTrades.length) * 100 : 0,
        avgPnL: sessionTrades.length ? totalPnL / sessionTrades.length : 0,
        totalPnL,
      };
    })
    .filter((s) => s.trades > 0);
}

export function groupBySymbol(trades: Trade[]): SymbolStats[] {
  const closed = closedTrades(trades);
  const bySymbol = new Map<string, Trade[]>();

  for (const t of closed) {
    const arr = bySymbol.get(t.symbol) ?? [];
    arr.push(t);
    bySymbol.set(t.symbol, arr);
  }

  const stats: SymbolStats[] = Array.from(bySymbol.entries()).map(([symbol, symTrades]) => {
    const wins = symTrades.filter((t) => (t.profit ?? 0) > 0).length;
    const totalPnL = symTrades.reduce((sum, t) => sum + (t.profit ?? 0), 0);
    return {
      symbol,
      trades: symTrades.length,
      winRate: (wins / symTrades.length) * 100,
      totalPnL,
      avgPnL: totalPnL / symTrades.length,
    };
  });

  return stats.sort((a, b) => b.trades - a.trades).slice(0, 10);
}

export function groupByDayOfWeek(trades: Trade[]): DayStats[] {
  const closed = closedTrades(trades);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const order = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const byDay = new Map<string, Trade[]>();
  for (const t of closed) {
    const d = new Date(t.close_time ?? t.open_time);
    const dayName = dayNames[d.getDay()];
    const arr = byDay.get(dayName) ?? [];
    arr.push(t);
    byDay.set(dayName, arr);
  }

  return order
    .map((day) => {
      const dayTrades = byDay.get(day) ?? [];
      const wins = dayTrades.filter((t) => (t.profit ?? 0) > 0).length;
      const totalPnL = dayTrades.reduce((sum, t) => sum + (t.profit ?? 0), 0);
      return {
        day,
        trades: dayTrades.length,
        winRate: dayTrades.length ? (wins / dayTrades.length) * 100 : 0,
        totalPnL,
      };
    })
    .filter((d) => d.trades > 0);
}

export function groupByEmotion(trades: Trade[]): EmotionStats[] {
  const closed = closedTrades(trades);
  const emotions: Emotion[] = [
    "Calm",
    "Confident",
    "Anxious",
    "Fearful",
    "Greedy",
    "Neutral",
  ];

  return emotions
    .map((emotion) => {
      const emoTrades = closed.filter((t) => t.emotion === emotion);
      const wins = emoTrades.filter((t) => (t.profit ?? 0) > 0).length;
      const totalPnL = emoTrades.reduce((sum, t) => sum + (t.profit ?? 0), 0);
      return {
        emotion,
        trades: emoTrades.length,
        avgPnL: emoTrades.length ? totalPnL / emoTrades.length : 0,
        totalPnL,
        winRate: emoTrades.length ? (wins / emoTrades.length) * 100 : 0,
      };
    })
    .filter((e) => e.trades > 0);
}

export function calculateStreak(trades: Trade[]): StreakInfo {
  const closed = closedTrades(trades)
    .slice()
    .sort(
      (a, b) =>
        new Date(a.close_time ?? a.open_time).getTime() -
        new Date(b.close_time ?? b.open_time).getTime()
    );

  if (closed.length === 0) {
    return { current: 0, type: "none", maxWinStreak: 0, maxLossStreak: 0 };
  }

  let maxWinStreak = 0;
  let maxLossStreak = 0;
  let runningWin = 0;
  let runningLoss = 0;

  for (const t of closed) {
    if ((t.profit ?? 0) > 0) {
      runningWin += 1;
      runningLoss = 0;
      maxWinStreak = Math.max(maxWinStreak, runningWin);
    } else if ((t.profit ?? 0) < 0) {
      runningLoss += 1;
      runningWin = 0;
      maxLossStreak = Math.max(maxLossStreak, runningLoss);
    } else {
      runningWin = 0;
      runningLoss = 0;
    }
  }

  // Determine current streak from the tail
  let current = 0;
  let type: "win" | "loss" | "none" = "none";
  for (let i = closed.length - 1; i >= 0; i--) {
    const profit = closed[i].profit ?? 0;
    if (profit === 0) break;
    const thisType = profit > 0 ? "win" : "loss";
    if (type === "none") {
      type = thisType;
      current = 1;
    } else if (thisType === type) {
      current += 1;
    } else {
      break;
    }
  }

  return { current, type, maxWinStreak, maxLossStreak };
}

export function buildHeatmap(trades: Trade[]): HeatmapCell[] {
  const closed = closedTrades(trades);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const map = new Map<string, { pnl: number; trades: number }>();

  for (const t of closed) {
    const d = new Date(t.open_time);
    const day = dayNames[d.getDay()];
    const hour = d.getUTCHours();
    const key = `${day}-${hour}`;
    const existing = map.get(key) ?? { pnl: 0, trades: 0 };
    existing.pnl += t.profit ?? 0;
    existing.trades += 1;
    map.set(key, existing);
  }

  const cells: HeatmapCell[] = [];
  for (const [key, value] of map.entries()) {
    const [day, hourStr] = key.split("-");
    cells.push({ day, hour: parseInt(hourStr, 10), pnl: value.pnl, trades: value.trades });
  }
  return cells;
}

/** Rolling drawdown series for charting (% drawdown from peak equity over time). */
export function calculateDrawdownSeries(
  trades: Trade[],
  startingBalance = 10000
): { date: string; drawdownPct: number }[] {
  const closed = closedTrades(trades).slice().sort(
    (a, b) => new Date(a.close_time ?? a.open_time).getTime() - new Date(b.close_time ?? b.open_time).getTime()
  );

  let equity = startingBalance;
  let peak = startingBalance;
  const series: { date: string; drawdownPct: number }[] = [];

  for (const t of closed) {
    equity += t.profit ?? 0;
    if (equity > peak) peak = equity;
    const dd = peak > 0 ? ((peak - equity) / peak) * 100 : 0;
    series.push({ date: (t.close_time ?? t.open_time).slice(0, 10), drawdownPct: dd });
  }

  return series;
}

/** Distribution buckets of achieved RR for histogram charting. */
export function calculateRRDistribution(
  trades: Trade[]
): { bucket: string; count: number }[] {
  const withRR = closedTrades(trades).filter((t) => t.rr !== null && t.rr !== undefined);
  const buckets = [
    { label: "< -1R", min: -Infinity, max: -1 },
    { label: "-1R to 0R", min: -1, max: 0 },
    { label: "0R to 1R", min: 0, max: 1 },
    { label: "1R to 2R", min: 1, max: 2 },
    { label: "2R to 3R", min: 2, max: 3 },
    { label: "> 3R", min: 3, max: Infinity },
  ];

  return buckets.map((b) => ({
    bucket: b.label,
    count: withRR.filter((t) => (t.rr ?? 0) >= b.min && (t.rr ?? 0) < b.max).length,
  }));
}

/** A simple Sharpe-like ratio: mean daily P&L / stddev of daily P&L. */
export function calculateSharpeLike(trades: Trade[]): number {
  const daily = calculateDailyPnL(trades);
  if (daily.length < 2) return 0;
  const mean = daily.reduce((sum, d) => sum + d.pnl, 0) / daily.length;
  const variance =
    daily.reduce((sum, d) => sum + Math.pow(d.pnl - mean, 2), 0) / daily.length;
  const stdDev = Math.sqrt(variance);
  if (stdDev === 0) return 0;
  return (mean / stdDev) * Math.sqrt(daily.length);
}

/** Full analytics summary used by the dashboard and analytics page. */
export function calculateAnalyticsSummary(
  trades: Trade[],
  startingBalance = 10000
): AnalyticsSummary {
  const closed = closedTrades(trades);
  const profits = closed.map((t) => t.profit ?? 0);
  const streaks = calculateStreak(trades);

  return {
    totalPnL: profits.reduce((sum, p) => sum + p, 0),
    winRate: calculateWinRate(trades),
    profitFactor: calculateProfitFactor(trades),
    averageRR: calculateAverageRR(trades),
    totalTrades: closed.length,
    bestTrade: profits.length ? Math.max(...profits) : 0,
    worstTrade: profits.length ? Math.min(...profits) : 0,
    expectancy: calculateExpectancy(trades),
    maxDrawdown: calculateMaxDrawdown(trades, startingBalance),
    sharpeLike: calculateSharpeLike(trades),
    maxConsecutiveLosses: streaks.maxLossStreak,
    maxConsecutiveWins: streaks.maxWinStreak,
  };
}

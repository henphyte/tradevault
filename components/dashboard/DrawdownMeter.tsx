"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney, clamp } from "@/lib/utils";

interface DrawdownMeterProps {
  currentDailyLoss: number; // positive number representing loss magnitude
  dailyLossLimit: number; // absolute $ value of the limit
  isLoading?: boolean;
}

export function DrawdownMeter({ currentDailyLoss, dailyLossLimit, isLoading }: DrawdownMeterProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Loss Limit</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <Skeleton className="h-40 w-40 rounded-full" />
        </CardContent>
      </Card>
    );
  }

  const pct = dailyLossLimit > 0 ? clamp((currentDailyLoss / dailyLossLimit) * 100, 0, 100) : 0;
  const color = pct >= 100 ? "#ef4444" : pct >= 80 ? "#f59e0b" : "#6366f1";

  const radius = 70;
  const stroke = 12;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Loss Limit</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3">
        <div className="relative h-40 w-40">
          <svg width="160" height="160" className="-rotate-90">
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="#1e1e2e"
              strokeWidth={stroke}
            />
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={stroke}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.6s ease-out, stroke 0.3s" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-mono font-semibold" style={{ color }}>
              {pct.toFixed(0)}%
            </span>
            <span className="text-xs text-text-muted">of limit</span>
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-mono text-text-primary">
            {formatMoney(-currentDailyLoss)} / {formatMoney(-dailyLossLimit)}
          </p>
          <p className="text-xs text-text-muted mt-0.5">
            {pct >= 100
              ? "Limit breached — stop trading"
              : pct >= 80
              ? "Approaching daily limit"
              : "Within safe range"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

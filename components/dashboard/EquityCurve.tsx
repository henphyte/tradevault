"use client";

import { useEffect, useId, useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { DailyPnL } from "@/types";
import { formatMoney, formatDateOnly } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface EquityCurveProps {
  data: DailyPnL[];
  isLoading?: boolean;
  startingBalance?: number;
}

interface TooltipPayloadItem {
  value: number;
  payload: { date: string; equity: number };
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  return (
    <div className="card-surface px-3 py-2 shadow-xl">
      <p className="text-xs text-text-muted">{formatDateOnly(point.date)}</p>
      <p className="text-sm font-mono font-medium text-text-primary">
        {formatMoney(point.equity)}
      </p>
    </div>
  );
}

export function EquityCurve({ data, isLoading, startingBalance = 10000 }: EquityCurveProps) {
  const gradientId = useId();
  const [animationKey, setAnimationKey] = useState(0);

  const chartData = useMemo(
    () =>
      data.map((d) => ({
        date: d.date,
        equity: startingBalance + d.cumulative,
      })),
    [data, startingBalance]
  );

  const isProfit =
    chartData.length > 1 && chartData[chartData.length - 1].equity >= chartData[0].equity;

  useEffect(() => {
    // Re-trigger the draw-in pulse whenever new trade data lands
    setAnimationKey((k) => k + 1);
  }, [data.length]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Equity Curve</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Equity Curve</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-sm text-text-muted">
            No closed trades yet — your equity curve will draw itself here.
          </div>
        </CardContent>
      </Card>
    );
  }

  const lineColor = isProfit ? "#22c55e" : "#ef4444";

  return (
    <Card className="overflow-hidden relative">
      <CardHeader>
        <CardTitle>Equity Curve</CardTitle>
      </CardHeader>
      <CardContent>
        <div key={animationKey} className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={lineColor} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1e1e2e" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(v: string) => formatDateOnly(v).slice(0, 6)}
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#1e1e2e" }}
                minTickGap={32}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="equity"
                stroke={lineColor}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                isAnimationActive={true}
                animationDuration={1400}
                animationEasing="ease-out"
                dot={false}
                activeDot={{ r: 4, fill: lineColor, stroke: "#0a0a0f", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateOnly } from "@/lib/utils";

interface DrawdownChartProps {
  data: { date: string; drawdownPct: number }[];
}

interface TooltipPayloadItem {
  value: number;
  payload: { date: string; drawdownPct: number };
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  return (
    <div className="card-surface px-3 py-2 shadow-xl">
      <p className="text-xs text-text-muted">{formatDateOnly(d.date)}</p>
      <p className="text-sm font-mono text-loss">-{d.drawdownPct.toFixed(2)}%</p>
    </div>
  );
}

export function DrawdownChart({ data }: DrawdownChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rolling Drawdown</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-muted py-8 text-center">No closed trades yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rolling Drawdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="ddGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
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
                tickFormatter={(v: number) => `${v}%`}
                reversed
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="drawdownPct"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#ddGradient)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

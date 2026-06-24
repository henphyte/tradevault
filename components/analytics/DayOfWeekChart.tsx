"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";
import type { DayStats } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney, formatPct } from "@/lib/utils";

interface DayOfWeekChartProps {
  data: DayStats[];
}

interface TooltipPayloadItem {
  payload: DayStats;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  return (
    <div className="card-surface px-3 py-2 shadow-xl">
      <p className="text-sm font-medium text-text-primary">{d.day}</p>
      <p className="text-xs text-text-muted">{d.trades} trades</p>
      <p className="text-xs text-text-primary">Win rate: {formatPct(d.winRate)}</p>
      <p className="text-xs text-text-primary">P&amp;L: {formatMoney(d.totalPnL)}</p>
    </div>
  );
}

export function DayOfWeekChart({ data }: DayOfWeekChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>P&amp;L by Day of Week</CardTitle>
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
        <CardTitle>P&amp;L by Day of Week</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid stroke="#1e1e2e" vertical={false} />
              <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} axisLine={{ stroke: "#1e1e2e" }} />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `$${v}`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#1e1e2e" }} />
              <Bar dataKey="totalPnL" radius={[4, 4, 0, 0]}>
                {data.map((d, i) => (
                  <Cell key={i} fill={d.totalPnL >= 0 ? "#22c55e" : "#ef4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

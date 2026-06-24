"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import type { SessionStats } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney, formatPct } from "@/lib/utils";

interface SessionPerformanceProps {
  data: SessionStats[];
}

interface TooltipPayloadItem {
  payload: SessionStats;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  return (
    <div className="card-surface px-3 py-2 shadow-xl">
      <p className="text-sm font-medium text-text-primary">{d.session}</p>
      <p className="text-xs text-text-muted">{d.trades} trades</p>
      <p className="text-xs text-text-primary">Win rate: {formatPct(d.winRate)}</p>
      <p className="text-xs text-text-primary">Avg P&amp;L: {formatMoney(d.avgPnL)}</p>
    </div>
  );
}

export function SessionPerformance({ data }: SessionPerformanceProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Session Performance</CardTitle>
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
        <CardTitle>Session Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid stroke="#1e1e2e" vertical={false} />
              <XAxis dataKey="session" stroke="#64748b" fontSize={11} tickLine={false} axisLine={{ stroke: "#1e1e2e" }} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#1e1e2e" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="trades" name="Trades" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="winRate" name="Win Rate %" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

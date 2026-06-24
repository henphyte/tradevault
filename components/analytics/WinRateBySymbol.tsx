"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { SymbolStats } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPct, formatMoney } from "@/lib/utils";

interface WinRateBySymbolProps {
  data: SymbolStats[];
}

interface TooltipPayloadItem {
  payload: SymbolStats;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  return (
    <div className="card-surface px-3 py-2 shadow-xl">
      <p className="text-sm font-medium text-text-primary">{d.symbol}</p>
      <p className="text-xs text-text-muted">{d.trades} trades</p>
      <p className="text-xs text-text-primary">Win rate: {formatPct(d.winRate)}</p>
      <p className="text-xs text-text-primary">Total: {formatMoney(d.totalPnL)}</p>
    </div>
  );
}

export function WinRateBySymbol({ data }: WinRateBySymbolProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Win Rate by Symbol</CardTitle>
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
        <CardTitle>Win Rate by Symbol</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
              <XAxis type="number" domain={[0, 100]} stroke="#64748b" fontSize={11} tickFormatter={(v) => `${v}%`} />
              <YAxis
                type="category"
                dataKey="symbol"
                stroke="#64748b"
                fontSize={11}
                width={70}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#1e1e2e" }} />
              <Bar dataKey="winRate" radius={[0, 4, 4, 0]}>
                {data.map((d, i) => (
                  <Cell key={i} fill={d.winRate >= 50 ? "#22c55e" : "#ef4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

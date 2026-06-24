"use client";

import { useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  ZAxis,
} from "recharts";
import type { Trade, Emotion } from "@/types";
import { EMOTION_EMOJI } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";

interface EmotionPnLProps {
  trades: Trade[];
}

const EMOTIONS: Emotion[] = ["Calm", "Confident", "Neutral", "Anxious", "Greedy", "Fearful"];

interface ScatterPoint {
  emotionIndex: number;
  pnl: number;
  symbol: string;
  emotion: Emotion;
}

interface TooltipPayloadItem {
  payload: ScatterPoint;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  return (
    <div className="card-surface px-3 py-2 shadow-xl">
      <p className="text-sm font-medium text-text-primary">
        {EMOTION_EMOJI[d.emotion]} {d.emotion}
      </p>
      <p className="text-xs text-text-muted">{d.symbol}</p>
      <p className="text-xs text-text-primary">{formatMoney(d.pnl)}</p>
    </div>
  );
}

export function EmotionPnL({ trades }: EmotionPnLProps) {
  const points = useMemo<ScatterPoint[]>(() => {
    return trades
      .filter((t) => t.status === "CLOSED" && t.emotion && t.profit !== null)
      .map((t) => ({
        emotionIndex: EMOTIONS.indexOf(t.emotion as Emotion),
        pnl: t.profit ?? 0,
        symbol: t.symbol,
        emotion: t.emotion as Emotion,
      }))
      .filter((p) => p.emotionIndex >= 0);
  }, [trades]);

  if (points.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Emotion vs P&amp;L</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-muted py-8 text-center">
            Tag trades with emotions to see this chart.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Emotion vs P&amp;L</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ left: 8, right: 16, bottom: 8 }}>
              <CartesianGrid stroke="#1e1e2e" />
              <XAxis
                type="number"
                dataKey="emotionIndex"
                domain={[-0.5, EMOTIONS.length - 0.5]}
                ticks={EMOTIONS.map((_, i) => i)}
                tickFormatter={(v: number) => EMOTIONS[v] ?? ""}
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#1e1e2e" }}
              />
              <YAxis
                type="number"
                dataKey="pnl"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `$${v}`}
              />
              <ZAxis range={[60, 60]} />
              <Tooltip content={<CustomTooltip />} />
              <Scatter data={points}>
                {points.map((p, i) => (
                  <Cell key={i} fill={p.pnl >= 0 ? "#22c55e" : "#ef4444"} fillOpacity={0.7} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RRDistributionProps {
  data: { bucket: string; count: number }[];
}

const BUCKET_COLORS: Record<string, string> = {
  "< -1R": "#ef4444",
  "-1R to 0R": "#f59e0b",
  "0R to 1R": "#64748b",
  "1R to 2R": "#22c55e",
  "2R to 3R": "#22c55e",
  "> 3R": "#22c55e",
};

export function RRDistribution({ data }: RRDistributionProps) {
  const hasData = data.some((d) => d.count > 0);

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>RR Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-muted py-8 text-center">
            No trades with stop-loss + close data yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>RR Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid stroke="#1e1e2e" vertical={false} />
              <XAxis dataKey="bucket" stroke="#64748b" fontSize={10} tickLine={false} axisLine={{ stroke: "#1e1e2e" }} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "#12121a",
                  border: "1px solid #1e1e2e",
                  borderRadius: "0.5rem",
                  fontSize: "0.75rem",
                }}
                cursor={{ fill: "#1e1e2e" }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.map((d, i) => (
                  <Cell key={i} fill={BUCKET_COLORS[d.bucket] ?? "#6366f1"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

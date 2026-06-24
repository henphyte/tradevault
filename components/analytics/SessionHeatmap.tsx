"use client";

import { useMemo } from "react";
import type { HeatmapCell } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SessionHeatmapProps {
  data: HeatmapCell[];
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function intensityColor(pnl: number, maxAbs: number): string {
  if (maxAbs === 0) return "#1e1e2e";
  const ratio = Math.min(Math.abs(pnl) / maxAbs, 1);
  if (pnl > 0) {
    // green scale
    const alpha = 0.15 + ratio * 0.65;
    return `rgba(34, 197, 94, ${alpha})`;
  }
  if (pnl < 0) {
    const alpha = 0.15 + ratio * 0.65;
    return `rgba(239, 68, 68, ${alpha})`;
  }
  return "#1e1e2e";
}

export function SessionHeatmap({ data }: SessionHeatmapProps) {
  const cellMap = useMemo(() => {
    const map = new Map<string, HeatmapCell>();
    for (const cell of data) {
      map.set(`${cell.day}-${cell.hour}`, cell);
    }
    return map;
  }, [data]);

  const maxAbs = useMemo(
    () => data.reduce((max, c) => Math.max(max, Math.abs(c.pnl)), 0),
    [data]
  );

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trading Hours Heatmap</CardTitle>
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
        <CardTitle>Trading Hours Heatmap (UTC)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-[40px_repeat(24,1fr)] gap-0.5 mb-1">
              <div />
              {HOURS.map((h) => (
                <div key={h} className="text-[10px] text-text-muted text-center">
                  {h}
                </div>
              ))}
            </div>
            {DAYS.map((day) => (
              <div key={day} className="grid grid-cols-[40px_repeat(24,1fr)] gap-0.5 mb-0.5">
                <div className="text-xs text-text-muted flex items-center">{day}</div>
                {HOURS.map((hour) => {
                  const cell = cellMap.get(`${day}-${hour}`);
                  return (
                    <Tooltip key={hour}>
                      <TooltipTrigger asChild>
                        <div
                          className="h-5 rounded-sm cursor-default"
                          style={{
                            backgroundColor: cell ? intensityColor(cell.pnl, maxAbs) : "#12121a",
                          }}
                        />
                      </TooltipTrigger>
                      {cell && (
                        <TooltipContent>
                          {day} {hour}:00 — {formatMoney(cell.pnl)} ({cell.trades} trades)
                        </TooltipContent>
                      )}
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

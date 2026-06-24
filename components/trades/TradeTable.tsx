"use client";

import { useState, useMemo } from "react";
import { ArrowUpDown, Star, Trash2, Download } from "lucide-react";
import type { Trade } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney, formatDate, formatPips, formatRR, pnlColor } from "@/lib/utils";
import { EMOTION_EMOJI } from "@/types";

type SortKey = keyof Trade;

interface TradeTableProps {
  trades: Trade[];
  isLoading?: boolean;
  onRowClick: (trade: Trade) => void;
  onToggleStar: (trade: Trade) => void;
  onDeleteSelected: (ids: string[]) => void;
  onExportCsv: (trades: Trade[]) => void;
}

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "open_time", label: "Date" },
  { key: "symbol", label: "Symbol" },
  { key: "type", label: "Type" },
  { key: "lot_size", label: "Lots" },
  { key: "open_price", label: "Entry" },
  { key: "close_price", label: "Exit" },
  { key: "pips", label: "Pips" },
  { key: "profit", label: "P&L" },
  { key: "rr", label: "RR" },
  { key: "session", label: "Session" },
  { key: "emotion", label: "Emotion" },
];

export function TradeTable({
  trades,
  isLoading,
  onRowClick,
  onToggleStar,
  onDeleteSelected,
  onExportCsv,
}: TradeTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("open_time");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const sorted = useMemo(() => {
    const copy = [...trades];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      return 0;
    });
    return copy;
  }, [trades, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === sorted.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(sorted.map((t) => t.id)));
    }
  };

  if (isLoading) {
    return (
      <div className="card-surface p-4 space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div className="card-surface p-12 text-center">
        <p className="text-sm text-text-muted">
          No trades yet — import from MT5 or add your first trade.
        </p>
      </div>
    );
  }

  return (
    <div className="card-surface overflow-hidden">
      {selected.size > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-primary/10 border-b border-border">
          <span className="text-sm text-text-primary">{selected.size} selected</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => onExportCsv(sorted.filter((t) => selected.has(t.id)))}
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="gap-1.5"
              onClick={() => {
                onDeleteSelected(Array.from(selected));
                setSelected(new Set());
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-3 py-3 w-10">
                <Checkbox
                  checked={selected.size === sorted.length && sorted.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </th>
              <th className="px-3 py-3 w-8"></th>
              {COLUMNS.map((col) => (
                <th key={col.key} className="px-3 py-3 whitespace-nowrap">
                  <button
                    onClick={() => toggleSort(col.key)}
                    className="flex items-center gap-1 text-xs font-medium text-text-muted hover:text-text-primary uppercase tracking-wide"
                  >
                    {col.label}
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((t) => (
              <tr
                key={t.id}
                className="border-b border-border last:border-0 hover:bg-background/60 transition-colors cursor-pointer"
                onClick={() => onRowClick(t)}
              >
                <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                  <Checkbox checked={selected.has(t.id)} onCheckedChange={() => toggleSelect(t.id)} />
                </td>
                <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => onToggleStar(t)} aria-label="Toggle star">
                    <Star
                      className={`h-4 w-4 ${
                        t.starred ? "fill-warning text-warning" : "text-text-muted"
                      }`}
                    />
                  </button>
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-text-muted font-mono text-xs">
                  {formatDate(t.open_time)}
                </td>
                <td className="px-3 py-3 font-medium text-text-primary whitespace-nowrap">
                  {t.symbol}
                </td>
                <td className="px-3 py-3">
                  <Badge variant={t.type === "BUY" ? "buy" : "sell"}>{t.type}</Badge>
                </td>
                <td className="px-3 py-3 font-mono text-text-primary">{t.lot_size}</td>
                <td className="px-3 py-3 font-mono text-text-primary">{t.open_price}</td>
                <td className="px-3 py-3 font-mono text-text-primary">{t.close_price ?? "—"}</td>
                <td className="px-3 py-3 font-mono">{formatPips(t.pips)}</td>
                <td className={`px-3 py-3 font-mono font-medium ${pnlColor(t.profit)}`}>
                  {t.profit !== null ? formatMoney(t.profit) : "—"}
                </td>
                <td className="px-3 py-3 font-mono text-text-muted">{formatRR(t.rr)}</td>
                <td className="px-3 py-3 text-text-muted whitespace-nowrap">{t.session ?? "—"}</td>
                <td className="px-3 py-3 whitespace-nowrap">
                  {t.emotion ? `${EMOTION_EMOJI[t.emotion]} ${t.emotion}` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { Star } from "lucide-react";
import type { Trade, TradeFilters as TradeFiltersType, Session, Emotion, TradeType } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EMOTION_EMOJI } from "@/types";

const SESSIONS: Session[] = ["London", "New York", "Tokyo", "Sydney", "Overlap"];
const EMOTIONS: Emotion[] = ["Calm", "Confident", "Anxious", "Fearful", "Greedy", "Neutral"];
const ALL = "__all__";

interface TradeFiltersProps {
  filters: TradeFiltersType;
  onChange: (filters: TradeFiltersType) => void;
  trades: Trade[];
}

export function TradeFiltersBar({ filters, onChange, trades }: TradeFiltersProps) {
  const symbols = useMemo(
    () => Array.from(new Set(trades.map((t) => t.symbol))).sort(),
    [trades]
  );

  const update = (patch: Partial<TradeFiltersType>) => onChange({ ...filters, ...patch });

  const hasActiveFilters =
    filters.dateFrom ||
    filters.dateTo ||
    filters.symbol ||
    filters.session ||
    filters.emotion ||
    filters.type ||
    filters.starredOnly ||
    filters.status;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        type="date"
        value={filters.dateFrom ?? ""}
        onChange={(e) => update({ dateFrom: e.target.value || undefined })}
        className="w-auto"
        aria-label="From date"
      />
      <Input
        type="date"
        value={filters.dateTo ?? ""}
        onChange={(e) => update({ dateTo: e.target.value || undefined })}
        className="w-auto"
        aria-label="To date"
      />

      <Select
        value={filters.symbol ?? ALL}
        onValueChange={(v) => update({ symbol: v === ALL ? undefined : v })}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Symbol" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All symbols</SelectItem>
          {symbols.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.session ?? ALL}
        onValueChange={(v) => update({ session: v === ALL ? undefined : (v as Session) })}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Session" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All sessions</SelectItem>
          {SESSIONS.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.emotion ?? ALL}
        onValueChange={(v) => update({ emotion: v === ALL ? undefined : (v as Emotion) })}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Emotion" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All emotions</SelectItem>
          {EMOTIONS.map((e) => (
            <SelectItem key={e} value={e}>
              {EMOTION_EMOJI[e]} {e}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.type ?? ALL}
        onValueChange={(v) => update({ type: v === ALL ? undefined : (v as TradeType) })}
      >
        <SelectTrigger className="w-28">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Buy & Sell</SelectItem>
          <SelectItem value="BUY">Buy</SelectItem>
          <SelectItem value="SELL">Sell</SelectItem>
        </SelectContent>
      </Select>

      <Button
        type="button"
        variant={filters.starredOnly ? "default" : "outline"}
        size="sm"
        onClick={() => update({ starredOnly: !filters.starredOnly })}
        className="gap-1.5"
      >
        <Star className={`h-3.5 w-3.5 ${filters.starredOnly ? "fill-current" : ""}`} />
        Starred
      </Button>

      {hasActiveFilters && (
        <Button type="button" variant="ghost" size="sm" onClick={() => onChange({})}>
          Clear filters
        </Button>
      )}
    </div>
  );
}

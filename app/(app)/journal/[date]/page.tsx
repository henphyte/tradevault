"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import type { JournalEntry, JournalEntryInsert } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useTrades } from "@/hooks/useTrades";
import { JournalEditor } from "@/components/journal/JournalEditor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney, formatDateOnly, formatPct, pnlColor } from "@/lib/utils";
import { calculateWinRate } from "@/lib/analytics";

export default function DailyJournalPage() {
  const params = useParams<{ date: string }>();
  const router = useRouter();
  const { activeProfileId } = useProfile();
  const { trades, isLoading: tradesLoading } = useTrades();

  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [isLoadingEntry, setIsLoadingEntry] = useState(true);

  const date = params.date;

  useEffect(() => {
    if (!activeProfileId) return;

    const fetchEntry = async () => {
      setIsLoadingEntry(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("journal_entries")
          .select("*")
          .eq("profile_id", activeProfileId)
          .eq("date", date)
          .maybeSingle();

        if (error) throw error;
        setEntry(data as JournalEntry | null);
      } catch (err) {
        toast.error("Failed to load journal entry", {
          description: err instanceof Error ? err.message : undefined,
        });
      } finally {
        setIsLoadingEntry(false);
      }
    };

    fetchEntry();
  }, [activeProfileId, date]);

  const dayTrades = useMemo(
    () => trades.filter((t) => (t.close_time ?? t.open_time).slice(0, 10) === date),
    [trades, date]
  );

  const dayPnL = dayTrades
    .filter((t) => t.status === "CLOSED")
    .reduce((sum, t) => sum + (t.profit ?? 0), 0);
  const dayWinRate = calculateWinRate(dayTrades);

  const handleSave = async (input: Omit<JournalEntryInsert, "profile_id">) => {
    if (!activeProfileId) throw new Error("No active profile");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    if (entry) {
      const { data, error } = await supabase
        .from("journal_entries")
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq("id", entry.id)
        .select()
        .single();
      if (error) throw error;
      setEntry(data as JournalEntry);
    } else {
      const { data, error } = await supabase
        .from("journal_entries")
        .insert({ ...input, profile_id: activeProfileId, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      setEntry(data as JournalEntry);
    }
  };

  const isLoading = tradesLoading || isLoadingEntry;

  return (
    <div className="max-w-3xl space-y-5">
      <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => router.push("/journal")}>
        <ArrowLeft className="h-4 w-4" />
        Back to Journal
      </Button>

      <div>
        <h1 className="font-display text-xl font-medium text-text-primary tracking-tight">
          {formatDateOnly(date)}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Day's Trades</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : dayTrades.length === 0 ? (
            <p className="text-sm text-text-muted py-2">No trades logged for this day.</p>
          ) : (
            <>
              <div className="flex gap-6 mb-4">
                <div>
                  <p className="text-xs text-text-muted">Day P&amp;L</p>
                  <p className={`text-lg font-mono font-medium ${pnlColor(dayPnL)}`}>
                    {formatMoney(dayPnL)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Win Rate</p>
                  <p className="text-lg font-mono font-medium text-text-primary">
                    {formatPct(dayWinRate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Trades</p>
                  <p className="text-lg font-mono font-medium text-text-primary">
                    {dayTrades.length}
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                {dayTrades.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-md px-3 py-2 bg-background"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant={t.type === "BUY" ? "buy" : "sell"}>{t.type}</Badge>
                      <span className="text-sm text-text-primary">{t.symbol}</span>
                    </div>
                    <span className={`text-sm font-mono ${pnlColor(t.profit)}`}>
                      {t.profit !== null ? formatMoney(t.profit) : "Open"}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {isLoadingEntry ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <JournalEditor date={date} initialEntry={entry} onSave={handleSave} />
      )}
    </div>
  );
}

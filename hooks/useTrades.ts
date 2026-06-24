"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Trade, TradeInsert, TradeUpdate, TradeFilters } from "@/types";
import { useProfile } from "@/hooks/useProfile";

interface UseTradesResult {
  trades: Trade[];
  filteredTrades: Trade[];
  isLoading: boolean;
  error: string | null;
  filters: TradeFilters;
  setFilters: (filters: TradeFilters) => void;
  refresh: () => Promise<void>;
  addTrade: (input: Omit<TradeInsert, "profile_id">) => Promise<Trade | null>;
  updateTrade: (id: string, input: TradeUpdate) => Promise<Trade | null>;
  deleteTrade: (id: string) => Promise<boolean>;
  deleteTrades: (ids: string[]) => Promise<boolean>;
  bulkInsert: (trades: TradeInsert[]) => Promise<{ inserted: number; failed: number }>;
}

export function useTrades(): UseTradesResult {
  const { activeProfileId } = useProfile();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TradeFilters>({});

  const supabase = createClient();

  const fetchTrades = useCallback(async () => {
    if (!activeProfileId) {
      setTrades([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("trades")
        .select("*")
        .eq("profile_id", activeProfileId)
        .order("open_time", { ascending: false });

      if (fetchError) throw fetchError;
      setTrades((data ?? []) as Trade[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load trades");
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProfileId]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  const addTrade = useCallback(
    async (input: Omit<TradeInsert, "profile_id">): Promise<Trade | null> => {
      if (!activeProfileId) {
        setError("No active profile selected");
        return null;
      }
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { data, error: insertError } = await supabase
          .from("trades")
          .insert({ ...input, profile_id: activeProfileId, user_id: user.id })
          .select()
          .single();

        if (insertError) throw insertError;
        await fetchTrades();
        return data as Trade;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add trade");
        return null;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeProfileId, fetchTrades]
  );

  const updateTrade = useCallback(
    async (id: string, input: TradeUpdate): Promise<Trade | null> => {
      try {
        const { data, error: updateError } = await supabase
          .from("trades")
          .update({ ...input, updated_at: new Date().toISOString() })
          .eq("id", id)
          .select()
          .single();

        if (updateError) throw updateError;
        await fetchTrades();
        return data as Trade;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update trade");
        return null;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fetchTrades]
  );

  const deleteTrade = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const { error: deleteError } = await supabase.from("trades").delete().eq("id", id);
        if (deleteError) throw deleteError;
        await fetchTrades();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete trade");
        return false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fetchTrades]
  );

  const deleteTrades = useCallback(
    async (ids: string[]): Promise<boolean> => {
      try {
        const { error: deleteError } = await supabase.from("trades").delete().in("id", ids);
        if (deleteError) throw deleteError;
        await fetchTrades();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete trades");
        return false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fetchTrades]
  );

  const bulkInsert = useCallback(
    async (newTrades: TradeInsert[]): Promise<{ inserted: number; failed: number }> => {
      if (!activeProfileId || newTrades.length === 0) return { inserted: 0, failed: 0 };
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const rows = newTrades.map((t) => ({
          ...t,
          profile_id: activeProfileId,
          user_id: user.id,
        }));

        const { data, error: insertError } = await supabase
          .from("trades")
          .insert(rows)
          .select();

        if (insertError) throw insertError;
        await fetchTrades();
        return { inserted: data?.length ?? 0, failed: newTrades.length - (data?.length ?? 0) };
      } catch (err) {
        setError(err instanceof Error ? err.message : "Bulk import failed");
        return { inserted: 0, failed: newTrades.length };
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeProfileId, fetchTrades]
  );

  const filteredTrades = useMemo(() => {
    return trades.filter((t) => {
      if (filters.dateFrom && t.open_time < filters.dateFrom) return false;
      if (filters.dateTo && t.open_time > filters.dateTo) return false;
      if (filters.symbol && t.symbol !== filters.symbol) return false;
      if (filters.session && t.session !== filters.session) return false;
      if (filters.emotion && t.emotion !== filters.emotion) return false;
      if (filters.type && t.type !== filters.type) return false;
      if (filters.status && t.status !== filters.status) return false;
      if (filters.starredOnly && !t.starred) return false;
      return true;
    });
  }, [trades, filters]);

  return {
    trades,
    filteredTrades,
    isLoading,
    error,
    filters,
    setFilters,
    refresh: fetchTrades,
    addTrade,
    updateTrade,
    deleteTrade,
    deleteTrades,
    bulkInsert,
  };
}

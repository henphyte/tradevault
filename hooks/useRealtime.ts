"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Trade } from "@/types";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface UseRealtimeTradesOptions {
  profileId: string | null;
  onInsert?: (trade: Trade) => void;
  onUpdate?: (trade: Trade) => void;
  onDelete?: (tradeId: string) => void;
}

/**
 * Subscribes to realtime changes on the `trades` table scoped to a single
 * profile. Used to surface MT5 webhook-synced trades (open positions,
 * closes) live on the dashboard without polling.
 */
export function useRealtime({ profileId, onInsert, onUpdate, onDelete }: UseRealtimeTradesOptions) {
  const callbacksRef = useRef({ onInsert, onUpdate, onDelete });
  callbacksRef.current = { onInsert, onUpdate, onDelete };

  useEffect(() => {
    if (!profileId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`trades-profile-${profileId}`)
      .on(
        "postgres_changes" as never,
        {
          event: "*",
          schema: "public",
          table: "trades",
          filter: `profile_id=eq.${profileId}`,
        },
        (payload: RealtimePostgresChangesPayload<Trade>) => {
          if (payload.eventType === "INSERT" && payload.new) {
            callbacksRef.current.onInsert?.(payload.new as Trade);
          } else if (payload.eventType === "UPDATE" && payload.new) {
            callbacksRef.current.onUpdate?.(payload.new as Trade);
          } else if (payload.eventType === "DELETE" && payload.old) {
            const oldRow = payload.old as Partial<Trade>;
            if (oldRow.id) callbacksRef.current.onDelete?.(oldRow.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId]);
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import type { Trade } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TradeModal } from "@/components/trades/TradeModal";
import { useTrades } from "@/hooks/useTrades";

export default function TradeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { trades, updateTrade, deleteTrade } = useTrades();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fromList = trades.find((t) => t.id === params.id);
    if (fromList) {
      setTrade(fromList);
      setIsLoading(false);
      return;
    }

    // Fall back to a direct fetch in case the trades list hasn't loaded yet
    // or this trade belongs to a different active profile.
    const fetchTrade = async () => {
      setIsLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("trades")
          .select("*")
          .eq("id", params.id)
          .single();

        if (error) throw error;
        setTrade(data as Trade);
      } catch (err) {
        toast.error("Trade not found", {
          description: err instanceof Error ? err.message : undefined,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrade();
  }, [params.id, trades]);

  const handleDelete = async (id: string) => {
    await deleteTrade(id);
    router.push("/trades");
  };

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="text-center py-24">
        <p className="text-text-muted">Trade not found.</p>
        <Button variant="outline" className="mt-4 gap-1.5" onClick={() => router.push("/trades")}>
          <ArrowLeft className="h-4 w-4" />
          Back to Trade Log
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 mb-4"
        onClick={() => router.push("/trades")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Trade Log
      </Button>

      <TradeModal
        trade={trade}
        knownSymbols={[]}
        open={true}
        onOpenChange={(open) => !open && router.push("/trades")}
        onUpdate={async (id, input) => {
          const updated = await updateTrade(id, input);
          if (updated) setTrade(updated);
          return updated;
        }}
        onDelete={handleDelete}
      />
    </div>
  );
}

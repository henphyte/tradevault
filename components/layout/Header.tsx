"use client";

import { useMemo, useState, useEffect } from "react";
import { Send } from "lucide-react";
import { ProfileSwitcher } from "@/components/layout/ProfileSwitcher";
import { useProfile } from "@/hooks/useProfile";
import { useTrades } from "@/hooks/useTrades";
import { calculateDailyPnL } from "@/lib/analytics";
import { formatMoney, pnlColor } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export function Header() {
  const { activeProfile } = useProfile();
  const { trades } = useTrades();
  const [initials, setInitials] = useState("?");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email ?? "";
      if (email) setInitials(email.slice(0, 2).toUpperCase());
    });
  }, []);

  const todayPnL = useMemo(() => {
    const daily = calculateDailyPnL(trades);
    const today = new Date().toISOString().slice(0, 10);
    return daily.find((d) => d.date === today)?.pnl ?? 0;
  }, [trades]);

  const telegramConnected = Boolean(process.env.NEXT_PUBLIC_TELEGRAM_ENABLED === "true");

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/80 backdrop-blur-md px-4 md:px-6">
      <div className="flex items-center gap-3 md:ml-0 ml-12">
        <ProfileSwitcher />
        {activeProfile && (
          <div className="hidden sm:flex items-center gap-2 text-sm">
            <span className="text-text-muted">Today</span>
            <span className={`font-mono font-medium ${pnlColor(todayPnL)}`}>
              {formatMoney(todayPnL)}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div
          className="hidden sm:flex items-center gap-1.5 text-xs text-text-muted"
          title={telegramConnected ? "Telegram connected" : "Telegram not configured"}
        >
          <Send className={`h-3.5 w-3.5 ${telegramConnected ? "text-profit" : "text-text-muted"}`} />
          <span>{telegramConnected ? "Connected" : "Not connected"}</span>
        </div>

        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 border border-primary/30 text-xs font-medium text-primary">
          {initials}
        </div>
      </div>
    </header>
  );
}

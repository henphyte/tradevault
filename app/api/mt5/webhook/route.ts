import { NextRequest, NextResponse } from "next/server";
import {
  validateWebhookSecret,
  parseWebhookPayload,
  webhookPayloadToTradeInsert,
  WebhookValidationError,
} from "@/lib/mt5/webhook";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendTradeSync, sendDailyLossWarning, sendDailyLossBreached, sendProfitTargetHit } from "@/lib/telegram";
import type { Trade, Profile } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = parseWebhookPayload(body);

    if (!validateWebhookSecret(payload.secret)) {
      return NextResponse.json({ success: false, error: "Invalid webhook secret" }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    // Verify the referenced profile exists before inserting.
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", payload.profile_id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: "Profile not found for given profile_id" },
        { status: 404 }
      );
    }

    const tradeInsert = webhookPayloadToTradeInsert(payload);

    // Upsert by ticket to support both the initial OPEN event and the later
    // CLOSED event for the same position arriving as separate webhook calls.
    const { data: existingTrade } = await supabase
      .from("trades")
      .select("id")
      .eq("profile_id", payload.profile_id)
      .eq("ticket", payload.ticket)
      .maybeSingle();

    let savedTrade: Trade;

    if (existingTrade) {
      const { data, error } = await supabase
        .from("trades")
        .update({ ...tradeInsert, updated_at: new Date().toISOString() })
        .eq("id", existingTrade.id)
        .select()
        .single();
      if (error) throw error;
      savedTrade = data as Trade;
    } else {
      const { data, error } = await supabase
        .from("trades")
        .insert({ ...tradeInsert, user_id: (profile as Profile).user_id })
        .select()
        .single();
      if (error) throw error;
      savedTrade = data as Trade;
    }

    // Fire Telegram notifications for closed trades and risk-limit conditions.
    if (savedTrade.status === "CLOSED") {
      await sendTradeSync(savedTrade);

      const typedProfile = profile as Profile;
      const dailyLossLimitAbs = (typedProfile.daily_loss_limit_pct / 100) * typedProfile.account_size;

      const today = new Date().toISOString().slice(0, 10);
      const { data: todaysTrades } = await supabase
        .from("trades")
        .select("profit, close_time, open_time")
        .eq("profile_id", payload.profile_id)
        .eq("status", "CLOSED");

      const todaysPnL = (todaysTrades ?? [])
        .filter((t) => (t.close_time ?? t.open_time)?.slice(0, 10) === today)
        .reduce((sum, t) => sum + (t.profit ?? 0), 0);

      const todaysLoss = todaysPnL < 0 ? Math.abs(todaysPnL) : 0;

      if (dailyLossLimitAbs > 0) {
        const lossPct = (todaysLoss / dailyLossLimitAbs) * 100;
        if (lossPct >= 100) {
          await sendDailyLossBreached();
        } else if (lossPct >= 80) {
          await sendDailyLossWarning(todaysLoss, dailyLossLimitAbs);
        }
      }

      const profitTargetAbs = (typedProfile.profit_target_pct / 100) * typedProfile.account_size;
      const currentProfit = Math.max(0, typedProfile.current_balance - typedProfile.starting_balance);
      if (profitTargetAbs > 0) {
        const targetPct = (currentProfit / profitTargetAbs) * 100;
        if (targetPct >= 100) {
          await sendProfitTargetHit(targetPct);
        }
      }

      // Update the profile's running balance to reflect the newly closed trade.
      await supabase
        .from("profiles")
        .update({
          current_balance: typedProfile.current_balance + (savedTrade.profit ?? 0),
          updated_at: new Date().toISOString(),
        })
        .eq("id", typedProfile.id);
    }

    return NextResponse.json({ success: true, trade_id: savedTrade.id });
  } catch (err) {
    if (err instanceof WebhookValidationError) {
      return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }
    console.error("MT5 webhook error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendTelegramMessage } from "@/lib/telegram";
import { calculateWinRate, calculateProfitFactor, calculateDailyPnL } from "@/lib/analytics";
import { formatMoney, formatPct } from "@/lib/utils";
import type { Trade, Profile } from "@/types";

interface TelegramUpdate {
  message?: {
    text?: string;
    chat: { id: number };
  };
}

/**
 * POST /api/telegram/webhook
 *
 * Receives incoming messages from the Telegram Bot API (set via
 * setWebhook). Supports simple slash commands so the trader can check
 * status from their phone without opening the app:
 *   /status   — today's P&L and win rate for the active profile
 *   /limits   — daily loss / drawdown limit usage
 *   /help     — list available commands
 *
 * This endpoint is intentionally public (no session auth) since Telegram
 * calls it directly — security relies on the bot token being secret and
 * Telegram's TLS-verified webhook delivery. The chat_id is also checked
 * against the configured TELEGRAM_CHAT_ID so only the owner's chat is
 * processed.
 */
export async function POST(request: NextRequest) {
  try {
    const update = (await request.json()) as TelegramUpdate;
    const text = update.message?.text?.trim();
    const chatId = update.message?.chat?.id;

    if (!text || chatId === undefined) {
      return NextResponse.json({ ok: true });
    }

    const expectedChatId = process.env.TELEGRAM_CHAT_ID;
    if (expectedChatId && String(chatId) !== expectedChatId) {
      // Ignore messages from anyone other than the configured owner chat.
      return NextResponse.json({ ok: true });
    }

    const supabase = createServiceRoleClient();

    if (text === "/help") {
      await sendTelegramMessage(
        [
          "<b>TradeVault Bot Commands</b>",
          "",
          "/status — today's P&L and win rate",
          "/limits — daily loss & drawdown usage",
          "/help — show this message",
        ].join("\n")
      );
      return NextResponse.json({ ok: true });
    }

    if (text === "/status" || text === "/limits") {
      const { data: activeProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (!activeProfile) {
        await sendTelegramMessage("No active profile found. Set one as active in TradeVault.");
        return NextResponse.json({ ok: true });
      }

      const profile = activeProfile as Profile;

      const { data: tradesData } = await supabase
        .from("trades")
        .select("*")
        .eq("profile_id", profile.id);

      const trades = (tradesData ?? []) as Trade[];

      if (text === "/status") {
        const today = new Date().toISOString().slice(0, 10);
        const daily = calculateDailyPnL(trades);
        const todayPnL = daily.find((d) => d.date === today)?.pnl ?? 0;
        const winRate = calculateWinRate(trades);
        const profitFactor = calculateProfitFactor(trades);

        await sendTelegramMessage(
          [
            `📊 <b>${profile.firm_name}</b>`,
            ``,
            `Today's P&L: ${formatMoney(todayPnL)}`,
            `Win Rate: ${formatPct(winRate)}`,
            `Profit Factor: ${profitFactor.toFixed(2)}`,
          ].join("\n")
        );
      } else {
        const dailyLossLimitAbs = (profile.daily_loss_limit_pct / 100) * profile.account_size;
        const drawdownLimitAbs = (profile.max_drawdown_pct / 100) * profile.account_size;
        const currentDrawdownAbs = Math.max(0, profile.starting_balance - profile.current_balance);

        const today = new Date().toISOString().slice(0, 10);
        const daily = calculateDailyPnL(trades);
        const todayPnL = daily.find((d) => d.date === today)?.pnl ?? 0;
        const todayLoss = todayPnL < 0 ? Math.abs(todayPnL) : 0;

        await sendTelegramMessage(
          [
            `🛡️ <b>${profile.firm_name} — Limits</b>`,
            ``,
            `Daily Loss: ${formatMoney(-todayLoss)} / ${formatMoney(-dailyLossLimitAbs)}`,
            `Drawdown: $${currentDrawdownAbs.toFixed(2)} / $${drawdownLimitAbs.toFixed(2)}`,
          ].join("\n")
        );
      }

      return NextResponse.json({ ok: true });
    }

    // Unrecognized command — gently point to /help
    await sendTelegramMessage("Unrecognized command. Send /help to see what I can do.");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Telegram webhook error:", err);
    // Always return 200 to Telegram to avoid retry storms; log server-side instead.
    return NextResponse.json({ ok: true });
  }
}

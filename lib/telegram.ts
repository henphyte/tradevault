import type { Trade } from "@/types";
import { formatMoney, formatPips, formatPct } from "@/lib/utils";

interface TelegramApiResponse {
  ok: boolean;
  description?: string;
}

/** Low-level sender. Posts a message to the configured Telegram chat. */
async function sendTelegramMessage(text: string): Promise<{ success: boolean; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.error("Telegram is not configured: missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID");
    return { success: false, error: "Telegram not configured" };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      }),
    });

    const data: TelegramApiResponse = await res.json();

    if (!data.ok) {
      console.error("Telegram API error:", data.description);
      return { success: false, error: data.description ?? "Unknown Telegram error" };
    }

    return { success: true };
  } catch (err) {
    console.error("Telegram request failed:", err);
    return { success: false, error: err instanceof Error ? err.message : "Request failed" };
  }
}

/** Sent whenever a trade syncs in from MT5 (webhook or CSV import). */
export async function sendTradeSync(trade: Trade) {
  const emoji = (trade.profit ?? 0) >= 0 ? "✅" : "❌";
  const pipsStr = trade.pips !== null ? ` (${formatPips(trade.pips)} pips)` : "";
  const text = `${emoji} <b>Trade Synced:</b> ${trade.symbol} ${trade.type} ${formatMoney(
    trade.profit
  )}${pipsStr}`;
  return sendTelegramMessage(text);
}

/** Sent when daily loss reaches the warning threshold (e.g. 80% of limit). */
export async function sendDailyLossWarning(currentLoss: number, limit: number) {
  const pct = (currentLoss / limit) * 100;
  const text = `⚠️ <b>WARNING:</b> Daily loss at ${formatPct(pct)} ($${currentLoss.toFixed(
    2
  )}/$${limit.toFixed(2)} limit)`;
  return sendTelegramMessage(text);
}

/** Sent when the daily loss limit has been breached — trading must stop. */
export async function sendDailyLossBreached() {
  const text = `🚨 <b>STOP TRADING:</b> Daily loss limit BREACHED`;
  return sendTelegramMessage(text);
}

/** Sent when the account hits a percentage of the profit target. */
export async function sendProfitTargetHit(pctOfTarget: number) {
  const text = `🎯 <b>PROFIT TARGET HIT!</b> Account up ${formatPct(pctOfTarget)}`;
  return sendTelegramMessage(text);
}

export interface DailySummaryStats {
  date: string;
  totalPnL: number;
  trades: number;
  winRate: number;
  bestTrade: number;
  worstTrade: number;
}

/** Sent as a daily 6PM summary. */
export async function sendDailySummary(stats: DailySummaryStats) {
  const text = [
    `📊 <b>Daily Summary — ${stats.date}</b>`,
    ``,
    `P&L: ${formatMoney(stats.totalPnL)}`,
    `Trades: ${stats.trades}`,
    `Win Rate: ${formatPct(stats.winRate)}`,
    `Best: ${formatMoney(stats.bestTrade)}`,
    `Worst: ${formatMoney(stats.worstTrade)}`,
  ].join("\n");
  return sendTelegramMessage(text);
}

export interface WeeklyReportStats {
  weekOf: string;
  totalPnL: number;
  trades: number;
  winRate: number;
  profitFactor: number;
  bestDay: string;
  worstDay: string;
}

/** Sent Monday mornings with a weekly breakdown. */
export async function sendWeeklyReport(stats: WeeklyReportStats) {
  const text = [
    `📅 <b>Weekly Report — Week of ${stats.weekOf}</b>`,
    ``,
    `Total P&L: ${formatMoney(stats.totalPnL)}`,
    `Trades: ${stats.trades}`,
    `Win Rate: ${formatPct(stats.winRate)}`,
    `Profit Factor: ${stats.profitFactor.toFixed(2)}`,
    `Best Day: ${stats.bestDay}`,
    `Worst Day: ${stats.worstDay}`,
  ].join("\n");
  return sendTelegramMessage(text);
}

export { sendTelegramMessage };

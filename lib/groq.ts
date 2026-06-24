import Groq from "groq-sdk";
import type { Trade } from "@/types";
import {
  calculateAnalyticsSummary,
  groupBySession,
  groupBySymbol,
  groupByEmotion,
  groupByDayOfWeek,
  calculateStreak,
} from "@/lib/analytics";

let groqClient: Groq | null = null;

function getGroqClient(): Groq {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("Missing GROQ_API_KEY environment variable");
    }
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

export const TRADEVAULT_SYSTEM_PROMPT = `You are TradeVault AI, an expert prop trading coach analyzing a trader's MT5 data.
Be direct, data-driven, and actionable. Reference specific numbers from their trades.
Keep responses concise — bullet points where possible. Focus on improvement.
The trader trades forex/indices on prop firm accounts (Funding Pips, GOAT Funded, Funded Next).
Prop firm rules are strict — always factor in daily loss limits and drawdown rules.`;

/** Serializes trade data + computed analytics into a compact context block for the LLM. */
export function buildTradeContext(trades: Trade[], startingBalance: number): string {
  const summary = calculateAnalyticsSummary(trades, startingBalance);
  const sessions = groupBySession(trades);
  const symbols = groupBySymbol(trades);
  const emotions = groupByEmotion(trades);
  const days = groupByDayOfWeek(trades);
  const streak = calculateStreak(trades);

  const recentTrades = trades
    .filter((t) => t.status === "CLOSED")
    .slice(-30)
    .map(
      (t) =>
        `${t.open_time.slice(0, 10)} ${t.symbol} ${t.type} lot=${t.lot_size} P&L=${(
          t.profit ?? 0
        ).toFixed(2)} pips=${(t.pips ?? 0).toFixed(1)} RR=${t.rr ?? "n/a"} session=${
          t.session ?? "n/a"
        } emotion=${t.emotion ?? "n/a"}`
    )
    .join("\n");

  return `
TRADER PERFORMANCE SUMMARY:
- Total Trades: ${summary.totalTrades}
- Total P&L: $${summary.totalPnL.toFixed(2)}
- Win Rate: ${summary.winRate.toFixed(1)}%
- Profit Factor: ${summary.profitFactor.toFixed(2)}
- Average RR: ${summary.averageRR.toFixed(2)}
- Expectancy per trade: $${summary.expectancy.toFixed(2)}
- Best Trade: $${summary.bestTrade.toFixed(2)}
- Worst Trade: $${summary.worstTrade.toFixed(2)}
- Max Drawdown: ${summary.maxDrawdown.toFixed(1)}%
- Max Consecutive Losses: ${summary.maxConsecutiveLosses}
- Max Consecutive Wins: ${summary.maxConsecutiveWins}
- Current Streak: ${streak.current} ${streak.type}

PERFORMANCE BY SESSION:
${sessions.map((s) => `- ${s.session}: ${s.trades} trades, ${s.winRate.toFixed(1)}% win rate, $${s.totalPnL.toFixed(2)} total`).join("\n") || "No session data"}

PERFORMANCE BY SYMBOL (top 10):
${symbols.map((s) => `- ${s.symbol}: ${s.trades} trades, ${s.winRate.toFixed(1)}% win rate, $${s.totalPnL.toFixed(2)} total`).join("\n") || "No symbol data"}

PERFORMANCE BY EMOTION:
${emotions.map((e) => `- ${e.emotion}: ${e.trades} trades, ${e.winRate.toFixed(1)}% win rate, $${e.totalPnL.toFixed(2)} total`).join("\n") || "No emotion data"}

PERFORMANCE BY DAY OF WEEK:
${days.map((d) => `- ${d.day}: ${d.trades} trades, ${d.winRate.toFixed(1)}% win rate, $${d.totalPnL.toFixed(2)} total`).join("\n") || "No day-of-week data"}

LAST 30 CLOSED TRADES (raw log):
${recentTrades || "No closed trades yet"}
`.trim();
}

/** Calls Groq's chat completion endpoint (non-streaming) with trade context injected. */
export async function analyzeTradesWithAI(
  userPrompt: string,
  trades: Trade[],
  startingBalance: number
): Promise<string> {
  const client = getGroqClient();
  const context = buildTradeContext(trades, startingBalance);

  const completion = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: TRADEVAULT_SYSTEM_PROMPT },
      {
        role: "user",
        content: `${context}\n\nTRADER QUESTION: ${userPrompt}`,
      },
    ],
    temperature: 0.4,
    max_tokens: 1024,
  });

  return completion.choices[0]?.message?.content ?? "No response generated.";
}

/** Streaming variant — returns an async iterator of text chunks for SSE/streaming UIs. */
export async function* analyzeTradesWithAIStream(
  userPrompt: string,
  trades: Trade[],
  startingBalance: number
): AsyncGenerator<string> {
  const client = getGroqClient();
  const context = buildTradeContext(trades, startingBalance);

  const stream = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: TRADEVAULT_SYSTEM_PROMPT },
      {
        role: "user",
        content: `${context}\n\nTRADER QUESTION: ${userPrompt}`,
      },
    ],
    temperature: 0.4,
    max_tokens: 1024,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) yield content;
  }
}

/** Pre-built prompt buttons shown in the AI Coach UI. */
export const AI_COACH_PRESETS = [
  { label: "Analyze my last 30 trades", prompt: "Analyze my last 30 trades and identify patterns." },
  { label: "What's my best trading setup?", prompt: "Based on my trade history, what is my best performing setup or symbol, and why?" },
  { label: "Why am I losing money?", prompt: "Looking at my losing trades, what are the common causes and how can I fix them?" },
  { label: "Rate my risk management", prompt: "Rate my risk management based on my RR distribution, lot sizing, and drawdown history." },
  { label: "What time of day should I trade?", prompt: "Based on my session and hour-of-day performance, when should I be trading and when should I avoid it?" },
  { label: "Give me a weekly performance report", prompt: "Give me a structured weekly performance report based on my recent trades." },
] as const;

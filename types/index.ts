// ============================================================================
// TradeVault — Core Type Definitions
// ============================================================================

export type TradeType = "BUY" | "SELL";

export type Session = "London" | "New York" | "Tokyo" | "Sydney" | "Overlap";

export type Emotion =
  | "Calm"
  | "Confident"
  | "Anxious"
  | "Fearful"
  | "Greedy"
  | "Neutral";

export const EMOTION_EMOJI: Record<Emotion, string> = {
  Calm: "😌",
  Confident: "💪",
  Anxious: "😰",
  Fearful: "😨",
  Greedy: "🤑",
  Neutral: "😐",
};

export type TradeStatus = "OPEN" | "CLOSED";

export type ProfilePhase = "Challenge" | "Verification" | "Funded";

export type PropFirm = "Funding Pips" | "GOAT Funded" | "Funded Next" | "Custom";

export interface PropFirmPreset {
  name: PropFirm;
  dailyLossPct: number;
  maxDrawdownPct: number;
  profitTargetPct: number;
}

export const PROP_FIRM_PRESETS: Record<Exclude<PropFirm, "Custom">, PropFirmPreset> = {
  "Funding Pips": {
    name: "Funding Pips",
    dailyLossPct: 4,
    maxDrawdownPct: 8,
    profitTargetPct: 8,
  },
  "GOAT Funded": {
    name: "GOAT Funded",
    dailyLossPct: 5,
    maxDrawdownPct: 10,
    profitTargetPct: 10,
  },
  "Funded Next": {
    name: "Funded Next",
    dailyLossPct: 5,
    maxDrawdownPct: 10,
    profitTargetPct: 10,
  },
};

// ----------------------------------------------------------------------------
// Profile (Prop Firm Account)
// ----------------------------------------------------------------------------

export interface Profile {
  id: string;
  user_id: string;
  firm_name: string;
  phase: ProfilePhase;
  account_size: number;
  daily_loss_limit_pct: number;
  max_drawdown_pct: number;
  profit_target_pct: number;
  starting_balance: number;
  current_balance: number;
  color_badge: string;
  webhook_secret: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileInsert
  extends Omit<
    Profile,
    "id" | "user_id" | "webhook_secret" | "created_at" | "updated_at" | "current_balance"
  > {
  current_balance?: number;
}

export interface ProfileUpdate extends Partial<ProfileInsert> {
  is_active?: boolean;
}

// ----------------------------------------------------------------------------
// Trade
// ----------------------------------------------------------------------------

export interface Trade {
  id: string;
  user_id: string;
  profile_id: string;
  ticket: string | null;
  symbol: string;
  type: TradeType;
  status: TradeStatus;
  lot_size: number;
  open_price: number;
  close_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  open_time: string;
  close_time: string | null;
  commission: number;
  swap: number;
  profit: number | null;
  pips: number | null;
  rr: number | null;
  session: Session | null;
  emotion: Emotion | null;
  setup: string | null;
  tags: string[];
  notes: string | null;
  screenshots: string[];
  starred: boolean;
  source: "manual" | "mt5_webhook" | "csv_import";
  created_at: string;
  updated_at: string;
}

export interface TradeInsert
  extends Omit<
    Trade,
    | "id"
    | "user_id"
    | "profit"
    | "pips"
    | "rr"
    | "status"
    | "created_at"
    | "updated_at"
  > {
  status?: TradeStatus;
  profit?: number | null;
  pips?: number | null;
  rr?: number | null;
}

export type TradeUpdate = Partial<TradeInsert>;

// ----------------------------------------------------------------------------
// Journal
// ----------------------------------------------------------------------------

export type Bias = "Bullish" | "Bearish" | "Neutral";
export type Mood = "Great" | "Good" | "Okay" | "Bad" | "Terrible";

export const MOOD_EMOJI: Record<Mood, string> = {
  Great: "🤩",
  Good: "🙂",
  Okay: "😐",
  Bad: "🙁",
  Terrible: "😣",
};

export interface JournalEntry {
  id: string;
  user_id: string;
  profile_id: string;
  date: string; // YYYY-MM-DD
  bias: Bias | null;
  economic_events: string | null;
  daily_goal: string | null;
  mood: Mood | null;
  energy_level: number | null; // 1-5
  review: string | null;
  lessons_learned: string | null;
  plan_for_tomorrow: string | null;
  created_at: string;
  updated_at: string;
}

export type JournalEntryInsert = Omit<
  JournalEntry,
  "id" | "user_id" | "created_at" | "updated_at"
>;

export type JournalEntryUpdate = Partial<JournalEntryInsert>;

// ----------------------------------------------------------------------------
// Analytics
// ----------------------------------------------------------------------------

export interface DailyPnL {
  date: string;
  pnl: number;
  cumulative: number;
  trades: number;
}

export interface SessionStats {
  session: Session;
  trades: number;
  winRate: number;
  avgPnL: number;
  totalPnL: number;
}

export interface SymbolStats {
  symbol: string;
  trades: number;
  winRate: number;
  totalPnL: number;
  avgPnL: number;
}

export interface DayStats {
  day: string; // Mon, Tue, ...
  trades: number;
  winRate: number;
  totalPnL: number;
}

export interface EmotionStats {
  emotion: Emotion;
  trades: number;
  avgPnL: number;
  totalPnL: number;
  winRate: number;
}

export interface StreakInfo {
  current: number;
  type: "win" | "loss" | "none";
  maxWinStreak: number;
  maxLossStreak: number;
}

export interface HeatmapCell {
  day: string;
  hour: number;
  pnl: number;
  trades: number;
}

export interface AnalyticsSummary {
  totalPnL: number;
  winRate: number;
  profitFactor: number;
  averageRR: number;
  totalTrades: number;
  bestTrade: number;
  worstTrade: number;
  expectancy: number;
  maxDrawdown: number;
  sharpeLike: number;
  maxConsecutiveLosses: number;
  maxConsecutiveWins: number;
}

// ----------------------------------------------------------------------------
// MT5 Integration
// ----------------------------------------------------------------------------

export interface MT5WebhookPayload {
  secret: string;
  profile_id: string;
  ticket: string;
  symbol: string;
  type: TradeType;
  volume: number;
  price: number;
  close_price?: number;
  stop_loss?: number;
  take_profit?: number;
  profit: number;
  commission: number;
  swap: number;
  open_time: string;
  close_time?: string;
  status: TradeStatus;
}

export interface MT5CSVRow {
  Ticket: string;
  "Open Time": string;
  Type: string;
  Size: string;
  Item: string;
  Price: string;
  "S/L": string;
  "T/P": string;
  "Close Time": string;
  "Price.1": string; // close price (papaparse dedupes dup headers like this)
  Commission: string;
  Taxes: string;
  Swap: string;
  Profit: string;
}

export interface CSVImportResult {
  newTrades: number;
  duplicatesSkipped: number;
  errors: string[];
  trades: TradeInsert[];
}

// ----------------------------------------------------------------------------
// AI Coach
// ----------------------------------------------------------------------------

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface AIAnalyzeRequest {
  prompt: string;
  profile_id: string;
}

// ----------------------------------------------------------------------------
// Telegram
// ----------------------------------------------------------------------------

export interface TelegramSendResult {
  success: boolean;
  error?: string;
}

// ----------------------------------------------------------------------------
// Filters
// ----------------------------------------------------------------------------

export interface TradeFilters {
  dateFrom?: string;
  dateTo?: string;
  symbol?: string;
  session?: Session;
  emotion?: Emotion;
  type?: TradeType;
  starredOnly?: boolean;
  status?: TradeStatus;
}

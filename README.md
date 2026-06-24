# TradeVault

A personal prop trading journal — dark trading-terminal aesthetic, built on Next.js 14 (App Router) + Supabase + Groq.

## Stack

- **Framework:** Next.js 14 (App Router, TypeScript, strict mode)
- **Database/Auth/Realtime/Storage:** Supabase
- **Styling:** Tailwind CSS + custom shadcn-style primitives
- **Charts:** Recharts
- **AI Coach:** Groq (`llama-3.3-70b-versatile`)
- **Notifications:** Telegram Bot API
- **Deployment target:** Vercel

## 1. Install dependencies

```bash
npm install
```

## 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open the SQL Editor and run `supabase/schema.sql` from this repo. It creates:
   - `profiles`, `trades`, `journal_entries` tables
   - Row Level Security policies scoping every row to the authenticated user
   - A `trade-screenshots` storage bucket with public read access
   - A realtime publication on `trades` (for the live Open Positions widget)
3. Under **Authentication → Users**, manually create your single user account (email + password), since there's no public sign-up flow — this is a single-user app by design.
4. Copy your Project URL, anon key, and service role key from **Project Settings → API**.

## 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in:

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (keep secret, server-only) |
| `GROQ_API_KEY` | [console.groq.com/keys](https://console.groq.com/keys) |
| `TELEGRAM_BOT_TOKEN` | Message [@BotFather](https://t.me/BotFather) on Telegram → `/newbot` |
| `TELEGRAM_CHAT_ID` | Message [@userinfobot](https://t.me/userinfobot) or call `getUpdates` on your bot |
| `MT5_WEBHOOK_SECRET` | Generate any long random string yourself |

## 4. Run locally

```bash
npm run dev
```

Visit `http://localhost:3000`, sign in with the user you created in Supabase Auth, and create your first prop firm profile.

## 5. Connecting MT5

TradeVault accepts trade data two ways — you don't need both:

### Option A — CSV import (no coding required)
In MT5: **Terminal → History → right-click → Save as Report (CSV)**. Then in TradeVault, go to **Trades → Import CSV** and drop the file in. Duplicate tickets are automatically skipped on re-import.

### Option B — Live webhook from an Expert Advisor
If you write or use an MT5 Expert Advisor that can make HTTP requests (MT5's `WebRequest()` function, with the webhook domain allow-listed in MT5's Options), POST to:

```
POST https://your-deployment.vercel.app/api/mt5/webhook
Content-Type: application/json

{
  "secret": "<value of MT5_WEBHOOK_SECRET>",
  "profile_id": "<the Profile's UUID, shown on the Profiles page>",
  "ticket": "123456789",
  "symbol": "EURUSD",
  "type": "BUY",
  "volume": 0.5,
  "price": 1.0850,
  "close_price": 1.0875,
  "stop_loss": 1.0820,
  "take_profit": 1.0900,
  "profit": 45.20,
  "commission": -2.00,
  "swap": -0.50,
  "open_time": "2026-06-24T08:15:00Z",
  "close_time": "2026-06-24T09:42:00Z",
  "status": "CLOSED"
}
```

This repo does not include the MQL5 Expert Advisor source itself — only the receiving Next.js endpoint. You'll need to write or adapt an EA that calls `WebRequest()` with this payload shape when a position opens/closes.

## 6. Telegram bot commands (optional)

Set your bot's webhook to `https://your-deployment.vercel.app/api/telegram/webhook` to enable `/status`, `/limits`, and `/help` commands from your phone.

```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://your-deployment.vercel.app/api/telegram/webhook"
```

## 7. Deploy

Push to GitHub, import into Vercel, and add the same environment variables in **Project Settings → Environment Variables**.

## Project structure

See inline comments in `types/index.ts` and `lib/` for the data model and business logic. Key files:

- `lib/analytics.ts` — every performance calculation (win rate, profit factor, drawdown, expectancy, streaks, etc.)
- `lib/mt5/` — webhook validation and MT5 CSV parsing
- `lib/groq.ts` — AI coach context building + Groq calls
- `lib/telegram.ts` — all notification templates
- `supabase/schema.sql` — full DB schema + RLS policies

-- ============================================================================
-- TradeVault — Supabase Schema
-- Run this in the Supabase SQL Editor (or via `supabase db push`) before
-- using the app. Designed for a single authenticated user; RLS policies
-- scope every row to auth.uid() regardless, so the schema is technically
-- safe even if you ever add more users.
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------------------
-- profiles (prop firm accounts)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  firm_name text not null,
  phase text not null check (phase in ('Challenge', 'Verification', 'Funded')),
  account_size numeric not null check (account_size > 0),
  daily_loss_limit_pct numeric not null check (daily_loss_limit_pct >= 0),
  max_drawdown_pct numeric not null check (max_drawdown_pct >= 0),
  profit_target_pct numeric not null check (profit_target_pct >= 0),
  starting_balance numeric not null check (starting_balance >= 0),
  current_balance numeric not null default 0,
  color_badge text not null default '#6366f1',
  webhook_secret text not null default encode(gen_random_bytes(16), 'hex'),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_user_id_idx on public.profiles(user_id);

-- ----------------------------------------------------------------------------
-- trades
-- ----------------------------------------------------------------------------
create table if not exists public.trades (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  ticket text,
  symbol text not null,
  type text not null check (type in ('BUY', 'SELL')),
  status text not null default 'CLOSED' check (status in ('OPEN', 'CLOSED')),
  lot_size numeric not null check (lot_size > 0),
  open_price numeric not null,
  close_price numeric,
  stop_loss numeric,
  take_profit numeric,
  open_time timestamptz not null,
  close_time timestamptz,
  commission numeric not null default 0,
  swap numeric not null default 0,
  profit numeric,
  pips numeric,
  rr numeric,
  session text check (session in ('London', 'New York', 'Tokyo', 'Sydney', 'Overlap')),
  emotion text check (emotion in ('Calm', 'Confident', 'Anxious', 'Fearful', 'Greedy', 'Neutral')),
  setup text,
  tags text[] not null default '{}',
  notes text,
  screenshots text[] not null default '{}',
  starred boolean not null default false,
  source text not null default 'manual' check (source in ('manual', 'mt5_webhook', 'csv_import')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists trades_profile_id_idx on public.trades(profile_id);
create index if not exists trades_user_id_idx on public.trades(user_id);
create index if not exists trades_open_time_idx on public.trades(open_time desc);
create unique index if not exists trades_profile_ticket_unique
  on public.trades(profile_id, ticket)
  where ticket is not null;

-- ----------------------------------------------------------------------------
-- journal_entries
-- ----------------------------------------------------------------------------
create table if not exists public.journal_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  bias text check (bias in ('Bullish', 'Bearish', 'Neutral')),
  economic_events text,
  daily_goal text,
  mood text check (mood in ('Great', 'Good', 'Okay', 'Bad', 'Terrible')),
  energy_level smallint check (energy_level between 1 and 5),
  review text,
  lessons_learned text,
  plan_for_tomorrow text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, date)
);

create index if not exists journal_entries_profile_id_idx on public.journal_entries(profile_id);
create index if not exists journal_entries_date_idx on public.journal_entries(date desc);

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.trades enable row level security;
alter table public.journal_entries enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = user_id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = user_id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = user_id);
create policy "profiles_delete_own" on public.profiles
  for delete using (auth.uid() = user_id);

create policy "trades_select_own" on public.trades
  for select using (auth.uid() = user_id);
create policy "trades_insert_own" on public.trades
  for insert with check (auth.uid() = user_id);
create policy "trades_update_own" on public.trades
  for update using (auth.uid() = user_id);
create policy "trades_delete_own" on public.trades
  for delete using (auth.uid() = user_id);

create policy "journal_select_own" on public.journal_entries
  for select using (auth.uid() = user_id);
create policy "journal_insert_own" on public.journal_entries
  for insert with check (auth.uid() = user_id);
create policy "journal_update_own" on public.journal_entries
  for update using (auth.uid() = user_id);
create policy "journal_delete_own" on public.journal_entries
  for delete using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- updated_at trigger
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trades_set_updated_at on public.trades;
create trigger trades_set_updated_at
  before update on public.trades
  for each row execute function public.set_updated_at();

drop trigger if exists journal_set_updated_at on public.journal_entries;
create trigger journal_set_updated_at
  before update on public.journal_entries
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Realtime
-- ----------------------------------------------------------------------------
alter publication supabase_realtime add table public.trades;

-- ----------------------------------------------------------------------------
-- Storage bucket for trade screenshots
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('trade-screenshots', 'trade-screenshots', true)
on conflict (id) do nothing;

create policy "trade_screenshots_select_all" on storage.objects
  for select using (bucket_id = 'trade-screenshots');
create policy "trade_screenshots_insert_own" on storage.objects
  for insert with check (bucket_id = 'trade-screenshots' and auth.uid() is not null);
create policy "trade_screenshots_delete_own" on storage.objects
  for delete using (bucket_id = 'trade-screenshots' and auth.uid() is not null);

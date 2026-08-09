-- ============================================================
-- Stripe Connect Express & Subscriptions Migration Schema
-- ============================================================
-- Run this script in your Supabase Dashboard SQL Editor
-- ============================================================

-- 1. SUBSCRIPTIONS TABLE
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade unique not null,
  role text not null default 'athlete', -- 'athlete' | 'coach'
  tier text not null default 'free', -- 'free' | 'pro' | 'basic' | 'plus'
  status text not null default 'active', -- 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table subscriptions enable row level security;

create policy "Users can view own subscription"
  on subscriptions for select
  using (user_id in (select id from profiles where auth_user_id = auth.uid()));

create policy "Users can insert own subscription record"
  on subscriptions for insert
  with check (user_id in (select id from profiles where auth_user_id = auth.uid()));

create policy "Users can update own subscription record"
  on subscriptions for update
  using (user_id in (select id from profiles where auth_user_id = auth.uid()));

create index if not exists idx_subscriptions_user_id on subscriptions(user_id);
create index if not exists idx_subscriptions_stripe_customer on subscriptions(stripe_customer_id);


-- 2. STRIPE CONNECT ACCOUNTS TABLE (Coach Express Payouts)
create table if not exists stripe_connect_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade unique not null,
  stripe_account_id text not null,
  charges_enabled boolean not null default false,
  payouts_enabled boolean not null default false,
  onboarding_completed boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table stripe_connect_accounts enable row level security;

create policy "Coaches can view own connect account"
  on stripe_connect_accounts for select
  using (user_id in (select id from profiles where auth_user_id = auth.uid()));

create policy "Coaches can insert own connect account record"
  on stripe_connect_accounts for insert
  with check (user_id in (select id from profiles where auth_user_id = auth.uid()));

create policy "Coaches can update own connect account record"
  on stripe_connect_accounts for update
  using (user_id in (select id from profiles where auth_user_id = auth.uid()));

create index if not exists idx_stripe_connect_user_id on stripe_connect_accounts(user_id);
create index if not exists idx_stripe_connect_account_id on stripe_connect_accounts(stripe_account_id);


-- 3. SESSION PAYMENTS TABLE (10% Application Fee Payout Splits)
create table if not exists session_payments (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references consultation_bookings(id) on delete set null,
  athlete_id uuid references profiles(id) on delete cascade not null,
  coach_id uuid references profiles(id) on delete set null,
  amount_total numeric not null,
  application_fee_amount numeric not null, -- 10% platform commission
  coach_payout_amount numeric not null, -- 90% coach payout
  stripe_payment_intent_id text,
  status text not null default 'succeeded', -- 'succeeded' | 'pending' | 'failed' | 'refunded'
  created_at timestamptz not null default now()
);

alter table session_payments enable row level security;

create policy "Users can view own session payments as athlete or coach"
  on session_payments for select
  using (
    athlete_id in (select id from profiles where auth_user_id = auth.uid()) or
    coach_id in (select id from profiles where auth_user_id = auth.uid())
  );

create policy "Athletes can insert session payment record"
  on session_payments for insert
  with check (
    athlete_id in (select id from profiles where auth_user_id = auth.uid())
  );

create index if not exists idx_session_payments_athlete on session_payments(athlete_id);
create index if not exists idx_session_payments_coach on session_payments(coach_id);
create index if not exists idx_session_payments_session on session_payments(session_id);

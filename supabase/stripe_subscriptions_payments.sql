-- ============================================================
-- Stripe Subscriptions and Payments Schema & RLS Policies
-- ============================================================
-- Run this script in your Supabase Dashboard SQL Editor
-- ============================================================

-- 1. SUBSCRIPTIONS TABLE
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade unique not null,
  tier text not null default 'free', -- 'free' | 'athlete_pro' | 'coach_basic' | 'coach_pro'
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

-- 2. PAYMENTS TABLE (Session Payments & 10% Commission Tracking)
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references consultation_bookings(id) on delete set null,
  user_id uuid references profiles(id) on delete cascade not null,
  coach_id uuid references profiles(id) on delete set null,
  amount numeric not null,
  commission_amount numeric not null, -- 10% retained by platform
  status text not null default 'succeeded', -- 'succeeded' | 'pending' | 'failed' | 'refunded'
  stripe_payment_intent_id text,
  created_at timestamptz not null default now()
);

alter table payments enable row level security;

create policy "Users can view own payments as payer or payee"
  on payments for select
  using (
    user_id in (select id from profiles where auth_user_id = auth.uid()) or
    coach_id in (select id from profiles where auth_user_id = auth.uid())
  );

create policy "Athletes can insert payment record"
  on payments for insert
  with check (
    user_id in (select id from profiles where auth_user_id = auth.uid())
  );

create index if not exists idx_payments_user_id on payments(user_id);
create index if not exists idx_payments_coach_id on payments(coach_id);
create index if not exists idx_payments_session_id on payments(session_id);

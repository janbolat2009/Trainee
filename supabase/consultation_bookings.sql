-- ============================================================
-- Consultation Booking and Availability Tables
-- ============================================================
-- Run this migration in your Supabase Dashboard:
--   SQL Editor → New Query → paste → Run
-- ============================================================

create table if not exists coach_available_slots (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid references profiles(id) on delete cascade not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  format text not null default 'online', -- 'online' | 'offline'
  location text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table coach_available_slots enable row level security;

create policy "Public can read active coach slots"
  on coach_available_slots for select
  using (is_active = true);

create policy "Coach inserts own slots"
  on coach_available_slots for insert
  with check (coach_id in (select id from profiles where auth_user_id = auth.uid()));

create policy "Coach updates own slots"
  on coach_available_slots for update
  using (coach_id in (select id from profiles where auth_user_id = auth.uid()));

-- Booked consultations requested by athletes
create table if not exists consultation_bookings (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid references profiles(id) on delete cascade not null,
  athlete_id uuid references profiles(id) on delete cascade not null,
  athlete_name text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  format text not null default 'online', -- 'online' | 'offline'
  location text,
  status text not null default 'pending', -- 'pending' | 'confirmed' | 'cancelled'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table consultation_bookings enable row level security;

create policy "Participants can read consultation bookings"
  on consultation_bookings for select
  using (
    coach_id in (select id from profiles where auth_user_id = auth.uid()) or
    athlete_id in (select id from profiles where auth_user_id = auth.uid())
  );

create policy "Athletes create bookings for themselves"
  on consultation_bookings for insert
  with check (
    athlete_id in (select id from profiles where auth_user_id = auth.uid()) and
    coach_id is not null
  );

create policy "Participants can update booking status"
  on consultation_bookings for update
  using (
    coach_id in (select id from profiles where auth_user_id = auth.uid()) or
    athlete_id in (select id from profiles where auth_user_id = auth.uid())
  );

create index if not exists idx_consultation_bookings_coach_starts_at on consultation_bookings(coach_id, starts_at asc);
create index if not exists idx_consultation_bookings_athlete_starts_at on consultation_bookings(athlete_id, starts_at asc);

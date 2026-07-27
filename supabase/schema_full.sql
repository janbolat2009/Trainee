-- Full Normalized Supabase Schema for TRAINEE App
-- Includes Profiles, Coach Listings (Posts), Applications, Realtime Conversations & Messages, and RLS Policies.

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade not null,
  role text not null default 'athlete', -- 'athlete' | 'coach' | 'club'
  name text not null,
  email text not null,
  avatar text,
  sport text,
  skill_level text,
  location text,
  bio text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Public can read profiles"
  on profiles for select using (true);

create policy "Users can update own profile"
  on profiles for update using (auth_user_id = auth.uid());

create policy "Users can insert own profile"
  on profiles for insert with check (auth_user_id = auth.uid());

-- 2. COACH LISTINGS (POSTS) TABLE
create table if not exists coach_listings (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid references profiles(id) on delete cascade not null,
  sport text not null,
  specialization text,
  athlete_level text not null default 'Any',
  training_format text not null default 'hybrid', -- 'online' | 'offline' | 'hybrid'
  price numeric not null default 0,
  billing_period text not null default 'session', -- 'session' | 'month'
  description text,
  coaching_style text,
  achievements text[] default '{}',
  location text,
  media_urls text[] default '{}',
  status text not null default 'active', -- 'active' | 'paused' | 'archived'
  created_at timestamptz not null default now()
);

alter table coach_listings enable row level security;

create policy "Public can read active listings"
  on coach_listings for select using (true);

create policy "Coach manages own listings"
  on coach_listings for all
  using (coach_id in (select id from profiles where auth_user_id = auth.uid()))
  with check (coach_id in (select id from profiles where auth_user_id = auth.uid()));

-- Index for ordering listings
create index if not exists idx_coach_listings_created_at on coach_listings(created_at desc);

-- 3. LISTING APPLICATIONS (RESPONSES) TABLE
create table if not exists listing_applications (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references coach_listings(id) on delete cascade not null,
  coach_id uuid references profiles(id) on delete cascade not null,
  athlete_id uuid references profiles(id) on delete cascade not null,
  athlete_name text,
  athlete_avatar text,
  message text,
  status text not null default 'pending', -- 'pending' | 'accepted' | 'declined'
  created_at timestamptz not null default now()
);

alter table listing_applications enable row level security;

create policy "Athletes see own applications"
  on listing_applications for select
  using (athlete_id in (select id from profiles where auth_user_id = auth.uid()));

create policy "Athletes create applications"
  on listing_applications for insert
  with check (athlete_id in (select id from profiles where auth_user_id = auth.uid()));

create policy "Coaches see applications for their listings"
  on listing_applications for select
  using (coach_id in (select id from profiles where auth_user_id = auth.uid()));

create policy "Coaches update application status"
  on listing_applications for update
  using (coach_id in (select id from profiles where auth_user_id = auth.uid()));

create index if not exists idx_applications_created_at on listing_applications(created_at desc);

-- 4. CONVERSATIONS TABLE (CHAT DIALOGS)
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references coach_listings(id) on delete set null,
  application_id uuid references listing_applications(id) on delete set null,
  participant_1 uuid references profiles(id) on delete cascade not null,
  participant_2 uuid references profiles(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table conversations enable row level security;

create policy "Participants can read conversations"
  on conversations for select
  using (
    participant_1 in (select id from profiles where auth_user_id = auth.uid()) or
    participant_2 in (select id from profiles where auth_user_id = auth.uid())
  );

create policy "Participants can insert conversations"
  on conversations for insert
  with check (
    participant_1 in (select id from profiles where auth_user_id = auth.uid()) or
    participant_2 in (select id from profiles where auth_user_id = auth.uid())
  );

create policy "Participants can update conversations"
  on conversations for update
  using (
    participant_1 in (select id from profiles where auth_user_id = auth.uid()) or
    participant_2 in (select id from profiles where auth_user_id = auth.uid())
  );

-- 5. MESSAGES TABLE (CHAT MESSAGES)
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade not null,
  sender_id uuid references profiles(id) on delete cascade not null,
  text text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table messages enable row level security;

create policy "Participants can read messages"
  on messages for select
  using (
    conversation_id in (
      select id from conversations where
        participant_1 in (select id from profiles where auth_user_id = auth.uid()) or
        participant_2 in (select id from profiles where auth_user_id = auth.uid())
    )
  );

create policy "Participants can insert messages"
  on messages for insert
  with check (
    conversation_id in (
      select id from conversations where
        participant_1 in (select id from profiles where auth_user_id = auth.uid()) or
        participant_2 in (select id from profiles where auth_user_id = auth.uid())
    )
  );

create policy "Participants can update message read status"
  on messages for update
  using (
    conversation_id in (
      select id from conversations where
        participant_1 in (select id from profiles where auth_user_id = auth.uid()) or
        participant_2 in (select id from profiles where auth_user_id = auth.uid())
    )
  );

create index if not exists idx_messages_conversation_created on messages(conversation_id, created_at asc);

-- 6. ENABLE REALTIME PUBLICATION
alter publication supabase_realtime add table conversations;
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table listing_applications;

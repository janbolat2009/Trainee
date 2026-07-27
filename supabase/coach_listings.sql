-- Coach Listings table
create table if not exists coach_listings (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid references profiles(id) on delete cascade not null,
  sport text not null,
  specialization text,
  athlete_level text not null, -- 'Beginner' | 'Intermediate' | 'Advanced' | 'Any'
  training_format text not null, -- 'online' | 'offline' | 'hybrid'
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

-- Enable RLS
alter table coach_listings enable row level security;

-- Coach can manage their own listings
create policy "Coach manages own listings"
  on coach_listings for all
  using (coach_id = (select id from profiles where auth_user_id = auth.uid()))
  with check (coach_id = (select id from profiles where auth_user_id = auth.uid()));

-- Anyone can view active listings (for Discovery)
create policy "Public can view active listings"
  on coach_listings for select
  using (status = 'active');

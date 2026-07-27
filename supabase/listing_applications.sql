-- Listing Applications table
create table if not exists listing_applications (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references coach_listings(id) on delete cascade not null,
  coach_id uuid references profiles(id) not null,
  athlete_id uuid references profiles(id) not null,
  athlete_name text,
  athlete_avatar text,
  message text,
  status text not null default 'pending', -- 'pending' | 'accepted' | 'declined'
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table listing_applications enable row level security;

-- Athlete sees their own applications
create policy "Athlete sees own applications"
  on listing_applications for select
  using (athlete_id = (select id from profiles where auth_user_id = auth.uid()));

-- Athlete creates applications
create policy "Athlete creates applications"
  on listing_applications for insert
  with check (athlete_id = (select id from profiles where auth_user_id = auth.uid()));

-- Coach sees applications for their listings
create policy "Coach sees their listing applications"
  on listing_applications for select
  using (coach_id = (select id from profiles where auth_user_id = auth.uid()));

-- Coach updates application status
create policy "Coach updates application status"
  on listing_applications for update
  using (coach_id = (select id from profiles where auth_user_id = auth.uid()));

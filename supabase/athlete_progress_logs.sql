-- Athlete Progress Logs table
create table if not exists athlete_progress_logs (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid references profiles(id) not null,
  coach_id uuid references profiles(id) not null,
  logged_at timestamptz not null default now(),
  metric_type text not null,
  value numeric,
  notes text,
  wellbeing integer check (wellbeing between 1 and 10),   -- 1-10
  fatigue integer check (fatigue between 1 and 10),       -- 1-10
  pain_level integer check (pain_level between 0 and 10), -- 0-10
  sleep_hours numeric,
  flag text not null default 'normal' -- 'normal' | 'attention' | 'risk'
);

-- Enable RLS
alter table athlete_progress_logs enable row level security;

-- Athlete writes their own logs
create policy "Athlete creates own progress logs"
  on athlete_progress_logs for insert
  with check (athlete_id = (select id from profiles where auth_user_id = auth.uid()));

-- Athlete reads their own logs
create policy "Athlete reads own progress logs"
  on athlete_progress_logs for select
  using (athlete_id = (select id from profiles where auth_user_id = auth.uid()));

-- Athlete updates own logs
create policy "Athlete updates own progress logs"
  on athlete_progress_logs for update
  using (athlete_id = (select id from profiles where auth_user_id = auth.uid()));

-- Coach reads logs of their students
create policy "Coach reads student progress logs"
  on athlete_progress_logs for select
  using (coach_id = (select id from profiles where auth_user_id = auth.uid()));

-- Enable Realtime for coach dashboard
alter publication supabase_realtime add table athlete_progress_logs;

-- UniMate initial schema
-- Run this in the Supabase SQL Editor (Project > SQL Editor > New query)

-- ── Profiles ──────────────────────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  university text not null default '',
  major text not null default '',
  year_level text not null default '1st Year',
  gpa_goal numeric default 3.5,
  language text not null default 'en' check (language in ('en','ar')),
  theme text not null default 'dark' check (theme in ('dark','light')),
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users manage own profile" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Auto-create profile row on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  insert into public.gamification (user_id) values (new.id);
  insert into public.graduation_progress (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Courses ───────────────────────────────────────────────────────────────
create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  code text not null default '',
  instructor text not null default '',
  color text not null default '#7c3aed',
  status text not null default 'active' check (status in ('active','completed','upcoming')),
  credits int not null default 3,
  progress int not null default 0,
  grade text,
  semester text,
  topics jsonb not null default '[]'::jsonb,
  syllabus_text text,
  created_at timestamptz not null default now()
);

alter table courses enable row level security;

create policy "Users manage own courses" on courses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Class Schedule ────────────────────────────────────────────────────────
create table if not exists class_schedule (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references courses(id) on delete cascade,
  course_name text not null,
  color text not null default '#7c3aed',
  room text not null default 'TBD',
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time text not null,
  end_time text not null,
  created_at timestamptz not null default now()
);

alter table class_schedule enable row level security;

create policy "Users manage own schedule" on class_schedule
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Assignments ───────────────────────────────────────────────────────────
create table if not exists assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references courses(id) on delete cascade,
  course_name text not null,
  course_color text not null default '#7c3aed',
  title text not null,
  description text not null default '',
  due_date timestamptz not null,
  type text not null default 'assignment' check (type in ('assignment','quiz','project','exam','lab')),
  status text not null default 'pending' check (status in ('pending','in_progress','submitted','graded')),
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  created_at timestamptz not null default now()
);

alter table assignments enable row level security;

create policy "Users manage own assignments" on assignments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Notes ─────────────────────────────────────────────────────────────────
create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references courses(id) on delete set null,
  course_name text not null default '',
  course_color text not null default '#7c3aed',
  title text not null default 'Untitled Note',
  content text not null default '',
  canvas_data text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table notes enable row level security;

create policy "Users manage own notes" on notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Weak Spots ────────────────────────────────────────────────────────────
create table if not exists weak_spots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references courses(id) on delete cascade,
  topic text not null,
  wrong_count int not null default 1,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table weak_spots enable row level security;

create policy "Users manage own weak spots" on weak_spots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Gamification ──────────────────────────────────────────────────────────
create table if not exists gamification (
  user_id uuid primary key references auth.users(id) on delete cascade,
  total_xp int not null default 0,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  level int not null default 1,
  last_active_date date,
  updated_at timestamptz not null default now()
);

alter table gamification enable row level security;

create policy "Users manage own gamification" on gamification
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Graduation Progress ───────────────────────────────────────────────────
create table if not exists graduation_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  gpa numeric not null default 0,
  credits_completed int not null default 0,
  total_credits_required int not null default 120,
  expected_graduation text default '',
  updated_at timestamptz not null default now()
);

alter table graduation_progress enable row level security;

create policy "Users manage own graduation progress" on graduation_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Study Plan Sessions ───────────────────────────────────────────────────
create table if not exists study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day_of_week text not null,
  course_name text not null,
  topic text not null,
  duration_minutes int not null default 60,
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  done boolean not null default false,
  created_at timestamptz not null default now()
);

alter table study_sessions enable row level security;

create policy "Users manage own study sessions" on study_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Indexes ───────────────────────────────────────────────────────────────
create index if not exists idx_courses_user on courses(user_id);
create index if not exists idx_schedule_user on class_schedule(user_id);
create index if not exists idx_assignments_user_due on assignments(user_id, due_date);
create index if not exists idx_notes_user on notes(user_id);
create index if not exists idx_weak_spots_user on weak_spots(user_id, resolved);
create index if not exists idx_study_sessions_user on study_sessions(user_id);

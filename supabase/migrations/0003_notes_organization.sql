-- Notes organization: folders, tags, multi-page notes
-- Run this in the Supabase SQL Editor (Project > SQL Editor > New query)

-- ── Note Folders ──────────────────────────────────────────────────────────
create table if not exists note_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#7c3aed',
  created_at timestamptz not null default now()
);

alter table note_folders enable row level security;

create policy "Users manage own note folders" on note_folders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Notes: add folder + tags ─────────────────────────────────────────────
alter table notes add column if not exists folder_id uuid references note_folders(id) on delete set null;
alter table notes add column if not exists tags text[] not null default '{}';

-- ── Note Pages ────────────────────────────────────────────────────────────
-- A note can have multiple pages (like a notebook). The existing notes.content /
-- notes.canvas_data columns are kept as-is for backward compatibility and
-- continue to represent "page 1" for any code that hasn't migrated to reading
-- from note_pages yet. We additionally backfill a page_number=1 row into
-- note_pages for every existing note so that new page-aware UI has a
-- consistent place to read/write from immediately, without requiring a
-- one-time client-side migration step.
create table if not exists note_pages (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references notes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  page_number int not null default 1,
  content text not null default '',
  canvas_data text,
  created_at timestamptz not null default now()
);

alter table note_pages enable row level security;

create policy "Users manage own note pages" on note_pages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists idx_note_pages_note_page on note_pages(note_id, page_number);

-- Backfill: create page 1 for every existing note that doesn't already have one.
insert into note_pages (note_id, user_id, page_number, content, canvas_data)
select n.id, n.user_id, 1, n.content, n.canvas_data
from notes n
where not exists (
  select 1 from note_pages p where p.note_id = n.id and p.page_number = 1
);

-- ── Indexes ───────────────────────────────────────────────────────────────
create index if not exists idx_note_folders_user on note_folders(user_id);
create index if not exists idx_notes_folder on notes(folder_id);

-- Run this in your Supabase SQL editor

create table if not exists stories (
  id          text primary key,
  title       text not null,
  description text,
  active      boolean default true,
  created_at  timestamptz default now()
);

create table if not exists nodes (
  id         text not null,
  story_id   text not null references stories(id) on delete cascade,
  data       jsonb not null,
  updated_at timestamptz default now(),
  primary key (id, story_id)
);

-- Index for fast story lookups
create index if not exists nodes_story_id_idx on nodes(story_id);

-- Auto-update updated_at on row change
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger nodes_updated_at
  before update on nodes
  for each row execute function update_updated_at();

-- Seed the Matrix story
insert into stories (id, title, description) values
  ('matrix', 'The Matrix', 'You are Neo. The choice has already been made.')
on conflict (id) do nothing;

-- Enable public read access (anon key is safe to expose for reads)
alter table stories enable row level security;
alter table nodes   enable row level security;

create policy "Public read stories" on stories for select using (true);
create policy "Public read nodes"   on nodes   for select using (true);

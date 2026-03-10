-- Professors table
create table if not exists public.professors (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text
);

-- Teams table
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  level text not null check (level in ('UH', 'H', 'M', 'L', 'X')),
  faculty_ids uuid[] not null default '{}'
);

-- Students table
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  roll_no text not null,
  team_id uuid not null references public.teams(id) on delete cascade
);

create unique index if not exists students_roll_no_idx on public.students(roll_no);

-- Marks table
create table if not exists public.marks (
  team_id uuid primary key references public.teams(id) on delete cascade,
  team_scores jsonb not null default '{}'::jsonb,
  individual_scores jsonb not null default '{}'::jsonb
);

-- RLS policies can be tailored as needed, for example:
-- enable row level security
alter table public.professors enable row level security;
alter table public.teams enable row level security;
alter table public.students enable row level security;
alter table public.marks enable row level security;

-- Example policies (adjust to match your auth strategy):
-- allow professors to read their own profile
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'professors' and policyname = 'Professors can read self'
  ) then
    create policy "Professors can read self"
      on public.professors
      for select
      using (auth.uid() = id);
  end if;
end $$;


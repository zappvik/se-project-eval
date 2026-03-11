## SE Project Evaluation Portal

Faculty portal for panel-based software engineering project evaluation.

### What this app does

- **Auth**: faculty sign in using Supabase Auth.
- **Dashboard**: shows assigned teams split into **Pending** vs **Completed**.
- **Evaluation**:
  - **Team (20 marks)**: Implementation quality (8), Stability + mocking (4), CI/CD (3), UX (2), Docs + architecture (3)
  - **Individual (10 marks per student)**: Technical contribution (5), Ownership of role (2), Engineering practices (3)
- **Storage**: marks are saved in `public.marks` as JSONB: `team_scores`, `individual_scores`.

### Tech stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase (Auth + Postgres)

### Local setup

#### 1) Install dependencies

```bash
npm install
```

#### 2) Configure environment variables

Create a `.env.local` in the project root with:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Notes:
- These are used by both server components and client components.
- Scripts may also require `SUPABASE_SERVICE_ROLE_KEY` (do **not** expose this in the browser).

#### 3) Create database tables

Run `supabase/schema.sql` in the Supabase SQL editor.

Row Level Security (RLS) is enabled by default in that schema. You must add policies for `teams`, `students`, and `marks` that match your auth strategy, otherwise queries may fail (or be overly permissive if you later add broad policies).

At minimum, you want policies that allow:
- A professor to read their own row in `public.professors`
- Assigned professors to read their teams/students
- Assigned professors to insert/update marks for their teams

#### 4) Seed teams + students (optional)

There is a helper script that reads an Excel sheet and seeds teams/students:

```bash
npm run seed -- ./data/EList.xlsx
```

#### 5) Run the dev server

```bash
npm run dev
```

Open `http://localhost:3000`.

### Data model (high level)

- `public.professors`: one row per faculty (`id` references `auth.users.id`)
- `public.teams`: team info + `faculty_ids` (uuid[])
- `public.students`: students linked to a team (`team_id`)
- `public.marks`: one row per team (`team_id`) containing:
  - `team_scores` JSONB
  - `individual_scores` JSONB keyed by student id

### Admins

Admins are currently determined by a hardcoded allow-list in the app (`ADMIN_EMAILS` in the dashboard and evaluation pages).

### Common commands

```bash
npm run dev
npm run build
npm run start
npm run lint
```

### Reset marks (testing)

To clear evaluation data while keeping teams/students:

```sql
truncate table public.marks cascade;
```

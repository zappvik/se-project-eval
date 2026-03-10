## SE Project Evaluation Portal

Faculty portal for panel-based software engineering project evaluation.

### Features

- **Faculty login** using Supabase Auth
- **Dashboard** showing assigned teams (pending vs completed)
- **Evaluation sheet**
  - Team marks (20): Implementation quality (8), Stability + mocking (4), CI/CD (3), UX (2), Docs + architecture (3)
  - Individual marks (10 per student): Technical contribution (4), Ownership of role (2), Engineering practices (2), Understanding/viva (2)
  - Individual totals compute live in the UI and are validated server-side on save
- **Persistence**: scores are stored in `public.marks` as JSONB (`team_scores`, `individual_scores`)

### Tech stack

- Next.js (App Router) + TypeScript + Tailwind
- Supabase (Auth + Postgres)

### Setup

- **Install**

```bash
npm install
```

- **Environment**

Create `.env.local` with your Supabase project credentials (see `.env.example`).

- **Database**

Run the SQL in `supabase/schema.sql` in the Supabase SQL editor.

Note: Row Level Security (RLS) is enabled in the schema. Make sure your policies allow:
- the logged-in professor to read their own row in `public.professors`
- assigned professors to read their teams/students and upsert marks for assigned teams

- **Dev server**

```bash
npm run dev
```

Open `http://localhost:3000`.

### Data model (high level)

- `public.teams`: team info + `faculty_ids` (uuid[])
- `public.students`: students linked to a team (`team_id`)
- `public.marks`: one row per team (`team_id`) with:
  - `team_scores` JSONB
  - `individual_scores` JSONB keyed by student id

### Useful scripts

```bash
npm run dev
npm run build
npm run start
```

### Reset marks for testing

To clear only evaluation data and keep teams/students:

```sql
truncate table public.marks restart identity cascade;
```

# JobLens

> AI-powered job discovery and analysis. Automatically fetches vacancies from HeadHunter via n8n, scores them against your profile using GPT-4o-mini, and generates personalized cover letters on demand.



## Features

- **AI vacancy scoring** — GPT-4o-mini analyzes each vacancy against your profile (skills, salary, format) and assigns a 0–100 match score with pros/cons breakdown
- **Telegram notifications** — instant alerts when a high-score vacancy is found
- **Analytics dashboard** — skill frequency charts, work format distribution, timeline
- **Cover letter generation** — one-click personalized cover letters for any vacancy
- **Smart filters** — filter by score, work format, status, favorites, city, and full-text search
- **Auth** — Supabase magic link auth (no passwords)

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Auth | Supabase Auth |
| Database | Supabase PostgreSQL + Prisma 7 ORM |
| AI | OpenAI GPT-4o-mini (Gemini/Claude stubs ready) |
| Automation | n8n (self-hosted or cloud) |
| State | Zustand (UI) + TanStack Query (server state) |
| Charts | Recharts |
| Notifications | Sonner (toast) + Telegram Bot API |
| Styling | Tailwind CSS v4 |

## Project Structure

```
src/
├── app/
│   ├── (app)/              # Protected routes (require auth)
│   │   ├── dashboard/      # Quick stats + recent vacancies
│   │   ├── vacancies/      # List + [id] detail (3 tabs)
│   │   ├── analytics/      # Charts and market trends
│   │   ├── profile/        # Edit skills, experience, salary
│   │   └── settings/       # AI provider, keys, Telegram, HH config
│   └── api/
│       ├── vacancies/ingest    # POST — n8n webhook (Bearer auth)
│       ├── vacancies/          # GET — list with filters
│       ├── vacancies/[id]      # GET/PATCH/DELETE
│       ├── dashboard/stats     # GET — aggregated metrics
│       ├── profile             # GET/PUT
│       ├── settings            # GET/PUT
│       ├── settings/test-telegram  # POST — test bot connection
│       ├── ai/cover-letter     # POST — on-demand generation
│       └── analytics/overview  # GET — charts data
├── lib/
│   ├── ai/
│   │   ├── agent.ts        # AI orchestrator (Zod validation + fallbacks)
│   │   ├── providers.ts    # AI provider adapters (OpenAI/Gemini/Claude)
│   │   └── prompts/        # Prompt A (analysis) + Prompt B (cover letter)
│   ├── hh/client.ts        # HeadHunter API typed client
│   ├── telegram.ts         # Telegram notification service
│   └── prisma.ts           # Prisma singleton (pg adapter)
├── components/
│   ├── layout/             # AppShell, Sidebar, Topbar
│   ├── dashboard/          # StatCard
│   ├── vacancy/            # VacancyCard, ScoreBadge, SkillTag
│   └── shared/             # EmptyState, Skeletons, ErrorBoundary, QueryProvider
├── hooks/useQueries.ts     # All TanStack Query hooks (+ toast feedback)
├── stores/uiStore.ts       # Zustand: sidebar + vacancy filters
└── types/index.ts          # Canonical shared types
```

## Setup

### 1. Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier works)
- An OpenAI API key
- n8n instance (self-hosted or [n8n.cloud](https://n8n.cloud))

### 2. Clone and install

```bash
git clone <repo-url>
cd ai-job-assistant
npm install
```

### 3. Environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local` — see comments in `.env.example`.

### 4. Database

Run Prisma migrations against your Supabase database:

```bash
npx prisma migrate dev
```

Or push the schema directly (no migration history):

```bash
npx prisma db push
```

### 5. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. Configure n8n workflow

In n8n, create a workflow that:
1. Runs on a schedule (e.g., every hour)
2. Calls the HH API: `GET https://api.hh.ru/vacancies?text=...&area=160`
3. For each vacancy, calls `GET https://api.hh.ru/vacancies/{id}` for the full description
4. Posts to your ingest endpoint:

```
POST https://your-app.vercel.app/api/vacancies/ingest
Authorization: Bearer <INGEST_API_KEY>
Content-Type: application/json

{
  "sourceId": "{{ $json.id }}",
  "sourceName": "headhunter",
  "url": "{{ $json.alternate_url }}",
  "title": "{{ $json.name }}",
  "company": "{{ $json.employer.name }}",
  "descriptionRaw": "{{ $json.description_plain }}",
  "userId": "<your-supabase-user-id>",
  ...
}
```

## Deployment

### Vercel (recommended)

1. Push to GitHub
2. Import to Vercel
3. Set all environment variables in Vercel dashboard
4. Deploy — Vercel auto-detects Next.js

### Environment variables required in production

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (server-only) |
| `DATABASE_URL` | Supabase Postgres pooler URL (port 6543) |
| `DIRECT_URL` | Supabase Postgres direct URL (port 5432, for migrations) |
| `INGEST_API_KEY` | Secret key for n8n → ingest endpoint |
| `NEXT_PUBLIC_APP_URL` | Your production URL (for Telegram links) |

## AI Pipeline

```
n8n → POST /api/vacancies/ingest
         ↓ Bearer key auth
         ↓ Dedup check (sourceId + sourceName)
         ↓ Load user profile + settings
         ↓ AI analysis (Prompt A)
            ├─ Extracts: skills, tech stack, requirements
            ├─ Scores: 0–100 with breakdown
            └─ Generates: pros, cons, missing skills, interview topics
         ↓ Save to DB
         ↓ Log LLM call (cost tracking)
         ↓ Telegram notification (if score ≥ threshold)
```

Cover letter (Prompt B) is on-demand only — triggered by user click.

## License

MIT

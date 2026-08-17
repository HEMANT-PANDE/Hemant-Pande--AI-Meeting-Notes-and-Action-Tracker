# Nexora — AI Meeting Notes & Action Tracker

A lightweight, AI-powered web app that stores meeting transcripts, generates structured meeting
insights (summary, key decisions, risks, unanswered questions), and tracks action items to
completion. Built for the Zignuts AI-Native Campus Hiring Challenge — Task 1.

## Project Overview

The core workflow: a user creates a meeting record, pastes or uploads its transcript, and the
system uses an AI provider to extract a summary, key discussion points, key decisions, risks, and
action items (with owner/due date/priority inferred where the transcript supports it — never
invented). The user then reviews, edits, and tracks those action items to completion across a
central Action Tracker, alongside a dashboard of meeting/action-item metrics.

The app is intentionally **not** a meeting/video-conferencing tool — it assumes the meeting has
already happened and begins at "paste the transcript."

## Technology Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 16 (App Router, TypeScript) + Tailwind CSS v4 |
| Backend | Node.js + Express (TypeScript) |
| ORM / DB | Prisma + Neon (serverless Postgres) |
| Auth | JWT (Bearer token) + bcrypt password hashing |
| AI | Provider-agnostic interface — **Gemini** (active), Anthropic Claude and a rule-based **mock** provider also implemented behind the same interface |
| Rich text | Tiptap (manual meeting notes) |
| Forms/validation | react-hook-form + Zod (frontend), Zod (backend) |
| Theming | next-themes (light/dark, class-based) |

Frontend and backend are two separate apps (`frontend/`, `backend/`) communicating over a REST
API — chosen over a single Next.js full-stack app because the backend stack was an explicit,
fixed preference for this assessment, and it cleanly demonstrates the "clear separation between
frontend and backend" requirement.

## Setup Instructions

### Prerequisites
- Node.js 20+
- A Neon Postgres database (or any Postgres connection string)
- An AI provider API key (Gemini or Anthropic) — optional, the app runs on the mock provider without one

### Backend
```bash
cd backend
npm install
cp .env.example .env       # then fill in DATABASE_URL, JWT_SECRET, and an AI provider key
npx prisma migrate dev     # creates the schema on your database
npm run dev                # http://localhost:4000
```

### Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL, defaults to http://localhost:4000/api
npm run dev                        # http://localhost:3000
```

Register a new account at `/register`, then log in — every other page is behind the auth guard.

## Environment Variables

**`backend/.env`** (see `backend/.env.example`)
| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon/Postgres connection string |
| `PORT` | Backend port (default 4000) |
| `CORS_ORIGIN` | Must match the frontend origin |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | Auth token signing |
| `AI_PROVIDER` | `gemini` \| `anthropic` \| `mock` — swapping providers is a one-line change here |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` | Used when `AI_PROVIDER=anthropic` |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | Used when `AI_PROVIDER=gemini` |

**`frontend/.env.local`** (see `frontend/.env.local.example`)
| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API |

No secrets are committed — both `.env` files are gitignored; only the `.example` templates are tracked.

## Architecture Overview

```
frontend (Next.js, :3000)  ──REST/JSON, Bearer token──►  backend (Express, :4000)  ──Prisma──►  Neon Postgres
                                                                 │
                                                                 └──► AIProvider interface ──► Gemini / Anthropic / Mock
```

- **Frontend**: App Router pages under `src/app`, a protected `(app)` route group that guards
  every authenticated page in one layout, reusable UI primitives in `components/ui`, and small
  `useX` data-fetching hooks (`hooks/`) instead of a heavier data-fetching library, to keep the
  dependency footprint appropriate for the scope.
- **Backend**: layered `routes → controllers → services → Prisma`, with Zod validation
  middleware in front of every route and a central error handler that only ever returns a safe,
  human-readable message (never a stack trace).
- **AI integration**: an `AIProvider` interface (`backend/src/services/ai/ai.types.ts`) with
  interchangeable implementations — `AnthropicProvider`, `GeminiProvider`, `MockAIProvider` — all
  producing the same Zod-validated `AIInsights` shape. `services/ai/index.ts` is the single place
  that picks the active one from `AI_PROVIDER`. When a real provider is active, it's wrapped in a
  `FallbackAIProvider` (`services/ai/fallback.provider.ts`) that automatically retries the request
  against the mock provider if the real one fails — rate-limited, overloaded, or down — so a
  meeting still ends up `aiStatus=COMPLETED` with genuine (if lower-fidelity) insights instead of
  surfacing `FAILED` mid-demo. This is the concrete implementation of the spec's own suggested
  pattern ("a mock AI service when API access is unavailable"), triggered automatically rather
  than requiring a manual `.env` flip — added after live testing hit the Gemini free tier's 20
  request quota. AI generation runs **fire-and-forget** after a meeting is created/edited (the
  request returns immediately with `aiStatus=PENDING`); the frontend polls the meeting until it
  settles into `COMPLETED` or `FAILED` (only possible if *both* the real provider and the mock
  provider fail), which is what powers the "AI processing" / "AI failed, retry" states.

## Database Design

```
User 1───* Meeting 1───* ActionItem
```

- **User**: `id, name, email (unique), passwordHash, createdAt, updatedAt`
- **Meeting**: `title, date, type (enum), participants (string[]), transcript, transcriptSource,
  notes` (manual rich-text notes, kept separate from `transcript`) plus the AI columns —
  `summary, keyDiscussionPoints, keyDecisions, risks, unansweredQuestions (Json), aiStatus (enum:
  PENDING/PROCESSING/COMPLETED/FAILED), aiError, aiGeneratedAt` — and `ownerId → User`.
- **ActionItem**: `description, owner (nullable → "Unassigned"), dueDate (nullable → "Not
  specified"), priority (enum), status (enum), source ("ai" | "manual")`, `meetingId → Meeting`.

A relational schema was the natural fit given the explicit 1-to-many relationships the spec
describes (meetings have many action items, each with clear scalar attributes) — see
`backend/prisma/schema.prisma` for the full schema with indexes.

## API Overview

All routes except `/auth/register` and `/auth/login` require `Authorization: Bearer <token>`.

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Log in |
| POST | `/api/auth/logout` | Stateless — client discards the token |
| GET | `/api/auth/me` | Current user (used to validate a stored token on load) |
| GET | `/api/meetings` | List (search, type filter, pagination) |
| POST | `/api/meetings` | Create (triggers AI generation) |
| GET/PUT/DELETE | `/api/meetings/:id` | Read / update (re-triggers AI if transcript changed) / delete |
| POST | `/api/meetings/:id/regenerate-insights` | Re-run AI on demand |
| GET | `/api/action-items` | List across all meetings (search, status/priority/owner/overdue filters, pagination) |
| POST/PUT/DELETE | `/api/action-items[/:id]` | Create / update / delete |
| GET | `/api/dashboard/stats` | Aggregate counts + recent meetings |

## Assumptions Made

- The transcript is plain text (paste or `.txt` upload); the manual "Notes" field is the one
  place rich text (Tiptap) applies, since the transcript needs to stay plain text to round-trip
  through file upload and feed the AI prompt without HTML-stripping.
- One user's data is fully private to them (no team/sharing model) — matches "basic
  authentication... advanced roles/permissions... not required."
- Transcript files: `.txt` only, 2MB max, read client-side (`File.text()`), no backend file
  storage/S3 — the spec only requires the transcript *text* to be stored, not the original file.
- AI-extracted action items are replaced (not duplicated) each time AI runs on the same meeting;
  manually-added items are never touched by regeneration.

## Features Completed

Auth (register/login/logout/protected routes) · meeting CRUD + search · transcript paste + file
upload · AI summary/decisions/discussion points/risks/unanswered questions · AI action-item
extraction with sensible defaults · full action-item management (create/edit/delete, owner, due
date, priority, status) · central Action Tracker with filters (status, priority, owner, overdue)
and search · dashboard metrics · rich text editor for manual notes · responsive layout (mobile
nav, table→card collapse) · light/dark mode · Zod validation front and back · loading/empty/error/
AI-processing/AI-failed/no-results/confirm-before-delete states.

## Features Not Completed

- No pagination cursor beyond page/limit (offset pagination only — fine at this scale).
- No automated test suite (unit/e2e) — out of scope for the time box; see "Future improvements."
- No file storage (S3) for the original uploaded transcript file, by design (see Assumptions).
- No Docker setup — attempted (multi-stage Dockerfiles for both apps + a Compose file with a
  local Postgres), but the build couldn't be completed or verified in this environment (the host
  machine ran out of disk space, unrelated to the project), so it was removed rather than shipped
  unverified. See "Future improvements."

## Known Limitations

- **Auth token storage**: the JWT is stored in `localStorage` and sent as a Bearer header, not an
  httpOnly cookie. This was a deliberate time-boxed trade-off (avoids CORS/cookie config across
  two localhost ports) but is more exposed to XSS than a cookie-based session would be.
- **AI provider availability**: `503` (temporary overload) is retried twice with backoff
  (`services/ai/withRetry.ts`); `429` (rate limit) is not — observed live, Gemini's free tier
  returns a "retry in ~20-55s" hint far longer than any short backoff budget, so retrying it
  quickly only burns more of an already-exhausted quota. Either way, `FallbackAIProvider` catches
  the failure and completes the meeting via the mock provider instead, so this is only visible in
  server logs, not as a broken meeting — genuine `aiStatus=FAILED` now requires *both* the real
  provider and the mock provider to fail.
- **Shared types**: frontend and backend each declare their own TypeScript types mirroring the
  Prisma schema, since they're two separate npm projects — see Future Improvements.

## Future Improvements

- Extract a shared `types` package (or generate frontend types from the Prisma schema) to remove
  duplication between `frontend/src/types` and the backend's Prisma-generated types.
- Move auth to httpOnly cookies with CSRF protection.
- Add S3-backed storage for the original uploaded transcript file, alongside the parsed text.
- Add unit tests for the Zod validators and AI response schema, and integration tests for the auth
  and meeting flows.
- Support PDF/DOCX transcript uploads (explicitly optional per the spec).
- Kanban view as an alternative presentation for the Action Tracker.
- Add back Docker + Docker Compose (backend, frontend, local Postgres) once verified on a machine
  with adequate disk space — the approach (multi-stage builds, Next.js standalone output,
  `prisma migrate deploy` on container start) is straightforward to redo.

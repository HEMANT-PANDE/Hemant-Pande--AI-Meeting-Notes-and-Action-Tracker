# AI Usage Report

## AI Tools Used

**Claude Code (Sonnet 5)** — used end-to-end as the primary development tool: requirement
analysis, architecture/data-model planning, scaffolding both apps, writing all backend and
frontend code, debugging real runtime issues, and running a live end-to-end smoke test against
the actual provisioned Neon database and Gemini API. No other AI coding tool was used.

## How It Was Used

1. **Planning first.** Before any code, I had it read the problem statement PDF in full and
   produce a phase-wise plan (4 phases, priority-ordered: foundation/auth/CRUD → AI integration →
   action tracking/dashboard → polish/docs) matched to the time box, before writing anything.
2. **Scaffolding + implementation.** It generated the Next.js and Express project structures, the
   Prisma schema, and all application code (auth, meeting CRUD, the `AIProvider` abstraction and
   its three implementations, action items, dashboard, UI components).
3. **Continuous verification, not just generation.** After each meaningful batch of changes, I had
   it run `tsc --noEmit`, `next build`, and `eslint` — not just once at the end — so type errors
   and lint issues were caught immediately against the code that produced them, not after the
   whole app was built.
4. **Live integration testing.** Once I provided real credentials (Neon connection string, Gemini
   API key), it ran an actual `prisma migrate dev` against the live database, started the backend,
   and drove a full smoke test via `curl`: register → login → create a meeting with a realistic
   multi-speaker transcript → poll AI generation to completion → inspect the extracted summary,
   decisions, risks, unanswered questions, and action items by hand against the source transcript
   → update an action item's status → confirm dashboard aggregates updated → exercise error paths
   (missing auth token, duplicate email, wrong password, empty/short-title validation).

## Important Prompts

- The governing prompt for the whole session was the user's own: use Next.js+Tailwind /
  Node+Express / Prisma+Neon, work phase-wise (max 4 phases), highest-priority work first, no
  direct repo pushes without review.
- The most consequential prompt *I designed*, since it directly drives the product's core AI
  feature, is the system prompt sent to the extraction model (`backend/src/services/ai/
  gemini.provider.ts` / `anthropic.provider.ts`):
  > "Only report what is actually supported by the transcript. Do not invent decisions, owners, or
  > dates. If an action item's owner/due date isn't stated, use exactly 'Unassigned'/'Not
  > specified'... If no clear decision was made, return an empty array — never invent one."

  This was paired with **forced structured output** rather than "please return JSON" in prose:
  Gemini's `responseSchema` / Anthropic's tool-use, so the model can't return malformed or
  markdown-fenced JSON in the first place. The live test validated this worked as intended — see
  below.

## Where AI-Generated Code or Advice Was Incorrect

- **Wrong default Gemini model.** The first implementation defaulted to `gemini-2.5-flash`. This
  looked correct but failed at runtime with `404: This model ... is no longer available to new
  users`, something no amount of static review would have caught — it's a live API/account state
  fact, not a code bug. I had it query the live `ListModels` endpoint, found a stable alias
  (`gemini-flash-latest`) that Google keeps pointed at their current recommended model, and
  switched the default to that specific alias instead of a hardcoded dated model name, so this
  class of drift doesn't recur.
- **New, overly strict lint rules treated as bugs.** Next.js 16's default ESLint config ships new
  React Compiler readiness rules. Several were legitimately useful and caught real problems
  (below); but `react-hooks/set-state-in-effect` flagged well-established, correct patterns as
  errors — the standard "fetch on mount" custom hook (used by every `useX` data hook), the
  `mounted` hydration guard documented by `next-themes` itself, and a form-reset-on-modal-open
  effect. I didn't just silence the linter — I read what each flagged pattern actually does,
  confirmed none of them rely on concurrent-render safety the rule is protecting, and disabled
  that one rule project-wide with the reasoning documented directly in `eslint.config.mjs`.
- **A real self-reference bug the linter caught correctly.** `useMeeting.ts`'s polling logic
  originally had its `setTimeout` callback reference the `load` function from inside `load`'s own
  `useCallback` initializer — works via closures in practice, but `react-hooks/immutability`
  correctly flagged it as fragile. Fixed with a ref-holding pattern (`loadRef.current = load`)
  instead of leaving it as a "works by accident" closure.
- **A ref used inside a render-adjacent callback.** `MeetingForm.tsx` used a `useRef` to track
  whether the transcript came from paste vs. file upload, flagged by `react-hooks/refs`. Replaced
  with ordinary `useState`, which is simpler and more correct here — the value should trigger
  re-renders as UI state anyway (it drives the "Loaded from filename.txt" hint text).

## What I Changed Manually (Caught by Review, Not by Running the Code)

- **`regenerateInsights` initially blocked the HTTP response** on the full AI call (`await
  runAIGeneration(id)`), inconsistent with `createMeeting`'s fire-and-forget pattern that the
  frontend's polling logic assumes. Caught during my own review of the generated service code
  before it was ever exercised, and fixed to fire-and-forget like `createMeeting`.
- **AI-extracted action items would have duplicated on every regeneration** — the original
  `runAIGeneration` only ever *added* new action items, so clicking "Regenerate" twice would
  double up AI-sourced items. Fixed by deleting existing `source: "ai"` items (never touching
  manually-added ones) inside the same transaction that inserts the new set.

## How I Validated the Generated Output

- **Static**: `tsc --noEmit` and `next build` after every batch of backend/frontend changes;
  `eslint` run to completion with zero errors before considering the frontend done.
- **Dynamic, against real infrastructure** (not mocked): actual Neon Postgres migration, actual
  Gemini API calls, actual JWT-authenticated request flows via `curl` — not just "the code looks
  right." This surfaced the model-availability issue above, which static review could not have.
- **Content-level validation of the AI output itself**: I hand-checked the extracted insights
  against the transcript I wrote — confirmed it correctly identified exactly one clear decision
  ("Next.js for the frontend rewrite") without inventing others, correctly left due dates as
  `null`/"Not specified" for relative references like "by Friday" rather than guessing a calendar
  date, and correctly inferred a `HIGH` priority action item from "I'll urgently check with
  marketing." This is the specific behavior the spec asks for ("should not invent highly specific
  information not supported by the transcript") and it was verified against real output, not
  assumed from the prompt design.
- **Transient-failure handling was observed live, not simulated**: the Gemini API returned real
  `503` (overloaded) responses during testing. Rather than treat this as "AI integration is
  broken," I confirmed it was transient (direct `curl` retries succeeded seconds later) and added
  bounded retry-with-backoff (`services/ai/withRetry.ts`, 2 retries, exponential backoff, only for
  429/503) shared by both real providers — a concrete reliability improvement driven by an actual
  failure observed while building, not a hypothetical.

## Engineering Decisions Made Independently

- Kept the frontend and backend as **two separate apps** (per the user's stated preference)
  rather than defaulting to a Next.js-only monolith, after confirming the split still satisfies
  every technical requirement in the spec.
- Proposed dropping S3 in favor of storing transcript **text** directly in Postgres (the spec only
  requires the text be stored, not the original file) to stay within the time budget — raised as
  an explicit trade-off question to the user rather than assumed.
- Chose **Bearer-token JWT** (localStorage) over httpOnly cookies for simplicity across two
  localhost ports within the time box; documented as a known limitation rather than presented as
  a silent default.
- Built the `AIProvider` interface **before** wiring up a real key, specifically so the spec's
  requirement ("architecture should demonstrate where a real AI provider would be integrated")
  was structurally true from the start, not retrofitted.
- Scoped the rich text editor (Tiptap) to a manual **Notes** field rather than the transcript
  input itself, since the transcript must stay plain text to survive file-upload round-tripping
  and to avoid HTML-stripping before it reaches the AI prompt.
- Used **forced structured output** (Gemini `responseSchema` / Anthropic tool-use) instead of
  prompting for prose JSON, specifically to eliminate markdown-fence-stripping and parsing
  fragility as a failure mode.

## Security, Quality, and Architecture Concerns Identified

- **User enumeration**: login returns the identical "Invalid email or password" message whether
  the account doesn't exist or the password is wrong — never a distinguishing error.
- **Cross-user data leakage**: every meeting/action-item query is scoped through `ownerId` (or
  `meeting.ownerId`) at the Prisma query level, not filtered after the fact — checked across every
  service function, not just the primary read path, so there's no route where one user can read,
  edit, or delete another user's data by guessing an ID.
- **No secrets in source**: both `.env` files are gitignored; only `.env.example` templates with
  placeholder values are tracked. The pasted Neon connection string and Gemini key exist only in
  the local, gitignored `backend/.env`.
- **Errors never leak internals**: the central Express error handler returns a generic message
  for any non-operational error and logs the real detail (including stack trace) server-side only
  — verified live by triggering a validation error and confirming the client response contained
  no stack trace or internal detail.
- **AI output is validated, not trusted**: every provider response — real or mock — passes through
  the same Zod schema before it's persisted; a response that doesn't match the shape fails the
  meeting into `aiStatus=FAILED` with a stored reason, rather than being saved malformed or
  silently dropped.

# WorkforceAI — AI Workplace Productivity Assistant

A second integrated module added **alongside** the existing ProjectFlow Gantt app. New routes live under `/workforce/*`, share the existing auth, theme, and Lovable Cloud backend, and the dashboard gains a card linking to it.

## Architecture decisions (from your answers)
- **Added alongside** ProjectFlow — nothing existing is removed.
- **Both AI paths** in one "Select AI Engine" dropdown:
  - *Mock Demonstration Mode* — 1.5s simulated load, local string-matching mock data tailored to inputs + Global Context.
  - *Lovable AI* (recommended, no key) — routed through a server function/server route to Lovable AI Gateway.
  - *Live Google Gemini (BYOK)* — direct client `fetch` to the Gemini endpoint with the localStorage key.
  - *Live OpenAI (BYOK)* — direct client `fetch` to `gpt-4o-mini` with Bearer token.
- **Lovable Cloud accounts** — Global Context, engine selection, and module run history sync per-user via the database. API keys (BYOK) stay in `localStorage` only (never sent to our backend), satisfying the privacy claim.

## Layout & navigation
- New left **sidebar shell** for the WorkforceAI section (Slate/Zinc palette, glassmorphism panels, smooth transitions, Lucide icons), separate from ProjectFlow's top-bar shell.
- Sidebar contents:
  - Logo "WorkforceAI"
  - **Global Context** panel (persistent textarea "Current Role & Focus" with the specified default text; saved to global state + synced to DB, debounced)
  - Links: Email Generator, Meeting Summarizer, Task Planner
  - Responsible AI, Settings (bottom)
- Engine selection + Global Context held in a React context provider so every module reads them.

## Modules
1. **Smart Email Generator** — Topic textarea, Audience dropdown (Client/Manager/Team), Tone buttons (Formal/Persuasive/Assertive). Output card: Subject + Body.
2. **Meeting Notes Summarizer** — transcript textarea. Output in tabs: Executive Summary, Decisions Made, Action Items (table: Task / Assigned To / Deadline).
3. **Energy-Aware Task Planner** — daily-tasks textarea. Output: chronological timeline, Eisenhower matrix indicators, Cognitive Load badges (High/Med/Low), and auto-inserted "Screen-Free Breaks" between consecutive High-load tasks.

Each module: spinner loading state, **Copy to Clipboard** + **Download .txt** buttons, success toast (sonner), and the Responsible AI guardrail disclaimer under every output.

## Responsible AI page
Standalone route: full guardrail disclaimer + data-privacy transparency (client-side BYOK key handling, no telemetry, what is/isn't stored).

## Settings page
Engine dropdown + password-masked API key input saved to `localStorage`. Explains each engine. Persists engine choice per user.

## How requests are built
A shared `runAI(moduleType, inputs)` helper:
- Prepends a system prompt: *"Tailor all responses to the following user context: [Global Context]"* plus a module-specific instruction requesting structured JSON.
- Branches by engine: mock / Lovable AI server fn / Gemini fetch / OpenAI fetch.
- Each module parses the structured result into its display shape, with graceful fallback if the model returns prose.

## Technical notes
- Routes: `src/routes/_authenticated/workforce.tsx` (sidebar layout + Outlet) with children `workforce.email.tsx`, `workforce.meetings.tsx`, `workforce.planner.tsx`, `workforce.responsible-ai.tsx`, `workforce.settings.tsx`.
- Lovable AI path: a `createServerFn` in `src/lib/workforce-ai.functions.ts` using the Lovable AI Gateway helper with `google/gemini-3-flash-preview` and structured output; BYOK paths run client-side only.
- DB migration: `workforce_settings` table (user_id PK, global_context text, engine text) with GRANTs + RLS scoped to `auth.uid()`. BYOK keys are NOT stored server-side.
- Reuse existing shadcn components (Button, Card, Tabs, Table, Textarea, Select, Badge), sonner toasts, and theme tokens; add Slate/Zinc accents within the existing token system (no hardcoded colors).
- Dashboard gets a "WorkforceAI Assistant" entry card linking into the section.

After building, I'll verify the build, then smoke-test Mock mode end-to-end across all three modules.
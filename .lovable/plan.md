## ProjectFlow — Gantt-based project management app

A clean, minimal project-management tool centered on Gantt charts (not a simple to-do list). Accounts and data sync via Lovable Cloud, with light/dark mode and an Ocean Deep palette (deep navy → teal → aqua).

### Core concepts
- **Charts (Projects):** A user can own multiple Gantt charts. Add a new chart, rename it, delete it.
- **Tasks:** Each task belongs to a chart and has a name, start date, end date, category, notes, completion status, and assigned collaborators. Full CRUD.
- **Collaborators:** People who can be assigned to tasks. Each has a name, experience level, and hourly cost. Progress is auto-calculated from their completed assigned tasks.
- **Visualizations:** Gantt timeline (primary), a pie chart of planned-duration share per activity, and a collaborators table with progress/experience/cost.

### Pages & layout
```
/auth                     Sign in / sign up (email+password + Google)
/_authenticated
  /                       Dashboard: list of charts, create/delete chart
  /chart/$chartId         Single chart workspace:
                            - Gantt timeline (tasks as bars across dates)
                            - Task CRUD (dialog/sheet to add/edit/delete)
                            - Pie chart: planned duration per activity
                            - Collaborators table: progress, experience, cost/hr
                            - Notes + assignee management per task
```
A top header carries the app name, dark-mode toggle, and sign-out. A sidebar lists the user's charts for quick switching.

### Features in detail
1. **Charts management** — grid of chart cards on the dashboard; "New chart" button; delete with confirmation. Each card shows task count and date range.
2. **Gantt chart** — horizontal timeline where each task renders as a bar positioned by start/end date. Color-coded by category. Completed tasks visually distinguished. Built with a custom CSS-grid timeline (lightweight, no heavy canvas library) so it stays clean and themeable.
3. **Task CRUD** — create/edit via a form (name, category, start date, end date, notes, assignees, complete checkbox). Delete with confirm. Mark complete inline.
4. **Categories** — each task has a category (e.g. Design, Dev, Research); used for color-coding and as the pie chart's grouping basis is per-task activity.
5. **Pie chart** — Recharts pie showing each task/activity's share of total planned duration (end − start) within the chart.
6. **Collaborators table** — lists collaborators on the chart with: assigned task count, **auto-calculated progress** (% of their assigned tasks marked complete), experience level, hourly cost, and a computed total cost (hours × rate based on assigned task durations). Add/edit/delete collaborators.
7. **Dark mode** — toggle persisted; Ocean Deep theme tuned for both modes.

### Design direction
- **Palette (Ocean Deep):** deep navy `#0c2340`, ocean blue `#1a4a6e`, teal `#2d8a9e`, aqua `#5cbdb9`. Mapped to semantic tokens in `src/styles.css` (oklch) for light + dark.
- **Style:** minimal, generous whitespace, soft cards, restrained motion. Calm and professional.
- **Charts:** Recharts for the pie chart; custom timeline component for the Gantt.

### Technical plan
- **Backend:** Enable Lovable Cloud. Email/password + Google auth. Managed `_authenticated` route gate.
- **Database tables (all with RLS scoped to `auth.uid()` + GRANTs):**
  - `charts` (id, owner_id, name, created_at)
  - `collaborators` (id, chart_id, name, experience, hourly_cost)
  - `tasks` (id, chart_id, name, category, start_date, end_date, notes, is_complete)
  - `task_assignees` (task_id, collaborator_id) — join table for many-to-many assignment
  - Ownership enforced through `chart_id → charts.owner_id`.
- **Data access:** `createServerFn` for reads/writes acting as the signed-in user; TanStack Query for caching; mutations invalidate the relevant chart queries.
- **Progress & cost:** computed in the client/query layer from tasks + assignments (no stored derived columns).

### Notes
- Progress is auto-derived from completed assigned tasks; pie chart is based on planned duration (start→end), per your choices.
- I'll seed a small demo chart on first sign-in so the timeline/pie/table aren't empty.
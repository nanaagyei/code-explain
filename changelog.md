# Frontend Redesign Changelog

Checkpoint log for the frontend redesign (YC-style, responsive, no gradients). Every change is documented here.

**Note:** Run `npm install` in `frontend/` to install added dependencies (`class-variance-authority`, `clsx`, `tailwind-merge`). Then run `npm run build` to verify.

---

## 2026-01-25

### Foundation: CHANGELOG, theme, and CSS

#### Added
- **CHANGELOG.md** (project root): New changelog for frontend redesign. Used as checkpoint to prevent hallucination and resume work.

#### Changed
- **frontend/tailwind.config.js**:
  - Replaced `accent` purple palette with slate-based accent (YC-style neutral). `accent` now uses slate 50–950 to avoid any purple.
  - Removed `gradient-x` from `animation` extend. Kept `float`, `float-slow`, `float-slower`, `glow`, `pulse-slow`, `slide-up`.
- **frontend/src/index.css**:
  - Removed `.animate-gradient-x` utility and `@keyframes gradient-x` (no gradients).
  - Replaced scrollbar `linear-gradient` thumb with solid `#94a3b8`; hover solid `#64748b`.
- Note: `animate-gradient-x` / gradient progress bars in Dashboard and RepositoryDetail remain until gradient-removal pass; they will be replaced with solid progress bars.

#### Shadcn-style UI and BackButton
- **frontend/package.json**: Added `class-variance-authority`, `clsx`, `tailwind-merge`.
- **frontend/tsconfig.json**, **frontend/tsconfig.app.json**: Added `baseUrl` and `paths` for `@/*` → `./src/*`.
- **frontend/vite.config.ts**: Added `resolve.alias` for `@` → `./src`.
- **frontend/src/lib/utils.ts**: New `cn()` helper (clsx + tailwind-merge).
- **frontend/src/components/ui/button.tsx**: New Button with cva variants (default, destructive, outline, secondary, ghost, link) and sizes (default, sm, lg, icon). Solid slate/blue palette, no gradients.
- **frontend/src/components/ui/card.tsx**: New Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter.
- **frontend/src/components/ui/input.tsx**: New Input component.
- **frontend/src/components/ui/label.tsx**: New Label component.
- **frontend/src/components/ui/badge.tsx**: New Badge with variants (default, secondary, destructive, outline, success, warning).
- **frontend/src/components/ui/separator.tsx**: New Separator (horizontal/vertical).
- **frontend/src/components/ui/skeleton.tsx**: New Skeleton for loading states.
- **frontend/src/components/BackButton.tsx**: New reusable BackButton (Link + ArrowLeft + label) for consistent back navigation.
- **frontend/components.json**: Shadcn-style config (Tailwind v3, no CSS variables).

#### Routing and ProtectedRoute
- **frontend/src/App.tsx**:
  - Added `path="/dashboard"` route rendering same Dashboard component as `/`. Document titles and meta descriptions handle `/dashboard`.
  - Replaced ProtectedRoute loading `bg-gradient-to-br from-blue-50 to-indigo-100` with solid `bg-slate-50`; spinner uses `border-slate-300` / `border-t-blue-600`.

#### Billing migration to Settings
- **frontend/src/pages/Dashboard.tsx**:
  - Removed billing section: credits card, prepaid credit packs, recent billing activity. Removed `billingSummary`, `creditPacks`, `billingTransactions` queries; `checkoutMutation`; `refreshBilling`, `formatCurrency`, `creditValueFormatter`, `handleCheckout`. Replaced `billingMessage` with `creditError` shown only in upload modal on 402; added "Manage credits" link to Settings and Dismiss.
- **frontend/src/pages/Settings.tsx**:
  - Added **Billing & Credits** section: balance card, prepaid packs (Stripe), recent activity; "Manage API keys" anchor, "Refresh balance". Added billing queries, `checkoutMutation`, `refreshBilling`, `formatCurrency`, `creditValueFormatter`. Replaced "Back" link with `BackButton` (Back to Dashboard). Usage Statistics: gradients → solid `bg-slate-50`; removed purple (Providers → slate). `getProviderColor`: anthropic → `bg-slate-100` (no purple). Added `id="api-keys"` for anchor.

#### Gradient and purple removal
- **Dashboard**: All gradients replaced with solid (`bg-blue-600`, `bg-slate-50`, etc.). Progress bar, "Upload" CTA, repo card hover, stats (Files Documented → slate), modal title, file list icon. Indigo/purple → blue or slate.
- **RepositoryDetail**: Loading/error/main → `bg-slate-50`. Stats cards → solid `bg-blue-600` / `bg-green-600`. Progress bar → `bg-blue-600`. Indigo → blue.
- **FileDocumentation**: Loading/not-found/main → `bg-slate-50`. Overview cards, complexity badge, code blocks → `bg-slate-50` / `bg-slate-100`, blue for interactive. All gradients and indigo removed.
- **Compare**: Header icon and result panel → solid `bg-blue-600`, `bg-slate-50`.
- **Auth**: Right-panel orbs removed; solid `bg-slate-100`, slate/blue feature list. No gradients or purple.
- **BentoChat**: Empty-state gradient → `bg-slate-100`.
- **QualityMetrics**: Gradient → `bg-slate-50`.
- **CodeReview**: Indigo → blue.
- **ArchitectureDiagram**: Node and buttons indigo → blue.

#### Back buttons
- **Compare**: Replaced arrow Link with `BackButton` (Back to Dashboard).
- **RepositoryDetail**: Replaced "Back to Dashboard" Link and not-found link with `BackButton`.
- **FileDocumentation**: Added `BackButton` (Back to repository) in header and not-found view; breadcrumb kept.
- **Auth**: "Back to Sign In" button (ArrowLeft + label) when on Register; calls `switchMode('login')`.

#### Icons and emojis
- **App.test.tsx**: Removed emoji from "React is Working!" headline.
- **Dashboard**: Replaced inline SVGs with Heroicons: `ArrowsRightLeftIcon` (Compare), `MagnifyingGlassIcon` (search), `PlusIcon` (New Repository), `TrashIcon` (delete repo), `XMarkIcon` (close modal, remove file), `CloudArrowUpIcon` (Upload first), `InformationCircleIcon` (How it works), `ExclamationTriangleIcon` (errors, delete confirm), `ArrowPathIcon` (loading spinners). New Repository button: `min-h-[44px]` for touch targets.
- **Settings**: Replaced modal close "×" with Lucide `X` icon; `min-h-[44px] min-w-[44px]` on close buttons.

#### Responsiveness
- Touch targets: `min-h-[44px]` (and `min-w-[44px]` where appropriate) on primary buttons, close buttons, BackButton, Auth "Back to Sign In". Button sizes in `ui/button` use `min-h` for default/sm/lg/icon.
- Modals: Upload modal and Settings API-key modals use `max-h-[calc(100vh-2rem)]` / `overflow-y-auto`; scrollable content regions.
- Layout: Existing responsive grids (`grid-cols-1 sm:2 lg:3`, etc.), `flex-wrap`, and `hidden sm:inline` / `sm:block` patterns retained. Dashboard, Settings, Compare, RepositoryDetail, FileDocumentation already use `sm:`/`lg:` breakpoints.

#### Repository detail polling (backend load)
- **RepositoryDetail** repository query uses `refetchInterval` to poll every 3s **only while status is `processing`** (to refresh progress). It stops when status is `completed` or `failed`, or when you leave the page.
- **Change:** Set `refetchIntervalInBackground: false` so polling runs only when the **tab is focused**. If you switch tabs or minimize the window, the backend is no longer hit every 3s. Also added optional chaining on `repository?.status`.
- **Why you see repeated `SELECT ... FROM repositories WHERE id = $1`:** Those requests are from this poll. If you stay on a processing repo’s detail page with the tab focused, they will continue until processing finishes. This is intentional; the new option limits it to when the tab is active.

#### Stuck-in-processing fix (mark as failed)
- **Backend:** `POST /repositories/:id/mark-failed` – Marks a repository as `failed` when stuck in `processing` (e.g. server restart killed the background task). Allowed only when `status === 'processing'`; returns 404 if not found, 400 if not processing.
- **Frontend API:** `apiClient.markRepositoryFailed(id)`.
- **Repository Detail:** When `status === 'processing'`, the progress card shows a "Stuck? Mark as failed" button. Clicking it calls the new API, invalidates repository + list queries, and updates the UI. Inline error shown on failure.

#### Bold visual overhaul (distinctive frontend style)
- **Typography:** **Outfit** (display) + **DM Sans** (body) via Google Fonts. `font-display` and `font-body` in Tailwind; body uses DM Sans, page bg `#fafaf9` (warm off‑white).
- **Layout:** New **AppLayout** with **sidebar** (logo, Compare, Docs, Settings, user menu). Protected routes use nested layout: `ProtectedRoute` → `AppLayout` → `Outlet`. Dashboard, Compare, Settings, RepositoryDetail, FileDocumentation render inside.
- **Dashboard:** Header/nav removed (moved to sidebar). New “Repositories” hero + subtitle. Stats use **Card**, **font-display** for numbers, `animate-stagger-in` with delay. Action bar uses **Input**, **Button**, **Card**. Repo grid uses **Card**, staggered animation; progress bar solid `bg-primary-500` (no gradient). Empty state uses **Card** + **Button**.
- **Auth:** `bg-page`, **font-display** for “CodeXplain” and feature heading. Forms use slate/charcoal, **primary** for buttons and links. Right panel uses charcoal/slate, simplified feature list.
- **Compare:** BackButton + title in simple top section. Selection panel and result cards use `border-slate-200`, **font-display** headings, slate/charcoal text. Primary for CTAs.
- **RepositoryDetail:** BackButton + repo name in top section; **font-display** for title. Progress card and status use design tokens; `</main>` replaced with `</div>` for new layout.
- **Settings:** Duplicate header and user menu removed (sidebar provides nav + user). Simple top block: BackButton + **font-display** "Settings" heading + subtitle. Sections unchanged.
- **Design tokens:** `charcoal`, `primary`, `success`, `danger`, `page`; `stagger-in` keyframes and `animate-stagger-in` utility.

#### Delete repository 500 fix (processing + FK cleanup)
- **Cause:** Deleting a repo (especially while processing) hit FK constraints: `SavedExploration`, `CreditTransaction`, and `BatchJobItem` reference `repositories`/`code_files`. Cascade delete failed → 500. Frontend showed generic "Unable to connect…" for 500s.
- **Backend:** `DELETE /repositories/:id` now, before deleting the repo: (1) deletes `SavedExploration` for that repo; (2) nulls `CreditTransaction.repository_id` and `code_file_id` for transactions referencing the repo or its files; (3) nulls `BatchJobItem.repository_id`. Then deletes the repo (cascade deletes `code_files`). On failure, rolls back and returns 500 with a clear `detail` suggesting "mark as failed first" if still processing.
- **Frontend:** 500/502/503/504 use `detail` from the response when present (via `getErrorMessage`). Delete modal shows an extra note when the repo is processing: "This will stop any ongoing processing and remove the repository."

---

## 2026-03-04

### Near-term delivery implementation (partial + pending closure)

#### Backend
- Added rate limiting infrastructure (`slowapi`) with config-driven policies and standardized 429 responses.
- Added integration models and APIs for:
  - GitHub PR webhook intake and persisted PR analysis records.
  - Outbound webhook endpoint CRUD, delivery queue, signature generation, retries, dead-letter.
  - Quality metric snapshots, quality profile weights, aggregate/history endpoints.
  - Analytics endpoints (`/analytics/overview`, `/analytics/quality-trends`, `/analytics/repository-benchmarks`).
  - Collaboration sessions, persisted notes, and websocket presence stream.
- Added repository event dispatch (`repository.completed`, `repository.failed`) and analysis completion webhook triggers.
- Added repository overview endpoint for extension workspace summaries.
- Second-pass hardening:
  - Fixed frontend PostCSS/Tailwind config loading by migrating to `.cjs` config files.
  - Upgraded GitHub PR processing to fetch real changed-file diffs from GitHub API.
  - Upgraded PR comment endpoint to publish actual comments when `dry_run=false` (with credential checks).
  - Added background webhook delivery worker on app lifespan (periodic queue processing).
  - Tightened collaboration websocket authorization to session owner.
  - Added broader backend integration-style tests for webhook retry logic and GitHub PR fetch parsing.
- Added Alembic migration `9a7f6c5b4d3e_add_integrations_collab_quality_tables.py`.

#### Frontend
- Added Settings sections for quality profile weights, webhook management, custom template manager, and analytics.
- Added `CollaborationPanel` and integrated it into repository detail.
- Extended frontend API client and shared types for all new backend capabilities.
- Added Vitest setup and initial component tests for analytics and collaboration.

#### VS Code Extension
- Added API client support for repository overview endpoint.
- Added command `CodeXplain: Analyze Repository` with workspace file collection and markdown summary output.
- Added/updated extension tests for repository overview client flow.

#### CI/Docs
- Added `.github/workflows/ci.yml` for backend/frontend/CLI/extension checks.
- Updated docs status notes for tools, rate limiting, GitHub integration, and quality metrics.

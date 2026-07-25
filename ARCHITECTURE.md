# Architecture

## 1. Repository audit (as of this transformation)

### What currently exists

The repository was a solo portfolio project: **"Ground Control"** as a daily-briefing tool for a solopreneur tracking *their own* customers, invoices, and tasks. It was never a multi-tenant B2B product.

- **Framework**: Next.js 16 (App Router, Turbopack, canary-ish — see `AGENTS.md`, the API surface differs from older Next.js docs and training data; the docs bundled in `node_modules/next/dist/docs/` are the source of truth, not memory).
- **Language**: TypeScript, strict-ish (no `any` sprinkled through app code; some `unknown`/`Json` casts at the Prisma boundary).
- **UI**: React 19, Tailwind CSS v4 (CSS-variable-driven theme, see `src/app/globals.css`), shadcn/ui components on a **base-ui** (not Radix) primitive layer (`src/components/ui/*`), Framer Motion for motion, Recharts for the two charts that existed, Sonner for toasts, `next-themes` for light/dark.
- **Database**: Prisma ORM, SQLite locally (`prisma/dev.db`, gitignored), documented as "swap two lines to Postgres for prod." Schema was **single-tenant**: one `User` ⇄ one `Workspace` ⇄ owned `Customer`/`Invoice`/`OpenLoop`/`Opportunity`/`Risk` rows. No `Organization`, no `Membership`, no roles, no RLS — there was exactly one workspace per user and no concept of a second user sharing data.
- **Auth**: Auth.js v5 (NextAuth), Credentials provider, bcrypt-hashed passwords, JWT session strategy, no email verification, no MFA, no password reset flow.
- **Deployment target**: Vercel (icons, OG image, and `next.config.ts` already assume it). No CI, no staging environment, no migrations run anywhere but local dev.
- **Env vars in use**: `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`. All read directly via `process.env`, no startup validation.
- **Routes that existed**: `/`, `/morning-brief`, `/customer-radar`, `/money-watch`, `/open-loops`, `/command-center`, `/case-study`, `/pricing`, `/showcase`, `/signup`, `/login`, `/api/auth/[...nextauth]`.
- **"AI"**: `src/lib/ai-response.ts` — a deterministic keyword-matched string generator over the mock/DB dataset. No LLM API call existed anywhere in the codebase. This was explicit and disclosed (README called it "simulated").
- **Reusable dashboard components**: `SurfaceCard`, `MetricCard`, `PageHeader`, `EmptyState`, `Badges` (status/priority pill patterns), `ActionCard` (evidence + action + Done/Snooze/Draft pattern), `CustomerCard`/`CustomerDrawer`, `MoneyCard`, `LinkButton`, chart wrappers. These map well conceptually onto Risk/Action/Account-brief UI in the new product and are being kept.
- **Docs**: only a `README.md` (setup + deploy) and a boilerplate `AGENTS.md`/`CLAUDE.md` (a generic "this Next.js version has breaking changes, read the docs" note — worth keeping, has nothing to do with product).

### What currently works

Full CRUD-lite flow for the old product: sign up → seeded workspace → dashboard pages reading/writing Prisma → sign out. Build and lint were clean at last check. Light/dark theme, responsive layout down to 375px, and the design-token system all work and are reusable.

### What is incomplete

No multi-tenancy, no roles, no import pipeline, no integrations, no real AI calls, no billing, no audit log, no notifications, no public marketing site beyond a single portfolio-style page, no tests of any kind, no CI, no observability (no Sentry, no structured logging), no rate limiting, no file uploads, no email delivery (Resend/Postmark never wired).

### What is unsafe / not commercially defensible

- No tenant isolation model exists to test — there is currently one workspace per user by construction, so the entire class of "Org A sees Org B's data" bugs hasn't been designed against yet.
- No RLS at the database layer; all isolation was app-code only (fine for a single-tenant portfolio piece, not fine for a commercial multi-tenant product).
- No rate limiting on auth routes (brute-force risk).
- No email verification (anyone can sign up with an email they don't own).
- No audit log — no record of who did what.
- No secret validation at boot — a missing `AUTH_SECRET` in prod would fail unpredictably rather than loudly.

### What should be reused as-is

Next.js/TS/React/Tailwind v4/shadcn-base-ui/Framer Motion/Recharts/Prisma/Auth.js/bcrypt toolchain, the design-token system in `globals.css`, the `SurfaceCard`/`MetricCard`/`Badges`/`ActionCard`/`EmptyState`/`PageHeader` component family (restyled/relabeled, not rebuilt), the Vercel deployment posture, the "demo mode vs. real data" dual-rendering pattern (directly reusable for **demo organization vs. real organization** in the new model).

### What must change

The data model (single-tenant → multi-tenant with Organization/Membership/Role), the entire product surface (the old pages solved a different person's problem — a solopreneur's own business — not a CS team's view into *their* customers), the AI layer (needs a real service boundary with logging/versioning even before a live model key exists), and the public site (one portfolio page → a real company site).

### Can the repo support a commercial product without a full rewrite?

**Yes, at the infrastructure layer. No, at the product-page layer.** The framework, styling system, component primitives, auth library, and ORM are all appropriate choices and are kept. The *page and data-model layer* — which encoded a different product for a different user — is being replaced, not refactored, because "Money Watch for my own revenue" and "Renewal Center for my clients' renewals" are not the same feature wearing different clothes. This is recorded as a formal decision in `DECISIONS.md` (major architectural migration, pre-authorized by the founder in the transformation brief).

## 2. Target architecture

```
apps/web (single Next.js app)
├─ (marketing)          — public Signal & State site, no auth required
├─ (app)                — authenticated Ground Control product, org-scoped
├─ (internal)           — Signal & State consultant workspace, role-gated
├─ api/                 — route handlers (webhooks, auth, health)
└─ lib/
   ├─ db/                — Prisma client, RLS session helpers
   ├─ services/           — one module per service boundary (below)
   ├─ ai/                 — AI service layer (provider-agnostic)
   ├─ auth/               — session, role, org-scoping helpers
   └─ validation/          — zod schemas shared client/server boundary
```

### Service boundaries

Only services that earn their existence (per the founder's own rule: don't create a service for architectural appearance). Each is a folder of server-only functions, not a network microservice — this is a modular monolith on Vercel, not distributed infrastructure, because that would be over-engineering for the current scale.

| Service | Responsibility |
|---|---|
| Auth service | Session, sign-up, sign-in, email verification, password reset |
| Organization service | Org creation, membership, roles, settings |
| Customer data service | CustomerAccount, contacts, contracts, subscriptions |
| Import service | CSV upload → validate → map → preview → commit |
| Health scoring service | Deterministic weighted score calculation, versioning |
| Risk detection service | Rule-based risk signal generation from source data |
| Renewal service | Renewal record lifecycle, forecast category, forecast confidence |
| Opportunity service | Expansion/advocacy/reference signal generation |
| Voice of Customer service | Feedback ingestion, theme grouping, review workflow |
| AI analysis service | Single boundary for every LLM call — see `SECURITY.md` §AI |
| Executive Brief service | Weekly brief assembly, approval, delivery |
| Notification service | In-app + email + Slack dispatch, preference-aware |
| Email service | Transactional send via Resend/Postmark abstraction |
| Integration service | Connection lifecycle, sync jobs, credential storage |
| Audit service | Append-only event log, used by every other service |
| Billing service | Stripe customer/subscription mirror, webhook handling |
| Lead service | Public-site form intake, lead record, notification |
| Consultant service | Internal workspace, client engagement state |

Every mutation that changes tenant data goes through a service function, never a raw Prisma call from a page or route handler. This is what makes tenant isolation and audit logging enforceable in one place instead of scattered.

## 3. Data flow and tenancy

Every server request resolves: `session → user → membership → organization`. All service functions take an explicit `organizationId` (or a `Session` they derive it from) — there is no "current org" global. Postgres Row-Level Security (see `SECURITY.md`) is the backstop: even a bug in a service function cannot leak cross-tenant rows, because the database itself refuses the query.

## 4. Why Supabase-as-platform is not adopted (yet)

The founder's preferred stack lists Supabase. The current stack already has Postgres (via Prisma) and Auth.js. Supabase's main advantages over that combination are: hosted Postgres with a generous free tier, built-in RLS tooling, and a bundled auth/storage/edge-function platform. None of these represent a *material limitation* of the current stack today — Postgres RLS is a Postgres feature, not a Supabase feature, and is implemented directly via SQL in Prisma migrations (see `SECURITY.md`). Adopting Supabase-as-platform now would mean migrating auth off Auth.js and taking on a new vendor relationship before the product has a single paying pilot. Per `DECISIONS.md`, this is deferred: use any Postgres host (Vercel Postgres/Neon today), keep Auth.js, revisit Supabase specifically if file storage or realtime becomes a genuine need.

## 5. What is intentionally not built yet

Full integration connectors (HubSpot/Salesforce/Zendesk/etc. live sync), automated Stripe billing, a background job/queue platform, real LLM calls, SOC 2 or any compliance certification, a mobile app, i18n. All are designed for (schema and service boundaries exist) but not implemented, per the founder's explicit "first launch does not require" list. See `IMPLEMENTATION_PLAN.md`.

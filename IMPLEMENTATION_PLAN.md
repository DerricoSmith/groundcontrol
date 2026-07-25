# Implementation Plan

Twelve phases, executed in small testable stages. Status is updated as work lands — check `CHANGELOG.md` for the running log of what actually shipped in each phase versus what's still open.

---

## Phase 1 — Foundation and audit
**Objective**: Understand what exists, decide what to keep, document the plan before touching product code.
**Features**: Repository audit, the 13 governance docs, `CLAUDE.md`.
**Dependencies**: None.
**Database changes**: None.
**UI changes**: None.
**API changes**: None.
**Security considerations**: None yet — this phase is documentation.
**Tests**: N/A.
**Acceptance criteria**: All 13 docs + `CLAUDE.md` exist and accurately describe the real repository state.
**Risks**: Documentation drifts from reality if not updated alongside later phases — mitigated by making doc updates part of every phase's checklist.
**Status**: ✅ Complete (this pass).

---

## Phase 2 — Brand and public website
**Objective**: A credible Signal & State company site exists at the marketing route group.
**Features**: 14 public pages (Home, Ground Control, Customer Intelligence Sprint, Managed Customer Intelligence, CX/CS Transformation, Fractional Customer Executive Advisory, Who We Help, Approach, About Rico, Insights, Contact, Book a Conversation, Privacy, Terms), plus `/trust`. Lightweight Insights content approach (MDX or structured data, not a CMS). Lead forms (5 types).
**Dependencies**: Design tokens (Phase 1 groundwork, reused from prior build), copy (this doc's sibling `PRODUCT.md` for positioning).
**Database changes**: `Lead` table.
**UI changes**: New `(marketing)` route group, entirely new page set — the prior single portfolio page is retired (see `DECISIONS.md`).
**API changes**: `POST /api/leads` (or Server Action) with validation, spam prevention, and email notification.
**Security considerations**: Form validation, rate limiting on submission, no PII in analytics events.
**Tests**: Form validation tests, spam-prevention tests, lead-creation integration test.
**Acceptance criteria**: All 14 pages render, all 5 forms create a `Lead` row and notify, no broken links, no lorem ipsum, no unearned compliance claims.
**Risks**: Content volume is large (14 pages of real, non-generic copy) — sequenced to ship Home + Ground Control + Trust + Contact first, remaining pages iteratively.
**Status**: 🚧 Not started this pass — Phase 1 docs and Phase 3 data foundation took priority since every later phase depends on the data model, and the site can be built in parallel without blocking the product.

---

## Phase 3 — Authentication and organization model
**Objective**: Multi-tenant foundation: Organization, Membership, Role, RLS.
**Features**: Org creation, invitations, role assignment, session → org resolution, RLS policies.
**Dependencies**: None beyond the existing Auth.js setup.
**Database changes**: Replace single-tenant schema with `Organization`, updated `User` (+email verification fields), `Membership`, `Role` enum. RLS migration.
**UI changes**: Org creation flow, team management page (list/invite/role-change).
**API changes**: Org-scoped session helper (`getCurrentMembership()`), invitation Server Actions.
**Security considerations**: This *is* the security-critical phase — RLS policies, tenant-isolation tests, permission matrix enforcement.
**Tests**: Tenant isolation suite (Org A cannot read Org B), role-permission suite, invitation-flow test.
**Acceptance criteria**: Two organizations can exist; a member of one cannot query the other's data through the service layer or a raw query that bypasses it.
**Risks**: Getting RLS wrong is the single highest-impact mistake available in this project — mitigated by writing the isolation tests before declaring the phase done, not after. The isolation tests that exist today only run against SQLite (no RLS concept); Postgres RLS itself remains unverified — see `LOCAL_POSTGRES_SETUP.md`.
**Status**: 🟡 In progress — schema migrated, permission matrix enforced and tested, tenant-isolation suite passing (52 tests total, see `TESTING.md`), invitation flow (create/accept/revoke/resend, email-bound, single-use, time-limited) built and tested with a minimal working UI at `/organization/members` and `/invite/accept`. Still open: Postgres-side RLS verification (SQLite can't run it), org-switching for users with multiple memberships (`getCurrentMembership()` still uses a documented "first membership" simplification), and role-change/member-removal UI.

---

## Phase 4 — Customer data model and CSV imports
**Objective**: Get real customer data into the system without waiting on any integration.
**Features**: `CustomerAccount`, `Contract`, `Renewal`, import pipeline (upload → validate → map → preview → commit) for accounts, contacts, contracts, renewals, usage summaries, support tickets, interactions.
**Dependencies**: Phase 3 org model.
**Database changes**: `CustomerAccount`, `Contract`, `Renewal`, `ImportJob`, `DataSource`, plus the remaining CSV-target tables as each import type ships.
**UI changes**: Data Imports area (upload, column mapping, preview, error report, history).
**API changes**: Import Server Actions, background processing for large files.
**Security considerations**: File-type/size validation, no arbitrary file execution, per-org storage isolation.
**Tests**: Import validation tests, duplicate-detection tests, partial-failure handling tests.
**Acceptance criteria**: A CSV of accounts can be imported end to end with a clear error report for bad rows and no uncontrolled duplicates on re-import.
**Risks**: CSV data is messy in practice — the preview/validation step is intentionally strict before commit, per the founder's explicit CSV workflow spec.
**Status**: 🚧 Not started — next up after Phase 3 isolation tests land.

---

## Phase 5 — Portfolio and account experience
**Objective**: Mission Control, Customer Portfolio, Account Detail.
**Features**: Portfolio table (search/filter/sort/saved views/configurable columns), Account Brief (two-minute read), Mission Control overview.
**Dependencies**: Phase 4 data.
**Database changes**: `SavedView`, `PortfolioSnapshot` (for week-over-week movement).
**UI changes**: Three of the most important screens in the product — see `PRODUCT.md` for required content on each.
**API changes**: Read-heavy service functions with pagination, filtering, and sort pushed to the database, not the client.
**Security considerations**: Column-level data doesn't leak between orgs (covered by Phase 3 RLS, re-verified here with real query shapes).
**Tests**: Portfolio filter/sort tests, Account Brief content-completeness test.
**Acceptance criteria**: A CS Manager can find "which accounts need attention" in under two minutes without training.
**Risks**: Mission Control specifically risks becoming "a wall of charts" — mitigated by the founder's own prioritization rule (what changed → why it matters → which accounts → how much revenue → what action) governing the layout.
**Status**: 🚧 Not started.

---

## Phase 6 — Health scoring and risk detection
**Objective**: Deterministic, explainable health scores and rule-based risk detection.
**Features**: Configurable health model (5 weighted components, must sum to 100%), health category thresholds, Risk Radar with the required explanation format.
**Dependencies**: Phase 4/5 data.
**Database changes**: `HealthScore`, `HealthScoreComponent`, `RiskSignal`.
**UI changes**: Health Model Configuration (weight editor with validation), Risk Radar.
**API changes**: Scoring service (pure, deterministic, versioned), risk-detection service (rule-based, not ML in phase 1).
**Security considerations**: Score overrides are audited with a required reason.
**Tests**: **Weight-sum-must-equal-100% test, deterministic-recalculation test (same inputs → same output), risk-detection rule tests.**
**Acceptance criteria**: A health score always shows its components, its trend, and any material risk even when the numeric score looks acceptable — the founder's explicit "a customer can have a seemingly acceptable score while still having a severe risk" requirement.
**Risks**: The temptation to let AI adjust the deterministic number directly — explicitly disallowed (`SECURITY.md` §AI: "AI should not secretly change deterministic calculations").
**Status**: 🚧 Not started — depends on Phase 4/5 data existing.

---

## Phase 7 — Actions and renewal management
**Objective**: Actions area as the operating center; Renewal Center with forecast categories.
**Features**: `RecommendedAction` lifecycle (draft → assigned → in progress → complete), Renewal Center (calendar/table/pipeline, 7 forecast categories, confidence calculation).
**Dependencies**: Phase 6 risk/health data feeds recommended actions and renewal forecast confidence.
**Database changes**: `RecommendedAction`, `Renewal` forecast fields, `Escalation`.
**UI changes**: Actions list/board, Renewal Center (three views: calendar, table, pipeline).
**API changes**: Action assignment/completion service, renewal forecast-confidence calculation service.
**Security considerations**: Action ownership respects role permissions (Analyst/Viewer cannot assign).
**Tests**: Renewal date/period calculation tests, forecast-confidence calculation tests, action state-machine tests.
**Acceptance criteria**: Every recommended action traces to a risk, opportunity, or renewal; every renewal shows forecast category + the specific factors behind its confidence.
**Risks**: Forecast confidence is explicitly *not* a predictive ML model in phase 1 — it's a documented, deterministic function of data completeness/engagement/commercial progress. Copy must never call it "predictive."
**Status**: 🚧 Not started.

---

## Phase 8 — Voice of Customer and AI analysis
**Objective**: Turn scattered feedback into themes; stand up the AI service layer for real (behind a provider abstraction).
**Features**: Feedback ingestion (from imports first, integrations later), theme grouping, theme review workflow (move/merge/rename/dismiss/confirm), AI service layer with the 12 documented workflows.
**Dependencies**: Phase 4 data (support tickets, interactions) as feedback sources.
**Database changes**: `CustomerFeedbackItem`, `FeedbackTheme`, `AIAnalysisRecord`, `AIEvidenceReference`.
**UI changes**: Voice of Customer area, theme review UI, AI-output review affordances used across Risk/Opportunity/Brief.
**API changes**: AI service layer (`lib/ai/*`) — structured-output generation, validation, storage; provider-agnostic so it runs with **no live model key** using a clearly-labeled deterministic fallback until `ANTHROPIC_API_KEY` is configured (mirrors the "simulated AI" disclosure pattern already proven in the prior build, now with real logging/versioning underneath it).
**Security considerations**: Input minimization, output schema validation, no theme is ever "confirmed" without a human review action logged.
**Tests**: AI output-schema validation tests (including malformed-output handling), theme merge/dismiss tests.
**Acceptance criteria**: A feedback theme always shows its evidence and source records; nothing AI-generated is presented as fact without a review-state label.
**Risks**: This is the phase most likely to be over-built — mitigated by shipping the service-layer contract and 2–3 workflows (theme detection, risk explanation) before all 12.
**Status**: 🚧 Not started.

---

## Phase 9 — Executive Briefs and email delivery
**Objective**: The weekly leadership summary, generated, reviewable, and deliverable by email.
**Features**: Brief generation from structured portfolio data, in-app view, email delivery, printable/PDF view, archive, approval workflow.
**Dependencies**: Phases 5–8 (portfolio movement, risks, actions, VoC themes all feed the brief).
**Database changes**: `ExecutiveBrief` (structured sections, not a blob), delivery log.
**UI changes**: Brief viewer, approval flow, recipient/schedule settings.
**API changes**: Brief-assembly service, email service (Resend/Postmark abstraction — **no live send without a configured sending domain and API key**; until then, delivery is logged, not sent, and the UI says so).
**Security considerations**: Brief delivery is an audited event; approval required during early pilots per the founder's explicit rule.
**Tests**: Brief-assembly content test, delivery-log test, approval-gate test.
**Acceptance criteria**: A brief is readable in ~5 minutes, shows sources/evidence, and cannot be emailed without a review step in early pilots.
**Risks**: Real email delivery requires a vendor account and a verified sending domain — a founder decision (`DECISIONS.md` §Founder decisions needed), not something to activate silently.
**Status**: 🚧 Not started.

---

## Phase 10 — Consultant workspace and Sprint delivery
**Objective**: Signal & State's own internal operating tool, and the structured Customer Intelligence Sprint workflow.
**Features**: Internal consultant workspace (client engagement list, setup status, deliverables, notes), Sprint workspace (25-section structured engagement data → generated, editable report).
**Dependencies**: Phase 3 org/role model (consultant role + grants), Phase 4–9 data for status rollups.
**Database changes**: `ClientEngagement`, `SprintWorkspace`, `ConsultantGrant`.
**UI changes**: `(internal)` route group, gated to `signal_state_consultant` role on the Signal & State organization only.
**API changes**: Consultant-grant service (explicit approval, logging, revocation).
**Security considerations**: This is the other tenant-isolation-critical surface — a consultant's access to a client org must be explicit, scoped, logged, and visible to the client (`SECURITY.md` §Consultant access).
**Tests**: Consultant-access-control tests (no default access, grant/revoke, audit visibility to client).
**Acceptance criteria**: Rico can see every client's status in one internal view; a client can see exactly when a consultant accessed their data.
**Risks**: Building a "not quite a CRM" internal tool that scope-creeps into a real CRM — explicitly bounded to the fields the founder listed, nothing more.
**Status**: 🚧 Not started.

---

## Phase 11 — Demo environment and sales readiness
**Objective**: A demo organization polished enough for a founder sales call and a Loom video.
**Features**: 20-account demo org with the 8 required scenarios, guided demo mode (presenter highlights, reset function), sales demo script.
**Dependencies**: Phases 5–9 (portfolio, risk, actions, renewals, briefs must all be real features for the demo to show them).
**Database changes**: Demo org seed script (idempotent, resettable).
**UI changes**: Demo-mode presenter affordances (optional, must not interfere with normal product UX per the founder's explicit rule).
**API changes**: None beyond seeding.
**Security considerations**: Demo org is a real, RLS-isolated organization — not a special code path — so "demo data leaking into production" is structurally prevented, not just avoided by convention.
**Tests**: Demo-data-isolation test (explicitly on the founder's required test list).
**Acceptance criteria**: Rico can run the full demo narrative without developer assistance.
**Risks**: Coherent synthetic data storytelling takes real authoring time — see `DEMO_DATA.md` for the scenario spec, written in this phase.
**Status**: 🚧 Not started.

---

## Phase 12 — Security, testing, deployment, and launch
**Objective**: Everything required by `LAUNCH_CHECKLIST.md` is true.
**Features**: Full test suite green, error monitoring (Sentry), structured logging, rate limiting, security headers, production deployment, DNS/domain configuration, backups.
**Dependencies**: All prior phases.
**Database changes**: Final production migration run; backup schedule configured.
**UI changes**: None new — polish and accessibility pass across everything built.
**API changes**: None new — hardening pass (rate limits, headers, error handling) across everything built.
**Security considerations**: This phase's entire job is security and reliability hardening.
**Tests**: Full suite from `TESTING.md`, with the founder's 12 highest-priority tests gating launch.
**Acceptance criteria**: `LAUNCH_CHECKLIST.md` acceptance criteria all pass.
**Risks**: Launch pressure to skip a failing critical test — explicitly disallowed by the founder's own rule ("do not continue after a failed critical test without addressing the failure").
**Status**: 🚧 Not started.

---

## Sequencing note

Phases are listed in the founder's specified order, but 2 (website) and 3–7 (product) can run partially in parallel since they don't share code paths — the website has no dependency on the authenticated app. This pass prioritized Phase 1 (this document set) and began Phase 3 (the data-model foundation everything else depends on) because every other phase's database changes build on it.

# Local build progress

Living record of the Signal & State / Ground Control local commercial build. Nothing recorded here has been committed, pushed, or deployed — see `PORTFOLIO_PRESERVATION.md` and `LOCAL_ONLY_DEVELOPMENT.md`. Branch: `signal-state-local-build` (local only, no upstream set).

## Session: 2026-07-25 — Customer Intelligence Core: surfaces, live verification, honesty fixes

Full detail in `CHANGELOG.md` and `CUSTOMER_INTELLIGENCE_CORE.md`.

### Completed

**Screens**: Actions Center (`/actions`, seven saved views), Escalations (`/escalations`), Customer Portfolio saved views and pagination, Account Detail rebuilt around health-component evidence, Mission Control rebuilt around what changed / what needs attention / readiness / ownership / next steps, sixteen-section Executive Brief. Navigation now lists every shipped route.

**Services**: `escalation-service.ts`, `escalation-constants.ts`, `portfolio-summary-service.ts`, `buildBriefSections()` in `executive-brief-service.ts`, `action-center-actions.ts`, `escalation-actions.ts`.

**Local demo data**: `scripts/seed-demo-org.mjs` creates a five-account demo organization including one deliberately incomplete account.

### Three correctness bugs found by using the product, not by reading it

Each one was the same failure: absence presented as good news.

1. Unscored accounts displayed as **Stable** because that is the schema default. Added `CustomerAccount.healthCalculatedAt`; they now read **Not assessed** and are excluded from the health distribution.
2. An organization that had never run data quality detection displayed as **Ready**. Added `Organization.dataQualityEvaluatedAt` and a **Not Evaluated** state.
3. Risk Radar summed exposure per risk, reporting $1,866,000 of exposure in a portfolio holding $788,000 total. Exposure is now counted once per account.

A fourth: the executive sponsor disengagement rule fired for an account with no contacts and no interactions at all. It now returns nothing there, because that is a data gap rather than a finding.

All four are covered by regression tests.

### Gate at end of session

Format, typecheck, lint clean. 259 Vitest tests across 20 files passing. 11 Playwright tests passing. Production build passing (26 routes). No console errors in the browser across every new screen.

### Founder decisions still needed

None new this session.

---

## Session: 2026-07-24 (continued) — Customer Intelligence Core

Checkpoint before this phase: `../ground-control-local-checkpoints/20260724-190113/` — verified: all 12 required files present and non-empty (working tree archive, diff, status, untracked list, all three database backups, build result, Vitest result, Playwright result, env var names, restore instructions). State at checkpoint: build clean, 136 Vitest + 11 Playwright passing.

## Session: 2026-07-24 (continued further) — Onboarding UI: Quick Start end to end

Checkpoint before this phase: `../ground-control-local-checkpoints/20260724-173547/` — build passing, 101 Vitest + 11 Playwright tests passing, confirmed before any changes in this phase.

### Completed

**Data model additions**: `OrganizationSetupProfile` (company profile + health model / risk rule / Executive Brief configuration state, one per org — a deliberate consolidation of what could have been three or four separate tables, see `ONBOARDING_ARCHITECTURE.md`), `ExecutiveBrief` + `ExecutiveBriefSection` (deterministic, rule-based briefs — no AI layer exists yet).

**Four new services**, all real, all tested: `csv-import-service.ts` (dependency-free CSV parser, per-row validation, cross-org-safe duplicate detection, commit with audit trail), `risk-rule-service.ts` (12-rule catalog with honest per-rule data-availability checks — only "missing renewal date" is actually computable without usage/support/interaction imports this build doesn't have, and activating it creates real `RiskSignal` rows idempotently), `organization-setup-service.ts` (profile save, health model activation — validates weights, never fabricates per-account scores), `first-insight-service.ts` + `executive-brief-service.ts` (deterministic insights and brief content assembled only from real `CustomerAccount`/`RiskSignal` data, explicitly labeled as rule-based).

**Full onboarding UI**: `/onboarding` (redirect to current step), `/onboarding/[step]` (one dynamic route, ten step components, not eleven separate pages), `/onboarding/first-value`, plus a dedicated onboarding shell (`src/app/onboarding/layout.tsx`) separate from the regular app chrome. A `data_readiness` step was added to the step registry (extending the existing array, not redesigning the architecture) since the founder's brief requires it and there was no existing step covering it.

**Customer Portfolio** (`/customers`) and **Account Detail** (`/customers/[id]`), both organization-scoped, both with honest empty/limited states — Account Detail explicitly states when an account's assessment is limited by missing data rather than presenting false confidence.

**Executive Brief page** (`/executive-briefs`) — generate/view a deterministic preview brief.

**Mission Control**: now redirects incomplete-onboarding owners/admins/consultants to `/onboarding` instead of showing an empty dashboard; gained a real Setup Checklist that auto-resolves items based on what's actually true (accounts imported, owners assigned, health model activated, risk rules activated, team invited) rather than starting blank and asking the owner to re-confirm what they just did.

**Verified live in-browser, twice, with two different data shapes** (three accounts with no owners, and two accounts with owners matched by email) — the complete Quick Start path: signup → goals/path → organization profile → data path choice → CSV import (via a scripted `DataTransfer` file-selection simulation, since the browser automation tool used has no native file-upload action) → renewal defer/confirm → data readiness → health model activation → risk rule review/activation → Executive Brief config/skip → team invite/skip → review → activate → first-value page (real insight, real limitation callout, real brief preview) → Mission Control with an accurately-populated Setup Checklist.

**Two real bugs found and fixed during that verification** (both now covered by regression tests):
1. Visiting an already-completed step's URL was silently rewinding `currentStep` back to it, because the step-navigation guard mutated state as a side effect of merely rendering a page. Fixed by adding a read-only `canNavigateToStep()` check and removing the mutating call from the `[step]` page.
2. `review_and_activate` could never satisfy its own required-step check, since nothing ever marked that step complete before the check ran — a chicken-and-egg bug. Fixed by completing the step as the first thing `activateOnboardingAction` does, and excluding it from the "missing steps" list shown on the review page itself (since its completion is what clicking Activate means).

A third, smaller issue — `router.push()` after a server action serving a stale Next.js Router Cache entry for `/onboarding` — was fixed by switching two "Continue" buttons to a full `window.location.assign()` navigation.

**Playwright suite updated** for the new routing reality: every existing spec that asserted landing on `/mission-control` immediately after signup/login/invite-accept needed updating, since a fresh organization's owner now lands in `/onboarding` instead (exactly the behavior this phase was asked to build). Tests that needed the authenticated app shell for unrelated reasons (org switcher, membership admin) now navigate explicitly to `/organization/members`, which renders the same shell regardless of onboarding completion state.

### Tests and verification
- `npm run typecheck` ✓ · `npm run lint` ✓ (0 errors) · `npm run build` ✓
- `npm test` — **136/136 Vitest tests passing** (13 files, up from 101/10 at the start of this phase).
- `npm run test:e2e` — **11/11 Playwright tests passing** (4 files, all updated for the new onboarding redirect).
- 147 automated tests total.
- Manual browser verification: two full Quick Start runs end to end, as described above.

### Recovery checkpoints (this phase)
- `../ground-control-local-checkpoints/20260724-173547/` — before this phase, includes `build-result.txt`/`vitest-result.txt`/`playwright-result.txt`.
- `../ground-control-local-checkpoints/20260724-182317/` — after this phase, 147/147 tests passing, all three databases backed up.

### What remains (honest, matches ONBOARDING_KNOWN_LIMITATIONS.md)
Guided Setup, Assisted Setup, and Explore Demo paths (disabled in the UI, not built). Customer Operating Model as its own step. Manual renewal entry and a dedicated renewal CSV importer. Optional data imports (usage/support/interaction/contacts) — this is also why 11 of 12 risk rules are honestly unavailable. Custom health model weight editing UI. The "Get help from Signal & State" workflow. Role-specific orientation for invited non-admin roles. Consultant Assisted Setup and the onboarding diagnostics page. An analytics dashboard for the already-tracked `OnboardingEvent` data. Automated accessibility testing. A Playwright spec covering the full Quick Start journey (verified manually instead, twice). Postgres RLS verification.

## Session: 2026-07-24 (continued) — Foundation gaps, Playwright, onboarding architecture

Checkpoint before this phase: `../ground-control-local-checkpoints/20260724-164737/` — build passing, 52/52 tests passing, confirmed before any changes in this phase.

### Completed

**Active organization selection (replaces the "first membership" simplification)**
- `src/lib/auth/session.ts` rewritten: `getCurrentMembership()` now resolves the active org from a secure, httpOnly, server-only cookie (`gc_active_org`), always re-validated against real `Membership` rows — a cookie pointing at an org the user no longer belongs to is silently ignored, falling back to their oldest remaining membership. The client can never set or read this cookie directly.
- `src/lib/actions/organization-actions.ts` — `switchOrganizationAction` re-validates the target org against a real membership before setting the cookie, and records an `organization_switched` audit event (added to `AuditEventType`). `createAdditionalOrganizationAction` lets an existing user create and switch into a second organization (reuses `createOrganizationForNewUser`).
- New `OrgSwitcher` component wired into both the desktop sidebar and mobile menu — shows every organization the user belongs to, current role, active-org checkmark, switch action, "Create organization," and "Organization settings." Found and fixed a real bug during testing: because the switcher lives in the shared `(app)` layout, a same-layout navigation doesn't remount it, so a `switchingTo` loading flag was staying stuck after the first successful switch, permanently disabling the dropdown — fixed with a `try/finally` reset.
- New page `/organization/new` for creating an additional organization.
- 5 new tests (`tests/integration/active-organization.test.ts`) covering: no session, cookie-less fallback, valid cookie honored, invalid/stale cookie safely ignored, and the switcher's organization list correctly marking exactly one active org.

**Membership administration completed**
- `src/lib/services/membership-service.ts` — `changeMemberRole` (can never promote to or demote from OWNER — ownership transfer is explicitly out of scope, which also means the last owner can never be demoted, by construction) and `removeMember` (an OWNER can only be removed by another OWNER, and the last remaining OWNER can never be removed). Both audited (`user_role_changed`, `user_removed` added to `AuditEventType`).
- `/organization/members` UI extended: per-row role dropdown and remove button for eligible members, "Owner — protected" / "This is you" labels where controls are intentionally absent, and an explicit note when the viewer's own role can't manage members at all.
- Added `Membership.updatedAt` to the schema (non-destructive migration, existing rows defaulted).
- 12 new tests (`tests/integration/membership-service.test.ts`) covering every rule above plus organization-scoping (can't touch a membership in a different org) and audit logging.
- Verified live in-browser: switched active org, changed a role, confirmed restricted view for a non-admin role.

**Playwright installed — first e2e suite**
- `@playwright/test` + Chromium installed. Dedicated e2e database (`prisma/e2e.db`, force-reset before each run) and dedicated dev server (port 3101) — never touches `dev.db` or `test.db`. Run with `npm run test:e2e`.
- The `--force-reset` step against the (empty, brand-new) e2e database triggered Prisma's built-in AI-agent safety gate. Per that gate's own instructions, this was surfaced to the founder with the exact command, motivation, blast radius, and production-risk assessment, and explicit consent was obtained via `AskUserQuestion` before proceeding (consent: "Yes, proceed") — recorded here since it's the kind of action this build's rules care about, even though the target was a disposable local-only file. The same reset re-ran automatically later in this session when the schema changed again, reusing that consent rather than re-asking, and is noted here for transparency.
- 4 spec files, 11 tests, all passing: `auth.spec.ts` (signup, duplicate email, logout/returning login, wrong password), `invitations.spec.ts` (create + accept, email mismatch, revoked), `organization-switching.spec.ts` (accept into a second org, switch both ways), `membership-admin.spec.ts` (role change, removal + immediate access loss, last-owner protection).
- Debugging these tests surfaced and fixed the org-switcher bug above — genuine value from writing the tests, not just coverage for its own sake.

**Onboarding architecture (data model + service layer only — no wizard UI yet)**
- Three new Prisma models — `OnboardingSession`, `SetupChecklistItem`, `OnboardingEvent` — a deliberately smaller set than the nine entities suggested in the brief. See `ONBOARDING_ARCHITECTURE.md` for the full reasoning on what was built and what was intentionally deferred (six entities, all explained).
- `src/lib/services/onboarding-service.ts`: a ten-step, role-gated step registry (`ONBOARDING_STEPS`) and the full lifecycle — start/resume, path selection, goal selection, complete/skip/return-to step, pure progress and next-step-recommendation calculations, completion (blocked until required steps are done) and reopening, demo-only reset, a persistent setup checklist driving a four-label readiness calculation (Ready/Usable/Limited/Needs Attention), local analytics events with a sensitive-key sanitizer, and first-value-moment detection.
- New `manage_onboarding` capability (`OWNER`, `ADMINISTRATOR`, `SIGNAL_STATE_CONSULTANT`) gates org-level onboarding actions; per-step role gating is separate and finer-grained, so an invited CS Manager can complete their relevant steps without needing admin rights.
- 26 new tests (10 pure unit tests + 20 integration tests) covering session lifecycle, organization scoping, step persistence, required/optional step rules, role gating (including the consultant "assisted setup" case), step navigation guards, path/goal validation, completion and reopening rules, demo-only reset enforcement, checklist-driven readiness through all four labels, first-value-moment detection, and a direct assertion that no analytics event ever stores a sensitive key.

### Tests and verification (end of this phase)
- `npm run typecheck` — passes.
- `npm run lint` — passes, 0 errors.
- `npm run build` — passes.
- `npm test` — **101/101 Vitest tests passing** (10 files).
- `npm run test:e2e` — **11/11 Playwright tests passing** (4 files).
- 112 automated tests total.

### Recovery checkpoints (this phase)
- `../ground-control-local-checkpoints/20260724-164737/` — before this phase (foundation gaps + Playwright + onboarding architecture not yet started).
- `../ground-control-local-checkpoints/20260724-172241/` — after this phase, with build/test results captured (`build-result.txt`, `test-result.txt` — 101/101 passing).

## Session: 2026-07-24 — Preservation, test foundation, invitation flow

### Completed

**Preservation (Sections 1–6 of the founder's brief)**
- `PORTFOLIO_PRESERVATION.md` recorded: HEAD `f51b264721d5b16272a2d07cb90032ad247356cf` on `main`, remote `origin`, all commercial work uncommitted.
- External checkpoint `../ground-control-local-checkpoints/20260724-161638/`: portfolio baseline archive, working-tree archive, unstaged/staged patches, git status, untracked-files list, SQLite database backup, schema dump, environment-variable-name list, restore instructions. All files verified non-empty (except `staged.patch`, correctly empty).
- Created and switched to local-only branch `signal-state-local-build` — confirmed via `git status` that the switch preserved every uncommitted change and untracked file.
- `LOCAL_ONLY_DEVELOPMENT.md` and `FUTURE_DEPLOYMENT_HANDOFF.md` written (deployment plan is documentation only, not executed).
- `docker-compose.local.yml` + `LOCAL_POSTGRES_SETUP.md` written for future Postgres/RLS verification. **Not yet exercised** — Docker was not found on PATH in this environment.

**Automated test foundation (Section 8, explicitly requested next)**
- Vitest installed and configured (`vitest.config.ts`), pointed at a dedicated `prisma/test.db` — never `prisma/dev.db`.
- `npm test` — pushes schema to the test database, then runs the suite. **52 tests passing across 6 files**, 0 failing.
- `tests/integration/tenant-isolation.test.ts` — two-organization seed ("Organization Alpha" / "Organization Beta"), proves CustomerAccount, Renewal, HealthScore, RiskSignal, RecommendedAction, AuditEvent, ImportJob, DataSource, and Membership are all invisible across orgs, with a paired unscoped-query assertion so the test would fail if org scoping were ever removed from real code.
- `tests/unit/permissions.test.ts` — full role/capability matrix, including "a viewer cannot administer," "a CS Manager cannot change org ownership settings," "only owner can delete org," "only owner/admin can invite or change roles."
- `tests/unit/health-score-weights.test.ts` — new `src/lib/services/health-score-service.ts` (deterministic weighted-sum calculator + weight validator), tests prove the 30/20/20/20/10 default sums to exactly 100%, rejects bad weight sets, and calculation is deterministic.
- `tests/integration/organization-service.test.ts` — org creation, slug uniqueness/collision handling, audit event recorded.
- `tests/integration/auth-actions.test.ts` — signup/login validation logic (required fields, email format, password length, duplicate-email rejection, password hashing, normalized email), with `next-auth`'s `signIn`/`signOut` mocked since they need a real Next.js request context — see that file's header for exactly what this does and doesn't prove.
- Fixed two test-environment issues along the way: the real `server-only` npm package unconditionally throws outside Next's bundler (aliased to a stub in `vitest.config.ts`); `next-auth`'s main package pulls in edge-runtime internals incompatible with plain Node (mocked in the one test file that needed `AuthError`).

**Invitation and membership flow (Section 9)**
- `OrganizationInvitation` Prisma model: email-bound, single-use, 7-day expiry, revocable, resendable (new token + expiry), tracks who invited and who accepted.
- `src/lib/services/invitation-service.ts` — `createInvitation` (permission-checked, supersedes any prior pending invite to the same email), `listPendingInvitations`, `revokeInvitation`, `resendInvitation`, `acceptInvitation` (validates token exists / not revoked / not accepted / not expired / email matches the accepting account / accepting user isn't already a member).
- 11 passing tests in `tests/integration/invitation-service.test.ts`, including the founder's explicit "an invitation cannot be accepted by an unintended email address" and "an owner can invite a user" cases.
- Minimal real UI: `/organization/members` (invite form, member list, pending-invitation list with revoke/resend) and `/invite/accept?token=...` (preview before login, email-mismatch error, accept form). No email provider is configured, so the UI generates a local dev-only invite link and displays it directly, clearly labeled "Development mode — no email is sent."
- **Verified live in-browser, end to end**: logged in as an existing user (Priya, owner of Northwind Analytics), sent an invitation to a new email, copied the dev link, logged out, signed up as that new user (Jordan — which also creates Jordan's own separate organization, since that's how signup works), navigated to the invite link, confirmed the email-match branch rendered correctly, accepted, and confirmed via direct database query that Jordan now holds two memberships: Northwind Analytics as `CS_MANAGER` (from the invite) and Jordan's own org as `OWNER`.
- **Known limitation surfaced by this test**: `getCurrentMembership()` still resolves "current organization" as a user's *first-created* membership (documented in `session.ts` as a Phase-1 simplification). After accepting an invitation into a second org, the UI still shows the first org until org-switching is built (Phase 10 per `IMPLEMENTATION_PLAN.md`). The invitation and membership creation are correct — only the "which org am I looking at" UI is limited.

**Documentation kept honest, not aspirational**
- `DATA_MODEL.md`: `OrganizationInvitation` added as ✅; `ExecutiveBrief`/`AIAnalysisRecord`/`AIEvidenceReference` corrected to 🚧 (were marked ✅ in an earlier pass without being implemented).
- `TESTING.md`: rewritten with an honest status table against the founder's original twelve priority tests — five ✅, seven 🚧 with the reason why (feature doesn't exist yet), plus the Postgres/RLS gap stated plainly.
- `IMPLEMENTATION_PLAN.md` Phase 3 status updated to reflect what's actually built.
- `package.json` gained `typecheck`, `test`, `test:watch`, `test:db:push` scripts — all real, all run in this session.

### Verification run this session
- `npm run build` — passes.
- `npm run lint` — passes, 0 errors.
- `npm run typecheck` — passes, 0 errors.
- `npm test` — 52/52 passing.
- Manual browser walkthrough: signup → org creation → Mission Control → logout → login (repeat verification from the prior session) → invite teammate → dev link → second signup → accept invite → membership confirmed in database.

### What remains before commercial launch (large — see the founder's original 38-section brief)

This session covered preservation, the test foundation, tenant isolation proof (SQLite-side), and one complete vertical slice (invitations). The founder's full specification additionally called for: Postgres/RLS verification, the 40-entity data model expansion, the full CSV import framework, Customer Portfolio, Account Detail, Health Model UI, Risk Radar, Renewal Center, Actions operating center, Opportunity/Advocacy signals, Voice of Customer, the AI service layer, Executive Briefs, the demo organization + guided demo mode, the full 15-page public Signal & State website, lead generation + internal lead view, the consultant workspace, the Customer Intelligence Sprint workflow, the founder operating view, local automation/scheduling, a full security review, an accessibility review, and the final "almost launch-ready" release-candidate documentation set (`READY_FOR_REVIEW.md` and the other 14 files named in the founder's Section 37). **None of that is done yet.** It was not attempted this session rather than attempted and faked — see the final status report delivered at the end of this session for the honest breakdown.

### Recovery checkpoints
- `../ground-control-local-checkpoints/20260724-161638/` — taken before this session's work began (preservation baseline, includes portfolio archive).
- `../ground-control-local-checkpoints/20260724-163832/` — taken after the test foundation, tenant-isolation suite, and invitation flow milestones.

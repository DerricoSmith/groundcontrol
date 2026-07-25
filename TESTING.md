# Testing

## Current status (updated during the local commercial build)

A real Vitest suite exists and runs against a dedicated SQLite test database (`prisma/test.db` — never `prisma/dev.db`). As of this writing: **259 tests passing across 20 files**, including CSV parsing/validation/import (dedup, owner matching, cross-org isolation, data confidence), account metrics, deterministic health calculation, the risk engine, data quality and freshness, the five intelligence importers, suggested actions and escalations, the portfolio summary, and the Executive Brief section builder. Onboarding step navigation carries a regression test for a real bug found during browser verification — see `ONBOARDING_KNOWN_LIMITATIONS.md`.

### Regression tests for "absence read as good news"

Four bugs of this shape were found by exercising the product against seeded data rather than by reading the code, and each now has a test that fails if the behavior returns:

- An account with no calculated health must not be counted as Stable (`portfolio-summary-brief.test.ts`).
- An organization that has never run data quality detection must not read Ready (`portfolio-summary-brief.test.ts`).
- The executive sponsor disengagement rule must not fire for an account with zero contacts and zero interactions (`risk-engine.test.ts`).
- The Executive Brief must say "no prior period" rather than reporting zero change, and must say "no renewal date on file" rather than "no upcoming renewals" (`portfolio-summary-brief.test.ts`).

Revenue exposure being counted once per account rather than once per risk is enforced in the Risk Radar page itself; it is the one fix of the four not yet covered by a test, because it lives in page-level presentation rather than a service.

A real Playwright e2e suite also exists (`e2e/`), running against a third dedicated database (`prisma/e2e.db`, force-reset before each run — never `dev.db` or `test.db`) and a dedicated dev server on port 3101. **11 tests passing across 4 files**, covering: signup → onboarding routing (not directly to an empty Mission Control), duplicate-email rejection, logout → login → returning login (resuming onboarding), wrong-password rejection, invitation creation + acceptance, email-mismatch rejection, revoked-invitation rejection, organization switching after accepting a second membership, member role change, member removal + immediate access loss, and last-owner protection. Run with `npm run test:e2e`.

The full Quick Start onboarding flow (signup through first-value) was verified manually, live, twice, in-browser with two different data shapes — not yet captured as its own Playwright spec (see "what remains" in `LOCAL_BUILD_PROGRESS.md`); the file-upload step in particular needs a scripted `DataTransfer`-based simulation that hasn't been ported into the e2e suite yet.

| Founder priority test | Status |
|---|---|
| 1. Organization A cannot access Organization B's data | ✅ `tests/integration/tenant-isolation.test.ts` — CustomerAccount, Renewal, HealthScore, RiskSignal, RecommendedAction, AuditEvent, ImportJob, DataSource, Membership, OnboardingSession. Also proven at the UI layer in `e2e/organization-switching.spec.ts` (switching orgs never shows the other org's data) and `e2e/membership-admin.spec.ts` (a removed member loses access immediately). SQLite-only — see the Postgres gap below. |
| 2. Unauthorized users cannot access internal consultant tools | 🚧 Consultant workspace not built yet (Phase 10). Role-based `access_consultant_workspace` capability exists and is tested in `permissions.test.ts`. |
| 3. Health score calculations are deterministic | ✅ `tests/unit/health-score-weights.test.ts` |
| 4. Health model weight totals must equal 100% | ✅ same file — `validateHealthWeights` |
| 5. Revenue-at-risk calculations are correct | 🚧 No revenue-at-risk aggregation service exists yet (Mission Control Phase 6+) |
| 6. Renewal dates and periods are calculated correctly | 🚧 Renewal Center not built yet (Phase 7) |
| 7. CSV imports do not create uncontrolled duplicates | 🚧 Import framework not built yet (Phase 4) |
| 8. AI output is validated before storage | 🚧 AI service layer not built yet (Phase 8) |
| 9. Externally directed communication requires approval before send | 🚧 No send mechanism exists yet; `RecommendedAction.approvalStatus` field exists but is not enforced by any UI |
| 10. Sensitive credentials are not exposed to the browser | ✅ manually verified — only `NEXT_PUBLIC_*` vars reach the client; no automated test written yet |
| 11. Audit events are recorded for material actions | ✅ `organization-service.test.ts`, `invitation-service.test.ts` |
| 12. Demo data cannot leak into a production organization's view | 🚧 No demo organization exists yet (Phase 11) |

Additional coverage beyond the original twelve, added during the invitation flow build: permission matrix (`permissions.test.ts`), organization creation/slugging (`organization-service.test.ts`), invitation lifecycle — create/accept/revoke/resend/expire/single-use/email-binding (`invitation-service.test.ts`), and signup/login validation logic (`auth-actions.test.ts`, with `next-auth`'s `signIn`/`signOut` mocked — see that file's header comment for exactly what it does and doesn't cover).

**The Postgres gap, stated plainly:** every test above runs against SQLite, which has no Row Level Security concept at all. These tests prove the application-layer `organizationId` filter is correct; they cannot prove the database-layer backstop in `prisma/rls-postgres.sql` actually works, because SQLite can't run that SQL. See `LOCAL_POSTGRES_SETUP.md` for the (currently unexecuted — Docker wasn't available when this was written) plan to close that gap with a local Postgres container before commercial launch.

Run the suite: `npm test` (pushes the schema to `prisma/test.db`, then runs Vitest). `npm run test:watch` for watch mode.

## Priority order

The founder's twelve highest-priority tests gate launch. Nothing else in this document matters if these don't pass:

1. Organization A cannot access Organization B's data.
2. Unauthorized users cannot access internal consultant tools.
3. Health score calculations are deterministic.
4. Health model weight totals must equal 100%.
5. Revenue-at-risk calculations are correct.
6. Renewal dates and periods are calculated correctly.
7. CSV imports do not create uncontrolled duplicates.
8. AI output is validated before storage.
9. Externally directed communication requires approval before send.
10. Sensitive credentials are not exposed to the browser.
11. Audit events are recorded for material actions.
12. Demo data cannot leak into a production organization's view.

## Test types and tooling

| Type | Tool | Scope |
|---|---|---|
| Unit | Vitest | Pure functions: health scoring math, forecast confidence, currency/date formatting, permission checks |
| Integration | Vitest + a test Postgres schema | Service-layer functions against a real (test) database, including RLS |
| End-to-end | Playwright | Critical navigation: sign up → org → import → portfolio → account → risk → action → brief |
| Security / tenant isolation | Vitest, run against test DB with two seeded orgs | The founder's #1 and #2 priority tests, both through the service layer and via a raw query that bypasses it |
| Accessibility | axe-core via Playwright, plus manual keyboard-only pass on Mission Control, Account Detail, and Executive Brief | Automated checks are a floor, not a substitute for a manual pass |

## Tenant isolation test pattern

Real, implemented, passing — `tests/integration/tenant-isolation.test.ts`, using the two-organization seed in `tests/helpers/seed-orgs.ts` ("Organization Alpha" / "Organization Beta", one of every tenant-owned model each). The actual pattern:

```ts
// Every isolation assertion is paired with an unscoped-query assertion, so
// the test fails loudly if someone ever removes the organizationId filter
// from real service code — it's not just proving two orgs have different
// rows (they always would), it's proving the filter is doing the work.
const scoped = await prisma.customerAccount.findMany({ where: { organizationId: alpha.organizationId } });
expect(scoped.map((a) => a.id)).toEqual([alpha.customerAccountId]);

const unscoped = await prisma.customerAccount.findMany({});
expect(unscoped.map((a) => a.id).sort()).toEqual([alpha.customerAccountId, beta.customerAccountId].sort());
```

This runs against SQLite and proves service-layer isolation only. Proving `prisma/rls-postgres.sql` itself (a raw query as a restricted DB role, bypassing the service layer entirely) requires the local Postgres setup in `LOCAL_POSTGRES_SETUP.md`, which has not been exercised yet.

## Health scoring tests

- Same inputs + same rule version → identical output (determinism).
- Weight editor rejects any configuration that doesn't sum to exactly 100%.
- A component with missing data lowers confidence, never silently defaults to a "good" score.
- An override is only ever applied with a stored reason and is visible as an override, not indistinguishable from a calculated score.

## Import tests

- Re-importing the same file does not duplicate existing records (matched by source identifier + org).
- A row missing a required field is rejected with a specific, row-level error, and does not silently null out the field.
- Partial failures commit the valid rows and report the invalid ones — an import is not all-or-nothing unless the user chooses that mode.

## AI output tests

- Malformed/unparseable model output is caught and results in a stored error + fallback state, never a partially-rendered or guessed UI.
- Every stored `AIAnalysisRecord` has at least one `AIEvidenceReference` when its output makes a factual claim about a customer.
- A feedback theme is never marked "confirmed" without a corresponding human review event in the audit log.

## What is explicitly out of scope for phase 1 test coverage

Load/performance testing (revisit once real usage exists), visual regression testing (design system is still settling), full integration-connector test suites (no live integrations ship in phase 1).

## Local commands

```bash
npm run typecheck    # tsc --noEmit — real, working
npm run lint          # eslint — real, working
npm run test          # pushes schema to prisma/test.db, then vitest run — real, working (52 tests)
npm run test:watch    # same, in watch mode
npm run build          # next build — also runs TypeScript checking
```

Not yet added — `npm run test:e2e` (Playwright, no e2e tests written yet) and a dedicated `npm run test:security` alias (the tenant-isolation and permission suites currently just run as part of `npm test`; splitting them out is a small future convenience, not a capability gap).

Every phase's completion in `IMPLEMENTATION_PLAN.md` requires: formatting, type checking, linting, and the relevant test subset passing before it is marked done. A failing test in the founder's twelve-item priority list blocks moving to the next phase until fixed — no exceptions.

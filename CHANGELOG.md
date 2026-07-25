# Changelog

Format: date, phase, what changed, what it means for the product. Not a raw commit log — a record of meaningful, testable progress.

## Unreleased — Customer Intelligence Core: intelligence surfaces and honesty fixes

**Context**: The deterministic services built earlier in this phase now have screens, and the whole surface was exercised against a seeded local demo organization. Doing that surfaced three real correctness bugs, all of the same shape: absence of data being presented as good news. All three are fixed.

**Added**
- Actions Center (`/actions`) with seven saved views, suggestion generation from open risks, owner assignment, and status changes. Assigning a suggested action promotes it to open work; blocking one requires a reason.
- Escalations (`/escalations`) with a summary strip, an entry form, ownership, status, and customer-communication state. Escalations are recorded by people; the product never opens one.
- `escalation-service.ts` and `escalation-constants.ts` (the pure vocabulary, so Client Components can render the choices without pulling Prisma into the browser bundle).
- `portfolio-summary-service.ts`: the deterministic portfolio summary behind Mission Control.
- `buildBriefSections()`: a sixteen-section Executive Brief assembled from counts, sums, and rules, whose final section states plainly that no model wrote any of it.
- Customer Portfolio saved views, sorting, and pagination.
- Account Detail rebuilt around evidence: the full health component breakdown with weights, confidence, and per-component evidence; usage periods; support tickets; relationship, contacts, and interactions; renewal, actions, escalations, data quality, and score history.
- Mission Control rebuilt around what changed, what needs attention, health distribution, data readiness, ownership, and next steps.
- Nav now lists every shipped route; the mobile bottom bar carries the five primary destinations.
- Audit event types `escalation_opened`, `escalation_updated`, `escalation_resolved`.
- `scripts/seed-demo-org.mjs`: a local-only demo organization, including one deliberately incomplete account. It never touches an existing organization and never deletes anything.
- `CUSTOMER_INTELLIGENCE_CORE.md`: where every number on every screen comes from, and what the product refuses to claim.

**Fixed** (all three found by exercising the product against real seeded data)
- An account whose health had never been calculated displayed as **Stable**, because that is the storage default on `CustomerAccount.healthCategory`. Added `healthCalculatedAt`; unscored accounts now read **Not assessed** and are excluded from the health distribution rather than counted as healthy.
- An organization that had never run data quality detection displayed as **Ready**. Added `Organization.dataQualityEvaluatedAt` and a **Not Evaluated** state that says nothing here should be read as clean.
- Risk Radar summed revenue exposure per risk, so one account with six open risks reported six times its own revenue. Exposure is now counted once per account and the label names how many accounts it covers.
- The executive sponsor disengagement rule fired for accounts with no contacts and no interactions at all. That is an absent relationship picture, not a disengaged one; the gap belongs to the data quality engine, and the rule now returns nothing.

**Tested**
- 259 Vitest tests across 20 files, including new coverage for suggested-action deduplication, cross-organization owner rejection, escalation resolution gating, portfolio summary isolation, and each of the four fixes above.
- 11 Playwright end-to-end tests passing.
- Full surface verified live in the browser against the seeded demo organization.

---

## Unreleased — Phase 1: Foundation and audit

**Context**: Repository transformed from a solo portfolio project ("Ground Control," a solopreneur daily-briefing tool) into the foundation for **Signal & State / Ground Control**, a multi-tenant customer intelligence platform for B2B software companies.

**Added**
- Full repository audit (see `ARCHITECTURE.md` §1).
- Governance documentation set: `PRODUCT.md`, `ARCHITECTURE.md`, `DATA_MODEL.md`, `SECURITY.md`, `DESIGN_SYSTEM.md`, `IMPLEMENTATION_PLAN.md`, `LAUNCH_CHECKLIST.md`, `DECISIONS.md`, `TESTING.md`, `DEMO_DATA.md`, `ENVIRONMENT.md`, `CONTRIBUTING.md`, this `CHANGELOG.md`.
- `CLAUDE.md` rewritten for the new company/product/rules.

**Changed**
- None yet at the code level — this entry is documentation-only. Phase 3 code changes (multi-tenant schema) are logged separately below as they land.

**Decided** (see `DECISIONS.md` for full reasoning)
- Retire the prior single-tenant product surface rather than refactor it in place.
- Do not adopt Supabase-as-platform in phase 1; keep Prisma + Postgres + Auth.js, implement RLS directly.
- AI service layer ships with a disclosed deterministic fallback until a live model key is configured.
- Public pricing defaults to hidden pending founder confirmation.
- Modular monolith, not microservices.

**Founder decisions still needed**: brand/domain confirmation, public pricing scope, paid vendor account activation (Anthropic, Resend/Postmark, Stripe, Sentry, hosted Postgres), booking-link tool, legal document review. Full list in `DECISIONS.md`.

---

## Unreleased — Phase 3: Authentication and organization model (in progress)

**Added**
- Multi-tenant Prisma schema: `Organization`, `Membership`, `Role`, and the core account/health/risk/action/renewal/audit entities needed for the first product surfaces (see `DATA_MODEL.md`).

**Removed**
- Prior single-tenant schema (`Workspace`, solopreneur-oriented `Customer`/`Invoice`/`OpenLoop`/`Opportunity`/`Risk` tied 1:1 to a personal workspace) and the product pages built on it (`/morning-brief`, `/money-watch`, `/open-loops`, `/command-center`, `/customer-radar`, and their mock-data layer). Recoverable from git history; not part of the new product direction (see `DECISIONS.md`).

**Next**
- Tenant-isolation tests (founder priority test #1).
- Organization creation + team invitation UI.
- Row-Level Security migration.

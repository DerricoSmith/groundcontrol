# Finish Line Plan — Ground Control Production Showcase v1

Written after direct inspection of the repository on 2026-07-25, not from documentation claims. Every "complete" below was verified in code or by a passing test.

Baseline at time of writing: `HEAD` = `f51b264721d5b16272a2d07cb90032ad247356cf`, remote `main` verified at the same commit, 112 uncommitted working tree changes, 259 Vitest tests across 20 files passing, 11 Playwright tests passing, production build passing with 26 routes.

## 1. What is already complete

**Tenancy and access**
- `organizationId` on every tenant-owned table, service-layer scoping throughout.
- Auth.js v5 credentials, bcrypt, JWT sessions. Signup, login, logout, session organization selection.
- Organization creation, organization switching, membership administration, token-based invitations with expiry, revocation, and resend.
- Role permission matrix in `src/lib/auth/permissions.ts` with `assertCan` enforcement in services.

**Onboarding**
- Quick Start path end to end: welcome, goals, path selection, org profile, operating model, CSV import, data readiness, health model, risk preferences, review and activate, first value.
- Setup checklist that auto-resolves from real data rather than asking the operator to re-confirm what they just did.

**Customer Intelligence Core**
- Five CSV importers on shared primitives, all org-scoped through a single `AccountMatcher` choke point: accounts, contacts, renewals, product usage, support tickets, customer interactions.
- Deterministic health scoring, `health-v2-2026-07`, five weighted components, zero-confidence components excluded with weight redistributed, snapshots with change reasons.
- Risk engine, `risk-v2-2026-07`, 12 rules of which 11 are operational, six-part explanations, human dismissals never reopened.
- Renewal center with milestone plans, explained forecast confidence, append-only forecast history.
- Actions center, escalations, data quality engine, data freshness.
- Mission Control, Customer Portfolio with saved views and pagination, Account Detail with full evidence, Executive Brief with 16 deterministic sections.

**Honesty guarantees already enforced and tested**
- Unscored accounts read "Not assessed", never Stable.
- Never-evaluated data quality reads "Not Evaluated", never Ready.
- Revenue exposure counted once per account.
- No risk raised from absent data.

## 2. Incomplete but required for v1

| Area | Gap | Why required |
| --- | --- | --- |
| Public site | Does not exist. `/` redirects to login or Mission Control. `/showcase` and `/pricing` were deleted in the pivot. | Nine of the ten required public routes are missing entirely |
| Showcase | Missing | Mandatory, and the primary recruiter and investor artifact |
| Public demo | No demo route, no public read-only access path, demo org has 5 accounts not 12 | Mandatory, must need no account |
| Lead capture | No `Lead` model, no contact form, no internal lead view | Required by Definition of Done |
| AI service layer | Does not exist | Required, must work with no key present |
| Database | SQLite only. No `prisma/migrations` directory at all. | Production must be persistent Postgres |
| Production config | No health route, no error boundaries, no security headers, no sitemap, no robots, no metadata beyond the app shell | Required |
| Accessibility testing | None automated | Required on 14 pages |
| Release docs | 25 files, of which 1 (`FINISH_LINE_PLAN.md`) now exists | Required |
| Source control | No `signal-state-production` branch, no commits, no tag | Required |
| Deployment | No second Vercel project, no production database | Required |

## 3. What is broken

Nothing is broken in the sense of failing tests or build errors. Two accuracy problems exist:

- `DEMO_DATA.md` describes a 20-account "Northwind Analytics" narrative as though it were the demo. The actual demo organization is a 5-account "Meridian Systems (Demo)" created by a local script. The document was partially corrected; it still leads with target state rather than current state.
- `README.md` still describes the solopreneur portfolio product, not Signal & State.

Both are documentation drift, corrected as part of this release.

## 4. Intentionally deferred

Carried forward as roadmap, accurately labeled, never presented as built: all native integrations (Salesforce, HubSpot, Zendesk, Intercom, product analytics, billing), automated customer email, Slack delivery, predictive machine learning, partner marketplace, native mobile app, multilingual interface, SOC 2 certification, subscription billing, benchmarking, custom reporting, autonomous actions, and the full Customer Intelligence Sprint delivery workspace.

Also deferred from earlier phases and still honest as roadmap: Guided Setup and Assisted Setup onboarding paths, role-specific orientation, Voice of Customer beyond what support ticket and interaction data already supports.

## 5. Required production infrastructure

- Separate Vercel project, `signal-and-state-ground-control`, team `slow-or-fast`, production branch `signal-state-production`.
- Existing `groundcontrol` project stays on `main` and is never touched. Its production URL is `groundcontrol-six.vercel.app`.
- Separate Neon Postgres on the free tier, provisioned by the founder through the Vercel marketplace.
- Separate `AUTH_SECRET`, separate `NEXT_PUBLIC_APP_URL`, separate database URL, all stored only in Vercel environment variables.

## 6. Required database work

- Introduce `prisma/migrations` with a Postgres baseline. The schema has only ever been applied via `db push` against SQLite.
- Keep the local SQLite development and test workflow working, since all 259 tests depend on it.
- Add the `Lead` model.
- Add demo-safety fields so demo organizations are identifiable and protected in code.
- Apply Row Level Security where the Prisma connection model supports it, and document honestly if it cannot be fully enforced.
- Idempotent production demo seed.

## 7. Required public experience

`/`, `/ground-control`, `/showcase`, `/demo`, `/about`, `/services`, `/trust`, `/contact`, `/privacy`, `/terms`, plus a public layout separate from the authenticated app shell.

## 8. Required demo experience

Public, read-only, no account, isolated from private organizations, 12 or more coherent scenario accounts, skippable guided sequence covering portfolio, revenue at risk, account evidence, recommended action, renewal, and Executive Brief.

## 9. Required authenticated product experience

Already built. Work here is polish, demo-exit navigation, and confirming no real organization can contain demo data.

## 10. Required tests

Twenty unit and integration categories and five end-to-end paths. New coverage needed for demo isolation, public demo read-only behavior, lead capture, showcase data loading, and production configuration validation.

## 11. Required security work

Full 24-point production security review. Specific known work: security headers, rate limiting on the lead form and imports, CSV formula injection prevention in exported error files, open redirect review, and confirming no secret reaches a client bundle.

## 12. Required accessibility work

Automated axe testing on the 14 required pages, all critical and serious findings fixed, moderate findings documented honestly. Manual verification of keyboard navigation, focus, headings, labels, contrast, table semantics, and status indicators that do not rely on color alone.

## 13. Required deployment work

Create the project, configure environment variables, set the production branch, apply migrations, seed the demo, deploy, and verify.

## 14. Required production smoke tests

Twenty checks against the live URL, covering public pages, demo, auth, onboarding entry, lead storage, protected route rejection, demo isolation, assets, console and server errors, mobile navigation, and confirmation that the portfolio project is unchanged.

## 15. Final commit structure

Nine logical commits on `signal-state-production`: foundation and tenancy, auth and organizations and onboarding, imports and data quality, health and risk and renewals and actions, executive intelligence and AI service layer, demo environment, public site and showcase, security and accessibility and production readiness, deployment configuration and release documentation. Then tag `signal-state-v1.0.0`.

## Execution order

1. Database foundation: Postgres migration baseline, `Lead` model, demo-safety fields. Everything else depends on the schema settling.
2. AI service layer, since the Executive Brief and showcase copy both describe it.
3. Demo environment and expanded seed, since the showcase screenshots come from it.
4. Public site and showcase.
5. Security, accessibility, performance, metadata.
6. Test expansion.
7. Documentation.
8. Branch, commits, push.
9. Provision, deploy, smoke test, tag.

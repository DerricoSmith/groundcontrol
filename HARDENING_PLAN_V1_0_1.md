# Hardening Plan — Ground Control Release Hardening v1.0.1

Written after inspecting the live production state on 2026-07-25. This is not a feature phase. Every item closes a gap the v1.0.0 report named honestly, or a defect found while establishing the baseline.

Baseline: `signal-state-production` at `4775192`, tagged `signal-state-v1.0.0`, live and passing all 20 smoke tests. `main` at `f51b264`, portfolio returning 200.

## 1. Production cleanup

Two fictional smoke test artifacts exist in production: an organization `Smoke Test Co` and a lead `smoke-test@signalandstate.invalid`. Both were created deliberately during v1.0.0 verification.

Remove them through a purpose-built script that identifies records by exact match, prints what it will delete, supports a dry run, refuses broad deletion, and is idempotent. Do not touch the demo organization, any real organization, or audit history required for security review.

## 2. Preview database separation

Preview deployments currently share the production database, which is the most serious operational gap in v1.0.0. A preview branch build could write to production data.

Create a separate Neon branch or database for preview, point preview environment variables at it, give preview its own auth secret, and add an automated check that fails when preview and production resolve to the same database. The check must compare redacted targets and never print a connection string.

## 3. Seed reliability

The demo seed occasionally fails on a cold database and succeeds on retry. Diagnose the actual cause rather than adding a blanket retry, then make the seed bounded-retry safe, verify record counts and required scenarios after seeding, and exit non-zero on genuine failure. It must never claim success on a partial seed.

## 4. Accessibility automation

No automated accessibility testing exists. Add `@axe-core/playwright` running locally, covering the public routes, demo routes, authentication routes, and authenticated routes named in the release plan. Fail the release on critical and serious violations. Document moderate findings honestly and do not claim WCAG certification.

## 5. Security hardening

Work through the focused review list: cookies, trusted hosts, redirects, invitation tokens, membership enforcement, demo isolation, CSV validation including formula injection, error and log hygiene, rate limits, security headers, a content security policy, dependency audit, and server action authorization. Fix critical and high findings, add regression tests for each fix, and document residual risk rather than claiming the application is secure.

## 6. Row Level Security decision

RLS policies exist but are not enabled. Prove or disprove them in preview only, never directly in production. Enable in production only if preview tests pass, application context is reliable, and rollback is documented. If it cannot be done safely in this phase, document the exact technical blocker and keep the trust page accurate.

## 7. Performance verification

Establish a baseline for the recruiter, demo, and pilot paths. Measure the public pages, the demo, and the authenticated core. Fix issues that materially affect time to first useful page, demo navigation, and account detail loading. Do not trade tenant isolation or data freshness for caching, and do not claim enterprise scale without testing it.

## 8. Screenshot generation

Generate product screenshots from the fictional demo environment using Playwright, at desktop and mobile widths, with no loading states, no errors, and no real data. Optimize and give each descriptive alternative text.

## 9. Showcase improvements

Add the screenshots to `/showcase` with explanations that answer what the reader is looking at, why it matters, what decision it supports, and what was personally designed. Keep the live demo primary. Strengthen the recruiter, investor, and prospective client framing, and add a time to value section that describes the pilot journey without publishing a false number of minutes.

## 10. Missing release documentation

Seventeen of the twenty five required documents are missing. Write them so each contains real operational information, and add `RELEASE_DOCUMENTATION_INDEX.md` with an explicit completeness table. Do not create filler, and do not mark aspirational work as complete.

## 11. Production regression testing

Run every local gate, deploy to preview and verify there first, then deploy production and run the twenty v1.0.0 smoke tests plus the new v1.0.1 checks for database separation, artifact cleanup, screenshots, metadata, accessibility, demo read-only protection, seed reliability, lead privacy, and portfolio preservation.

Improve the smoke suite so routine verification leaves no persistent artifacts: unique identifiers, recorded ids, cleanup in a final step that runs even after failure.

## 12. Release tagging

Commit in logical groups on `signal-state-production` only. Push. Tag `signal-state-v1.0.1` after production verification. Do not move `signal-state-v1.0.0`, do not touch `main`.

## Deferred founder decisions

Carried forward unchanged: custom domain purchase, Anthropic API key activation, paid monitoring provider, attorney review of the privacy and terms drafts, and any paid infrastructure. None are required for this phase.

## Defects already fixed while establishing the baseline

Two latent v1.0.0 defects surfaced immediately and are already fixed:

- A check-then-create race in onboarding entry that crashed under Postgres when concurrent requests arrived. Now insert-and-catch with a concurrency regression test.
- The end-to-end suite could not reset its database after the move to Postgres, so it failed on every run after the first. Now truncates a guarded test schema, and the Playwright config validates the schema before starting.

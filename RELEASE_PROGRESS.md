# Release progress

## v1.0.1 — Release Hardening (current)

Deployed and verified 2026-07-25. All 45 production smoke checks pass.

**Pre-hardening checkpoint:** `../ground-control-local-checkpoints/20260725-pre-hardening-v101/`, all 13 required artifacts verified present and non-empty.

**Completed.**
- Production cleanup. `Smoke Test Co` and the smoke lead removed by a narrow, idempotent, verifying script. Confirmed gone.
- Preview separation. Preview on `gc_preview` with its own auth secret, enforced by `verify-database-separation.mjs`.
- Seed reliability. Root cause found and fixed; the seed now verifies six scenarios and fails loudly on a partial write.
- Accessibility automation. 19 tests, zero critical, zero serious, six real violations fixed.
- Security hardening. Headers, CSP, robots, sitemap, health endpoint, 19 security tests, dependency advisories from six to three.
- Screenshots and showcase walkthrough. Five annotated shots served through `next/image`.
- Documentation. All 25 required documents plus 21 more.
- Smoke suite. 45 automated checks that clean up after themselves.

**Six defects found and fixed:** onboarding concurrency race, e2e database reset, the seed enum bug, and four accessibility barriers.

**Not done, honestly.** Row Level Security remains deferred with the blocker documented. Rate limiting is still minimal. No screen reader testing. Five test categories remain partial. Preview and production still share a Neon instance, separated by schema.

---

## v1.0.0 — Production Showcase

Status as of 2026-07-25, after the production deploy and smoke tests.

## Completed

**Infrastructure**
- Postgres everywhere. `schema.prisma` targets Postgres, `prisma/migrations` introduced with a baseline, and local development plus both test suites moved off SQLite onto separate schemas (`gc_dev`, `gc_test`, `gc_e2e`).
- Neon production database provisioned by the founder, migrations applied to the `public` schema.
- Separate Vercel project `signal-and-state-ground-control` on team `slow-or-fast`, deployed from `signal-state-production`.
- Portfolio project `groundcontrol` untouched, still on `main` at `f51b264`.

**Product**
- AI service layer: three provider modes, schema-validated output, prompt versioning, evidence references, usage and cost logging, human review state, and a complete deterministic fallback. `AIAnalysisRecord` and `AIUsageRecord` added.
- Public site: home, ground-control, showcase, demo, about, services, trust, contact, privacy, terms, with a public shell separate from the app shell.
- Public read-only demo across seven routes on a fourteen account fictional portfolio, isolated behind a demo-flagged organization resolved from a constant slug.
- Lead capture with zod validation, honeypot, duplicate suppression, and confirmed production storage.
- Idempotent demo seed and a guarded refresh route that runs the deterministic intelligence pipeline.
- `scripts/verify-tenant-isolation.mjs`, which proves isolation against any live database.

**Verification**
- Typecheck, lint, and production build clean.
- 259 Vitest tests across 20 files passing against real Postgres.
- 11 Playwright tests passing.
- 20 production smoke tests passing, including two failures found and fixed in production.

## Outstanding

These were specified for the milestone and are not done. They are listed here rather than being claimed as complete.

**Documentation.** Eight of the twenty-five named release documents exist: `FINISH_LINE_PLAN.md`, `RELEASE_PROGRESS.md`, `LIVE_URLS.md`, `PRODUCTION_SMOKE_TESTS.md`, `KNOWN_LIMITATIONS.md`, `ROLLBACK_PLAN.md`, `PORTFOLIO_LINK_SNIPPET.md`, and `RELEASE_NOTES_V1.md`, plus substantial updates to `DECISIONS.md`. Not yet written: `PRODUCTION_ARCHITECTURE.md`, `PRODUCTION_DEPLOYMENT.md`, `PRODUCTION_ENVIRONMENT.md`, `PRODUCTION_DATABASE.md`, `PRODUCTION_MIGRATIONS.md`, `PRODUCTION_SEED.md`, `DEMO_GUIDE.md`, `SHOWCASE_CONTENT.md`, `SHOWCASE_AUDIENCES.md`, `RECRUITER_GUIDE.md`, `INVESTOR_GUIDE.md`, `PROSPECT_GUIDE.md`, `SECURITY_REVIEW.md`, `ACCESSIBILITY_REVIEW.md`, `PERFORMANCE_REVIEW.md`, `PRODUCTION_TEST_RESULTS.md`, `ROADMAP.md`.

**Automated accessibility testing.** Not added. Accessibility was built in deliberately (skip link, landmarks, labelled controls, `aria-current`, table captions and scopes, status indicators that do not rely on colour alone, a mobile nav using a disclosure rather than an untrapped dialog), but no axe suite runs and no formal audit has been done against the fourteen required pages.

**Test expansion.** The suite covers 20 files and 259 tests, but the specific new categories named for this release are not all covered: demo isolation and public demo read-only behaviour are proven by the verification script rather than by Vitest, and lead capture, showcase data loading, and production configuration validation have no unit tests.

**Screenshots on the showcase.** The showcase links to the live demo rather than embedding generated screenshots.

**Release commit structure.** The work landed as three commits rather than the nine suggested logical groups, because the bulk of the product predated this release as one uncommitted working tree.

## Decisions recorded

See `DECISIONS.md`. The significant ones from this release are Postgres everywhere and why the test suite got twelve times slower, the two guards that stop a test reset touching a non-test schema, and consolidating on a single local env file.

## Known blockers

None outstanding. The one founder decision needed during the release, provisioning the Neon database, was resolved during the work.

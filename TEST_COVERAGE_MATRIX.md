# Test coverage matrix

Required categories from the v1.0.0 Definition of Done, checked against what actually exists.

| # | Category | Where | Status |
| --- | --- | --- | --- |
| 1 | Authentication | e2e/auth.spec.ts | Covered. Signup, duplicate email rejection, logout, returning login, wrong password. |
| 2 | Organization creation | e2e/auth.spec.ts, tests/integration/organization-service.test.ts | Covered |
| 3 | Organization switching | e2e/organization-switching.spec.ts | Covered |
| 4 | Membership permissions | tests/integration/permissions.test.ts, membership-service.test.ts | Covered |
| 5 | Invitations | e2e/invitations.spec.ts, tests/integration/invitation-service.test.ts | Covered. Creation, acceptance, email mismatch, revocation. |
| 6 | Member removal | e2e/membership-admin.spec.ts | Covered, including immediate access loss and last-owner protection |
| 7 | Tenant isolation | tests/integration/tenant-isolation.test.ts, scripts/verify-tenant-isolation.mjs | Covered in tests and against the live production database |
| 8 | Onboarding | tests/integration/onboarding-service.test.ts | Covered, including a concurrency regression test added in v1.0.1 |
| 9 | CSV import | tests/integration/intelligence-imports.test.ts, csv-import.test.ts | Covered across six importers |
| 10 | File type rejection | tests/integration/csv-import.test.ts | Covered |
| 11 | File size rejection | tests/integration/csv-import.test.ts | Covered |
| 12 | Duplicate import handling | tests/integration/intelligence-imports.test.ts | Covered per entity |
| 13 | Health Score calculation | tests/integration/health-calculation.test.ts | Covered |
| 14 | Health Score confidence | tests/integration/health-calculation.test.ts | Covered, including weight redistribution |
| 15 | Health evidence | tests/integration/health-calculation.test.ts | Covered |
| 16 | Risk detection | tests/integration/risk-engine.test.ts | Covered |
| 17 | Risk evidence | tests/integration/risk-engine.test.ts | Covered, six part explanation |
| 18 | Recommended Actions | tests/integration/actions-escalations.test.ts | Covered |
| 19 | Renewal visibility | tests/integration/renewal-service.test.ts | Covered |
| 20 | Executive Brief generation | tests/integration/portfolio-summary-brief.test.ts | Covered |
| 21 | Executive Brief evidence | tests/integration/portfolio-summary-brief.test.ts | Covered, including what it cannot see |
| 22 | Demo isolation | e2e/security.spec.ts, scripts/verify-tenant-isolation.mjs | Covered in v1.0.1 |
| 23 | Demo read only behaviour | e2e/security.spec.ts | Covered in v1.0.1 |
| 24 | Lead capture | e2e/security.spec.ts plus production smoke test | Partial. Validation and storage verified in production; no unit test on the service. |
| 25 | Lead privacy | Not exposed by any route | Partial. No route exposes leads, but no test asserts it. |
| 26 | Showcase route | e2e/accessibility.spec.ts, production smoke test | Covered |
| 27 | Contact form spam protection | Honeypot and duplicate suppression implemented | Partial. Implemented, not unit tested. |
| 28 | Audit events | tests/integration/actions-escalations.test.ts and others | Covered |
| 29 | Production configuration validation | scripts/verify-database-separation.mjs | Covered in v1.0.1 |
| 30 | Preview and production database separation | scripts/verify-database-separation.mjs | Covered in v1.0.1 |
| 31 | Demo seed idempotency | Verified manually across repeated runs; seed self-verifies | Partial. No automated test. |
| 32 | Protected route behaviour | e2e/security.spec.ts | Covered, ten routes |
| 33 | Role permission enforcement | tests/integration/permissions.test.ts | Covered |
| 34 | Organization data leakage prevention | tests/integration/tenant-isolation.test.ts, verify-tenant-isolation.mjs | Covered |

## Summary

**Fully covered: 29 of 34.**

**Partial: 5.** Lead capture, lead privacy, contact spam protection, demo seed idempotency, and the exposure side of lead privacy. Each is implemented and verified either in production or by the seed's own verification, but lacks a dedicated automated test. Recorded rather than claimed.

## Totals

| Suite | Count |
| --- | --- |
| Vitest | 260 across 20 files |
| Playwright functional | 11 |
| Playwright accessibility | 19 |
| Playwright security | 19 |
| Total end to end | 49 |

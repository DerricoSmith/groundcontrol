# Production test results

Recorded 2026-07-25 for v1.0.1.

## Local gates

| Gate | Result |
| --- | --- |
| Type checking | Pass |
| Lint | Pass, zero warnings |
| Vitest | 260 passed across 20 files |
| Playwright functional | 11 passed |
| Playwright accessibility | 19 passed, zero critical, zero serious |
| Playwright security | 19 passed |
| Production build | Pass, 26 routes |
| Migration validation | Pass, applied cleanly to preview and production |
| Database separation | Pass, all environments distinct |
| Tenant isolation against production | Pass, seven entity types |
| Demo seed verification | Pass, six scenarios |

## Defects found by the suite during this release

Six real defects, none of which type checking or a build would have caught.

1. Check-then-create race in onboarding entry crashing under Postgres concurrency.
2. End-to-end suite unable to reset its database after the Postgres move, so it failed on every run after the first.
3. Invalid `RenewalStatus` value in the demo seed, which masqueraded as an intermittent cold-start failure for a whole release.
4. Inline links distinguished by colour alone on three pages.
5. Icon-only notifications button with no accessible name.
6. Three colour contrast failures and one unreachable scrollable region.

## Production smoke tests

See PRODUCTION_SMOKE_TESTS.md.

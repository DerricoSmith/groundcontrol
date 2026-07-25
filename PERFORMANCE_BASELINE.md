# Performance baseline

Captured 2026-07-25 for v1.0.1. Local production build against Neon. Recorded so a future change can be compared rather than guessed at.

## Build output

26 routes. Public marketing pages prerendered as static, demo and authenticated pages server rendered on demand.

## Route classification

| Route | Type |
| --- | --- |
| `/`, `/about`, `/services`, `/trust`, `/privacy`, `/terms`, `/ground-control`, `/showcase` | Static |
| `/demo` and all demo subroutes | Dynamic |
| All authenticated routes | Dynamic |
| `/api/health`, `/api/demo/refresh` | Dynamic |

## Query profile

| Page | Queries | Shape |
| --- | --- | --- |
| Demo Mission Control | 8 | Parallel, one summary aggregate plus account list |
| Demo Portfolio | 2 | Organization lookup plus account list with relations |
| Demo Account Detail | 3 | Account with nine relations, then health and metrics in parallel |
| Demo Executive Brief | 2 | Organization plus brief with sections |
| Customer Portfolio | 2 | Paginated list plus count |

## Assets

Nine demo screenshots totalling about 1.9 MB on disk, served optimized and responsive through `next/image`. Three self-hosted font families. No third-party scripts, no analytics, no tag manager.

## Test suite timing

| Suite | Duration |
| --- | --- |
| Vitest, 260 tests | about 160 seconds against network Postgres |
| Playwright, 49 tests | about 100 seconds |

The Vitest figure is the accepted cost of production parity, recorded in DECISIONS.md.

## Not measured

No Lighthouse run, no Core Web Vitals field data, no load test, and no cold start distribution. Stated rather than estimated.

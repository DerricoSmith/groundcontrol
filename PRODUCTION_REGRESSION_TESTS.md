# Production regression tests

Checks run against the live production URL after every deploy. They are deliberately cheap so there is no excuse to skip them.

## Public surface

| Check | Expected |
| --- | --- |
| `/` | 200, hero renders |
| `/showcase` | 200, screenshots load |
| `/ground-control` | 200 |
| `/about`, `/services`, `/trust`, `/contact`, `/privacy`, `/terms` | 200 |
| `/login`, `/signup` | 200 |
| `/robots.txt` | 200, disallows authenticated prefixes |
| `/sitemap.xml` | 200, no authenticated path |
| `/api/health` | 200, status ok, database ok |

## Demo

| Check | Expected |
| --- | --- |
| `/demo` | 200, populated, non-zero portfolio |
| `/demo/accounts` | 200, 14 accounts |
| `/demo/accounts/harborline` | 200, component evidence renders |
| `/demo/risks`, `/demo/renewals`, `/demo/actions`, `/demo/brief` | 200, populated |
| `/demo/accounts/<unknown>` | 404 |
| Fictional-data notice | Present on every demo page |

## Security

| Check | Expected |
| --- | --- |
| Protected routes unauthenticated | 307 to `/login` |
| Security headers on `/` | CSP, nosniff, DENY, referrer policy present |
| Authenticated prefix | `X-Robots-Tag: noindex` |
| `POST /api/demo/refresh` without secret | 401 or 404 |

## Data

| Check | Expected |
| --- | --- |
| Tenant isolation script | All checks pass |
| Demo organization | Exactly one, flagged `isDemo` |
| Smoke artifacts | None present |

## Portfolio preservation

| Check | Expected |
| --- | --- |
| Remote `main` | `f51b264721d5b16272a2d07cb90032ad247356cf` |
| `groundcontrol-six.vercel.app` | 200 |
| Vercel projects | Two, on separate branches |

## Cleanup

Any record created by a smoke test is removed in a final step. See PRODUCTION_SMOKE_TESTS.md for the cleanup protocol introduced in v1.0.1.

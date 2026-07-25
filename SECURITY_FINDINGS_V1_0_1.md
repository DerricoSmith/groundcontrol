# Security findings, v1.0.1

Findings from the focused review, with disposition. Full context in SECURITY_REVIEW.md.

## Fixed

| ID | Severity | Finding | Fix | Test |
| --- | --- | --- | --- | --- |
| SF-01 | High | Preview deployments used the production database | Preview moved to `gc_preview` with a separate auth secret | `scripts/verify-database-separation.mjs` |
| SF-02 | High | No security headers or content security policy | Added in `next.config.ts` | `e2e/security.spec.ts` |
| SF-03 | Medium | Authenticated routes relied on per-page metadata to avoid indexing | `X-Robots-Tag` by path prefix plus `robots.txt` | `e2e/security.spec.ts` |
| SF-04 | Medium | Check-then-create race in onboarding crashed the request, surfacing a stack trace path | Insert and catch the unique violation | `tests/integration/onboarding-service.test.ts` |
| SF-05 | Low | No health endpoint | `/api/health`, deliberately uninformative | `e2e/security.spec.ts` |
| SF-06 | Low | Three production dependency advisories resolvable by a patch upgrade | `next` 16.2.11 to 16.2.12 | Full suite revalidated |

## Accepted, documented

| ID | Severity | Finding | Why accepted |
| --- | --- | --- | --- |
| SA-01 | Medium | Row Level Security not enabled | Requires routing every tenant-scoped read through an interactive transaction. Wrong risk for a hardening release. Application scoping is real and tested. |
| SA-02 | Medium | CSP allows `'unsafe-inline'` and `'unsafe-eval'` for scripts | Needs a nonce threaded through the App Router. Documented rather than implied to be strict. |
| SA-03 | Medium | No rate limiting on auth or import endpoints | Pilot scale, no public signup incentive. Must not survive first real traffic. |
| SA-04 | Low | Preview and production share a Neon instance and role | No Neon API credential available. Schema isolation is genuine; instance isolation is not. |
| SA-05 | Low | CSV formula injection not mitigated on export | No customer-facing export path exists yet. Must be fixed before one ships. |
| SA-06 | Low | `sharp` advisories via `next` | No image is ever accepted from a user. Not reachable. |
| SA-07 | Low | No monitoring or alerting provider | Paid vendor decision. Vercel captures errors. |

## Not claimed

This application is not certified, has not been penetration tested, and has not been reviewed by a security professional. The review above is a structured self-assessment by the team that wrote the code, which is the weakest form of review and is labelled as such.

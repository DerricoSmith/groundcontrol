# Security test plan

What the automated security tests assert and why each exists.

## Where

`e2e/security.spec.ts`, 19 tests, run as part of `npm run test:e2e`.

## Headers

| Assertion | Regression it prevents |
| --- | --- |
| `X-Content-Type-Options: nosniff` present | MIME sniffing |
| `X-Frame-Options: DENY` present | Clickjacking |
| `Referrer-Policy` present | Leaking full URLs cross-origin |
| `Permissions-Policy` denies camera | Capability grants creeping in |
| CSP contains default-src, frame-ancestors, object-src, form-action, base-uri | A directive silently dropped |

Individual directives are asserted rather than the whole string, so the policy can evolve without the test becoming a copy of it.

## Indexing

- Authenticated prefixes carry `X-Robots-Tag: noindex`
- `robots.txt` disallows the authenticated surface and `/api/`
- The sitemap lists public pages and contains no authenticated path

## Protected routes

Ten authenticated routes each assert an unauthenticated visitor is redirected to login. A new route added under a protected prefix that forgets its guard is caught here.

## Public demo isolation

- An unknown account identifier returns 404, so no URL manipulation reaches another organization
- Demo pages contain zero forms and zero submit controls, so there is no write path reachable without authentication
- Every demo page discloses that the data is fictional

## Health endpoint

Reports status and database reachability, and its serialized body contains no reference to postgres, neon, or a schema, and no version field. An unauthenticated endpoint should not describe the system to someone deciding whether to attack it.

## Seed refresh route

Rejects a request without the secret, accepting either 401 when configured or 404 when disabled. What matters is that it never succeeds.

## Not covered by automated tests

Rate limiting, CSV formula injection on export, session fixation, and password reset, the last two because neither feature exists yet. Recorded in SECURITY_REVIEW.md rather than implied by omission.

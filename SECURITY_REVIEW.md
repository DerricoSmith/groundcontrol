# Security review

Reviewed 2026-07-25 for v1.0.1. This records what was checked, what was found, what was fixed, and what remains. It does not claim the application is secure.

## Findings fixed in v1.0.1

| Severity | Finding | Fix |
| --- | --- | --- |
| High | No security headers. No CSP, no `X-Frame-Options`, no `nosniff`, no HSTS, no referrer policy. | All added in `next.config.ts`, asserted by `e2e/security.spec.ts` against real responses. |
| High | Preview deployments used the production database, so a preview build could write to live data. | Preview moved to the `gc_preview` schema with its own auth secret. `scripts/verify-database-separation.mjs` fails the release if they collide again. |
| Medium | Authenticated routes relied on per-page metadata to stay out of search indexes. | `X-Robots-Tag: noindex` applied by path prefix in `next.config.ts`, plus `robots.txt`. A new route under an existing prefix is covered automatically. |
| Medium | A check-then-create race in onboarding entry crashed the request under concurrency, returning a stack trace path to the user. | Insert-and-catch on the unique violation, with a concurrency regression test. |
| Low | No health endpoint, so liveness could not be checked without loading a page. | `/api/health` added, deliberately uninformative about the infrastructure. |

## Reviewed and found acceptable

**Authentication.** Auth.js v5, credentials provider, bcrypt at cost 10. JWT session cookies, `httpOnly`, `secure` in production, `sameSite=lax`, signed with a secret that differs between preview and production. Wrong password and unknown email return the same message, so the form is not a user enumeration oracle.

**Authorization.** A role permission matrix in `src/lib/auth/permissions.ts` with `assertCan` called inside services, not in pages. A page that forgets a check still cannot perform the action.

**Tenant isolation.** Non-nullable `organizationId` on every tenant-owned table, scoped in the service layer. Tested by Vitest and by `scripts/verify-tenant-isolation.mjs` against production across seven entity types. Server actions resolve the organization from the session, never from a client-supplied id.

**Owner assignment.** `assignAction` and `assignEscalation` verify the supplied user is a member of the acting organization before writing. A client-supplied user id is never trusted.

**Public demo isolation.** Server rendered, read only, resolving its organization from a constant slug that must also carry `isDemo`. No route parameter can point it at a real organization. `e2e/security.spec.ts` asserts the demo pages contain no forms or submit controls.

**Invitations.** Cryptographically random tokens, single use, time limited, email bound, revocable. Acceptance verifies the invited address matches the accepting account.

**Membership removal.** Access is lost immediately because the session resolves membership per request rather than trusting a cached claim. Covered by an end-to-end test.

**CSV import.** Size cap, row cap, extension check, no path traversal in filenames, per-row validation, and cross-organization matching prevented by the single `AccountMatcher` choke point. Files are parsed in memory and not persisted.

**Injection.** All queries go through Prisma's parameterized client. The three raw statements are the test truncations and the health check; each validates its schema name against a strict pattern and none interpolates user input.

**Cross-site scripting.** React escapes by default and the codebase contains no `dangerouslySetInnerHTML`.

**Cross-site request forgery.** Next.js server actions carry origin checks, and `form-action 'self'` plus `frame-ancestors 'none'` are set.

**Secrets.** No secret in any client bundle. The only `NEXT_PUBLIC_*` variable is a public URL. The AI provider is called server side, so a key cannot reach a browser request.

**Error handling.** The lead form returns a generic message and logs the detail server side. Internal errors are not surfaced to anonymous visitors.

## Residual risks, accepted for this release

**Row Level Security is written but not enabled.** See below.

**Rate limiting is minimal.** The lead form suppresses duplicate submissions from one address within a minute and uses a honeypot. Login, signup, and import endpoints are not rate limited. At pilot scale with no public sign-up incentive this is a tolerable risk; it should not survive first real customer traffic.

**CSP allows `'unsafe-inline'` and `'unsafe-eval'` for scripts.** Next.js bootstraps with inline scripts and the theme provider sets the colour scheme before paint. Tightening this needs a nonce threaded through the App Router. Recorded in `CONTENT_SECURITY_POLICY.md`.

**Preview and production share a database instance.** Separate schemas, separate credentials in the connection string, but the same Neon instance and role. See `PRODUCTION_DATABASE.md`.

**No monitoring provider.** Vercel captures errors. Nothing alerts.

**CSV formula injection is not yet mitigated on export.** Imports are validated, but the error report CSV does not prefix cells beginning with `=`, `+`, `-`, or `@`. No customer-facing export path exists yet, so nothing currently reaches a spreadsheet, but this must be fixed before one ships.

## Row Level Security status

**Not enabled.** Policies exist in `prisma/rls-postgres.sql`.

The blocker is architectural rather than a matter of effort. RLS needs a per-request organization context in the database session, typically `SET LOCAL app.current_organization_id`. Prisma's connection pool hands out connections per query, so a `SET LOCAL` outside an explicit interactive transaction can land on a different connection than the query it was meant to scope. Making this reliable means routing every tenant-scoped read through an interactive transaction, which changes the shape of every service function and materially affects performance on a serverless deployment against a pooled connection.

Attempting that in a hardening release, on the one part of the system whose failure mode is cross-tenant data exposure, is the wrong risk. The application-layer scoping is real, tested against production, and remains mandatory.

**Future design:** move tenant-scoped reads behind a single `withOrganization(organizationId, fn)` helper that opens an interactive transaction, sets the local variable, and runs the callback. Prove it in preview against the full test suite before production. Until then the trust page says the database-level backstop is not active, because it is not.

## Dependency review

See `DEPENDENCY_REVIEW.md`.

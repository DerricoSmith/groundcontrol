# Known limitations

Written to be checkable. Anything not built says so.

## Product

- **CSV import only.** No native integration with any CRM, support platform, billing system, or product analytics tool. Those are roadmap items and are described as such everywhere they appear.
- **One risk rule is permanently unavailable.** `payment_risk` requires billing data that no import provides. It stays in the catalog and reports itself unavailable rather than being hidden.
- **The business outcomes health component is inert.** Goal tracking and success plans are not built, so it always carries zero confidence and is excluded from every score by the weight redistribution logic.
- **The renewal forecast is not predictive.** It is a rule-based confidence category with its contributing factors shown. No validated model backs it and the product never calls it a prediction.
- **No customer communication is sent.** Drafting exists; sending does not.
- **No automated brief delivery.** No email, no Slack, no scheduling.
- **Guided Setup and Assisted Setup onboarding paths are not built.** Quick Start is the only working path; the others are visible in onboarding and labeled unavailable.
- **Voice of Customer is limited to what support ticket and interaction data already supports.** There is no theme confirmation workflow yet.

## AI

- The AI service layer is complete and runs on its deterministic fallback in production, because no `ANTHROPIC_API_KEY` is configured. Every AI-labeled output in production is deterministic composition, and the interface says so.
- Adding a key is a paid vendor decision and has not been made. The product is fully functional without one, which is the point of the design.

## Security and compliance

- **No formal certification.** Signal & State does not hold SOC 2, ISO 27001, or HIPAA certification and does not claim readiness for any of them.
- **Postgres Row Level Security is written but not enabled.** `prisma/rls-postgres.sql` exists. Application-layer tenant scoping is enforced in every service and verified by both the Vitest suite and `scripts/verify-tenant-isolation.mjs` against production. The database-level backstop is a defense-in-depth layer that has not been switched on, and the product does not claim it is.
- **No rate limiting beyond the lead form.** The contact form suppresses duplicate submissions per address within a minute and uses a honeypot. Login, signup, and import endpoints are not rate limited. This must not survive first real customer traffic.
- **The content security policy allows `'unsafe-inline'` and `'unsafe-eval'` for scripts**, because Next.js bootstraps with inline scripts and the theme provider runs before paint. Tightening it needs a nonce threaded through the App Router. See `CONTENT_SECURITY_POLICY.md`, which states the weakness rather than implying the policy is strict.
- **CSV formula injection is not mitigated on export.** Imports are validated, but the error report CSV does not prefix cells beginning with `=`, `+`, `-`, or `@`. No customer-facing export path exists yet; this must be fixed before one ships.
- **No monitoring provider.** Structured server logging is in place and Vercel captures runtime errors. No Sentry or equivalent is connected, because that is a paid vendor decision.

## Operations

- **Preview and production share a Neon instance**, separated by Postgres schema (`gc_preview` versus `public`) with separate auth secrets. That is a genuine namespace boundary, not instance isolation: they share compute, storage quota, and a database role. Upgrading to a Neon branch needs a Neon API key. Fixed the sharing in v1.0.1; the shared instance remains.
- **No custom domain.** The release runs on the Vercel production URL. Nothing was purchased.
- **Test suite takes about three minutes** because it runs against network Postgres rather than local SQLite. A deliberate trade for production parity, recorded in `DECISIONS.md`.
- **Preview deployments are behind Vercel SSO**, so they cannot be smoke tested over plain HTTP. Preview correctness is verified through the database and the separation script instead.
- **Neon suspends an idle compute**, so the first request to the demo after a quiet period pays a wake penalty. Scripts warm their connections; the application does not.

*Resolved in v1.0.1: the demo seed no longer fails on a first run. The cause was an invalid enum value, not a cold start. See `PRODUCTION_SEED.md`.*

## Accessibility

Automated coverage exists as of v1.0.1: 19 axe-core tests, zero critical, zero serious. **No screen reader testing has been done**, which is the largest remaining gap. No third-party audit, no WCAG conformance claim, `prefers-reduced-motion` not implemented, and form help text not programmatically associated. Full list in `ACCESSIBILITY_KNOWN_LIMITATIONS.md`.

## Testing

29 of 34 required test categories are fully covered. Five are partial: lead capture, lead privacy, contact spam protection, and demo seed idempotency are implemented and verified in production or by the seed's own checks, but lack dedicated automated tests. Detail in `TEST_COVERAGE_MATRIX.md`.

## Documentation

Complete as of v1.0.1. All 25 required release documents exist, plus 21 additional ones. `RELEASE_DOCUMENTATION_INDEX.md` records which were verified against the running system rather than merely written.

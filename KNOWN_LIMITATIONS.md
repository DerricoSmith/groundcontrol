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
- **No rate limiting beyond the lead form.** The contact form suppresses duplicate submissions per address within a minute and uses a honeypot. Import endpoints validate size and type but are not rate limited.
- **No monitoring provider.** Structured server logging is in place and Vercel captures runtime errors. No Sentry or equivalent is connected, because that is a paid vendor decision.

## Operations

- **The demo seed occasionally fails on its first run against a cold database** and succeeds on retry. It is idempotent, so a retry is safe and self-healing, but the underlying cold-start timeout has not been diagnosed.
- **No custom domain.** The release runs on the Vercel production URL. Nothing was purchased.
- **Test suite takes about three minutes** because it runs against network Postgres rather than local SQLite. That was a deliberate trade for production parity, recorded in `DECISIONS.md`.
- **Preview deployments share the production database.** `DATABASE_URL` is set for both production and preview. A separate preview database should be provisioned before anyone other than Rico is pushing branches.

## Documentation

The release documentation set specified for this milestone is partially complete. `FINISH_LINE_PLAN.md`, `LIVE_URLS.md`, `PRODUCTION_SMOKE_TESTS.md`, `KNOWN_LIMITATIONS.md`, `ROLLBACK_PLAN.md`, `PORTFOLIO_LINK_SNIPPET.md`, `RELEASE_NOTES_V1.md`, and the updated `DECISIONS.md` exist. The remaining audience and review documents named in the release plan are not yet written, and are listed in `RELEASE_PROGRESS.md` as outstanding rather than being claimed as done.

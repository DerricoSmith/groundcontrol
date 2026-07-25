# Onboarding known limitations

Honest record of what the onboarding experience does and does not do, as of this build. Referenced from the onboarding UI itself (footer link text, several step pages) rather than left implicit.

## What works end to end

Quick Start, fully, verified live in-browser twice with two different data shapes: sign up → goals + path → organization profile → choose data path → import Customer Accounts (real CSV upload, parse, validate, dedupe) → defer or confirm renewal data → review data readiness → activate the recommended health model → review risk rules (only the ones your data can support) → configure or skip the Executive Brief → invite or skip team members → review and activate → first-value page (real insight, real Executive Brief preview) → Mission Control with a working Setup Checklist.

## Not built this pass

- **Guided Setup, Signal & State Assisted Setup, and Explore Demo** are not implemented. Their options appear on the Welcome step, visibly disabled with "Not available in this local build yet."
- **Customer Operating Model** (lifecycle stages, segments, tiers editor) is not built as its own step or data model. A few adjacent questions are folded into the Organization Profile step instead.
- **Renewal data entry** — no manual entry form and no dedicated renewal CSV importer. The only paths are: renewal dates arrive bundled in the Customer Account CSV, or the organization defers and adds them later (not yet built either).
- **Optional data imports** (product usage, support tickets, customer interactions, customer contacts) — none are built. This is also why 11 of the 12 risk rules in the catalog show "Not usable yet": they're honestly unavailable, not hidden.
- **Custom health model weight editing** — activation always uses the recommended 30/20/20/20/10 weights. The service layer (`activateHealthModel`) already accepts custom weights; there's no UI to set them yet.
- **Get help from Signal & State** — no request workflow exists. Every onboarding page's footer link is inert and says so.
- **Role-specific orientation** for invited Executives/CS Managers/Analysts/Viewers/Consultants is not built. Only Owners, Administrators, and Signal & State Consultants are routed into onboarding at all — everyone else skips it entirely and lands in Mission Control. This satisfies "don't force an invited viewer through admin setup" but does not yet give them a tailored tour.
- **Consultant Assisted Setup** access grants, revocation, and internal/client-visible notes are not built.
- **Onboarding diagnostics page** for consultants is not built.
- **Local analytics dashboard** — events are tracked and sanitized (`OnboardingEvent`), but nothing renders them yet.
- **Accessibility**: manual spot-checks only (keyboard navigation through the Quick Start forms, visible focus states from the base-ui component library) — no automated accessibility test suite, no formal audit.
- **Postgres Row Level Security** remains unverified locally — see `LOCAL_POSTGRES_SETUP.md`.

## Known rough edges (fixed once, worth watching for regressions)

Two real bugs were found and fixed while verifying this flow live in the browser, both now covered by regression tests:

1. Visiting an already-completed step's URL was silently rewinding onboarding progress back to that step. Fixed by making the step-navigation guard read-only (`canNavigateToStep`) instead of mutating state as a side effect of rendering — see `tests/unit/onboarding-progress.test.ts`.
2. The "review_and_activate" step could never satisfy its own required-step check, since nothing marked it complete before the check ran. Fixed by completing that step as part of the activation action itself — see `tests/integration/onboarding-service.test.ts`.

## Data honesty

No onboarding step fabricates data. Health scores are not computed per-account in this pass (would require usage/support data this build doesn't import) — "activating" a health model validates and persists the weight configuration only. First-value insights and the Executive Brief preview are assembled only from facts genuinely present in `CustomerAccount` records — see `first-insight-service.ts` and `executive-brief-service.ts`.

# Onboarding architecture

This document originally described a data-model-and-service-layer-only pass with no UI. **That's no longer accurate — the Quick Start UI now exists and works end to end**, verified live in-browser (see `LOCAL_BUILD_PROGRESS.md`). What follows below (the step registry, service functions, permission model) is still the accurate architecture description; it just now has a real UI built against it instead of being a foundation waiting for one. See `ONBOARDING_KNOWN_LIMITATIONS.md` for exactly what is and isn't built — Guided Setup, Assisted Setup, and Explore Demo remain unimplemented, along with several other pieces of the founder's full brief (a 14-step flow, role-specific orientation for every role, twelve pieces of onboarding documentation, and more).

## Why a smaller model than the nine suggested entities

The founder's brief suggested `OnboardingSession`, `OnboardingStepState`, `OrganizationSetupProfile`, `OnboardingGoal`, `SetupChecklistItem`, `ProductTourState`, `OnboardingEvent`, `OnboardingTemplate`, `OnboardingRecommendation` — nine entities — but also said explicitly: *"Do not add every suggested entity automatically. Choose the smallest coherent model that supports the required workflows."*

Three entities were built:

| Entity | Why it's real now |
|---|---|
| `OnboardingSession` | One per organization. Holds path, status, current step, and completed/skipped step arrays. Everything the service layer's start/resume/complete/skip/progress logic needs. |
| `SetupChecklistItem` | The persistent checklist that survives after onboarding completes (Mission Control, org settings, and the consultant workspace all need to read the same checklist later — this is the one piece of "post-onboarding" state that has to exist now even without a UI, so the shape is settled). |
| `OnboardingEvent` | Local-only analytics. Append-only, sanitized metadata (see below). |

Six were deliberately **not** built:

| Entity | Why not yet |
|---|---|
| `OnboardingStepState` | Would be a DB row per step per session. With no wizard UI to drive granular per-step audit history yet, `OnboardingSession.completedSteps`/`skippedSteps` (string-key arrays validated against a code-level step registry) capture everything the service layer actually needs. Worth splitting out if/when steps need their own timestamps, retry counts, or validation-error history. |
| `OrganizationSetupProfile` | This is the *content* of the "organization profile" step (company name, industry, ARR range, etc.) — modeling it now, before any form exists to collect it, would mean guessing at fields nobody has validated against a real screen. |
| `OnboardingGoal` | Modeled as a fixed TypeScript union (`ONBOARDING_GOALS` in `onboarding-service.ts`) instead of a table — goals are a closed, code-defined list, not user-extensible data, so a table would only add a join for no benefit. |
| `ProductTourState` | No product tour UI exists. |
| `OnboardingTemplate` | No template system exists yet (industry-specific lifecycle templates, etc.) — the one place the founder's spec mentions a template ("example lifecycle template") is presentational copy, not stored data. |
| `OnboardingRecommendation` | `recommendNextStep()` in the service layer already computes this deterministically from the step registry; there's nothing to store until recommendations become AI-generated (Phase 8+) rather than rule-based. |

## What was built

### Step registry (`src/lib/services/onboarding-service.ts`)

`ONBOARDING_STEPS` is a code-level, ordered list of ten steps — smaller than the founder's 14-step Guided Setup flow (some of the founder's steps are collapsed together — e.g. product usage/support/interaction imports are represented by the single optional `renewal_data` step rather than three separate steps, since there's no import UI yet to differentiate them). Each step declares:

- `key` — stable identifier referenced by session state.
- `label` — human-readable name.
- `required` — whether onboarding can complete without it.
- `allowedRoles` — which of the eight roles may complete or skip it (this is the "role-specific onboarding paths" requirement, implemented as data rather than separate UI routes).

This is the single source of truth every service function validates against. There is no database table for steps — adding a step means editing this array, not writing a migration.

### Service functions

Session lifecycle: `startOrResumeOnboarding`, `selectOnboardingPath`, `setOnboardingGoals`, `completeStep`, `skipStep`, `returnToStep`, `completeOnboarding`, `reopenOnboarding`, `resetDemoOnboarding` (guarded — throws for any non-demo organization).

Pure calculations (no DB access, directly unit-tested): `calculateProgress`, `recommendNextStep`, `validateReadyToComplete`.

Checklist: `upsertChecklistItem`, `resolveChecklistItem`, `getSetupChecklist`, `calculateSetupReadiness` (returns the founder's own four-label vocabulary — Ready / Usable / Limited / Needs Attention — reused here for setup readiness the same way it's used for CSV data readiness elsewhere in the spec).

Analytics: `trackOnboardingEvent`, with `sanitizeEventMetadata()` stripping a fixed set of sensitive key names (`name`, `email`, `revenue`, `notes`, etc.) before anything is written — a defensive check, not just a convention, so a future caller can't accidentally leak customer data into an event even if they try.

Other: `determineFirstValueMoment` (currently: has the organization loaded at least one `CustomerAccount`).

### Permissions

A new capability, `manage_onboarding`, was added to `src/lib/auth/permissions.ts` (`OWNER`, `ADMINISTRATOR`, `SIGNAL_STATE_CONSULTANT`) — gating path selection, completing onboarding, and reopening it. Per-step role gating uses the registry's `allowedRoles`, not this capability, so an invited `CS_MANAGER` can complete the steps relevant to them (e.g. `import_customer_accounts`) without needing organization-wide admin rights — this is what "invited users should not be trapped in an owner setup wizard they cannot complete" means in code.

### Tests

`tests/unit/onboarding-progress.test.ts` — pure-function tests for progress calculation, next-step recommendation, and completion readiness.

`tests/integration/onboarding-service.test.ts` — 20 tests covering: session creation, resume (no duplicate session), organization scoping (a second org's session and progress never leaks into the first), step persistence across reads, required-step-cannot-be-skipped, optional-step-can-be-skipped, role-gated step completion (including a consultant completing an owner-gated step — the "assisted setup" case), return-to-step guarding against skipping ahead, path selection permission, invalid goal rejection, completion blocked until required steps are done, completion permission, reopen requiring prior completion, demo-only reset (and its rejection for a real organization), checklist creation/resolution driving setup readiness through all four labels, first-value-moment detection, and a direct assertion that no stored event ever contains a sensitive key.

## The UI layer (added this pass)

Route structure: `/onboarding` (redirects to the current step), `/onboarding/[step]` (one dynamic route rendering a different component per step key — not eleven separate page files, per the founder's "don't duplicate business logic in components, use clear server/client boundaries" instruction), `/onboarding/first-value` (the post-activation experience). A dedicated `src/app/onboarding/layout.tsx` provides the shell (progress bar, org identity, save-and-continue-later) — deliberately separate from the regular `(app)` route group's sidebar/topbar shell, since onboarding is a distinct guided session, not a normal product page.

Entry logic lives in one place: `mission-control/page.tsx` redirects any `OWNER`/`ADMINISTRATOR`/`SIGNAL_STATE_CONSULTANT` whose onboarding isn't `COMPLETED` to `/onboarding`. Every other role skips onboarding entirely. This is the only gate — `/organization/members`, `/customers`, and other app-shell pages render normally regardless of onboarding state, which is also what makes them usable as stable test/reference points during onboarding.

Four new services support the steps that need more than the core onboarding state machine:

- **`csv-import-service.ts`** — a dependency-free CSV parser, per-row validation (name required; revenue/currency/date/health validated but optional), case-insensitive duplicate detection against both the database and the current file, and a commit function that creates a `DataSource` + `CustomerAccount` rows + an audit event. `csv-templates.ts` holds the two pure functions (sample file, error report) that the client-side import component needs, kept out of the main service file specifically so importing them never pulls `server-only` and Prisma into the browser bundle.
- **`risk-rule-service.ts`** — a twelve-rule catalog (`RISK_RULE_CATALOG`), each with a real `isAvailable()` check. Eleven rules honestly report "not usable yet" because this build doesn't import the product usage, support, interaction, or stakeholder data they need. Only `missing_renewal_date` is computable from `CustomerAccount` alone, and activating it creates real `RiskSignal` rows (idempotently — re-activating skips accounts that already have an open signal of that category).
- **`organization-setup-service.ts`** — saves the organization profile, activates the health model (validates weights via the existing `health-score-service.ts`, never computes per-account scores since there's no usage data to score from), and saves Executive Brief preferences.
- **`first-insight-service.ts`** and **`executive-brief-service.ts`** — deterministic, rule-based only. Every sentence traces back to a real query against `CustomerAccount`/`RiskSignal`. No AI service layer exists yet, so nothing here claims to be AI-generated, and nothing fabricates a signal the data doesn't support.

## What this unblocks next

The actual onboarding wizard (Phase 6 in the founder's ordering: `/onboarding` route, the 14-step Guided Setup screens, Quick Start, Explore Demo, the first-value UI sequence) can now be built as a UI layer that calls these already-tested service functions, rather than needing to invent both the UI and the state model at the same time. `OrganizationSetupProfile` and `OnboardingStepState` are the most likely entities to get added once that UI exists and reveals what data those screens actually need to persist.

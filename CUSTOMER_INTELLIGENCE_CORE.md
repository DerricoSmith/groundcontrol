# Customer Intelligence Core

What Ground Control can assess today, how it assesses it, and what it deliberately refuses to claim.

This document covers the phase that closed the gap where 11 of 12 risk rules had no data to run on. It is the reference for anyone asking "where did this number come from."

## The outcome this phase targets

> A customer can bring its essential Customer Success data into Ground Control, receive a complete and explainable health assessment, identify real customer risks, manage renewal preparation, assign actions, and understand why each account needs attention.

## The rule that governs everything below

Missing information is never treated as good news. Concretely:

- A component with no supporting data scores a neutral baseline of 50 **and carries a confidence of 0**, and its weight is redistributed across the components that do have evidence. The score is not padded; the gap is disclosed.
- An account whose health has never been calculated shows **Not assessed**, not Stable. `CustomerAccount.healthCalculatedAt` is null until a real calculation runs, and the Portfolio, Mission Control, and Executive Brief all read that field rather than the storage default.
- An organization that has never run data quality detection reads **Not Evaluated**, not Ready. `Organization.dataQualityEvaluatedAt` is null until detection runs.
- Data freshness has a distinct `MISSING` state. A category with no records is never reported as current.
- A risk rule that lacks its required data is reported as unavailable, with the reason, rather than silently passing.
- No risk is raised from absence. An account with zero contacts and zero interactions does not get an "executive sponsor disengagement" risk; it gets a data quality issue saying the relationship picture is absent.

## Data the product accepts

| Entity | Import | Duplicate handling |
| --- | --- | --- |
| Customer accounts | CSV | Matched by external id, then name, within the organization |
| Customer contacts | CSV | Merged by email; roles are unioned, never replaced |
| Renewals | CSV | Never overwritten; duplicates by external id or account plus date are skipped |
| Product usage summaries | CSV | Historical periods are never overwritten; unique per account and period |
| Support tickets | CSV | Deduplicated by external ticket id and **updated** on re-import, because tickets genuinely change state |
| Customer interactions | CSV | Deduplicated by external id; sentiment is only ever imported, never inferred |
| Escalations | Entered by a person in the product | Not importable; an escalation is a human claim |

Every importer runs through `src/lib/services/import/import-runner.ts`, which creates the `DataSource`, records an `ImportJob` with row counts and a structured error report, and writes a `data_imported` audit event. Imports are **not** transactional; a partial import is reported as a partial import.

Account matching for every importer goes through `AccountMatcher` (`src/lib/services/import/account-matcher.ts`), which is scoped to one organization and refuses to match when two accounts share a name.

## Health scoring

Model version `health-v2-2026-07`. Five weighted components:

| Component | Evidence it reads |
| --- | --- |
| Product adoption | `ProductUsageSummary` periods: active users, licensed seats, seat utilization, last activity |
| Customer relationship | `CustomerContact` roles and `CustomerInteraction` recency, executive and champion participation |
| Support experience | `SupportTicket` volume, priority, reopens, resolution time, satisfaction, plus open escalations |
| Commercial position | Renewal proximity, renewal status, forecast category, whether a renewal plan exists |
| Business outcomes | Nothing yet. Goal tracking and success plans are out of scope for this release, so this component always carries confidence 0 and is excluded from the weighted score. |

Categories: Strong 80+, Stable 65+, Watch 50+, At Risk 35+, Critical below 35. Thresholds and weights are per-organization overridable via `HealthModelVersion`.

Every calculation writes a `HealthScoreSnapshot` carrying the previous score, the previous category, a plain-language change reason naming the component that moved most, and the full component breakdown. That snapshot history is what "What changed" on Mission Control reads.

## Risk rules

Rule version `risk-v2-2026-07`. Twelve rules, of which eleven can run once the corresponding data is imported. `payment_risk` is permanently unavailable and says so: it requires billing data that no import or integration provides yet, and no payment data is fabricated to fill the gap.

Each rule declares its key, label, category, purpose, required data, an availability check, and an unavailable reason. `evaluateOrganizationRisks()`:

- Records a `RiskEvaluationRun` with accounts evaluated and rules skipped.
- Updates rather than duplicates, keyed on `(customerAccountId, ruleKey)`.
- Auto-resolves a signal whose rule stops triggering.
- **Never reopens a risk a person dismissed or accepted.**
- Tracks direction by comparing severity against the previous evaluation.

Every signal stores the six-part explanation: current state, what changed, supporting evidence, potential impact, recommended action, confidence.

Revenue exposure is counted **once per account**. An account with six open risks contributes its ARR once, not six times.

## Renewals

`RENEWAL_MILESTONES` is a fixed list of eleven. `calculateForecastConfidence()` returns a score, the per-factor contributions, and a plain-language explanation — never a bare percentage. Forecast changes are append-only in `RenewalForecastChange`. Closing a renewal as churned requires a reason.

The forecast is a **rule-based confidence category, not a prediction**. Nothing in this release is described as predictive.

## Actions

Seventeen action types. `generateSuggestedActions()` creates at most one suggestion per `(account, risk rule)` via `suggestionKey`, carries the originating risk's evidence verbatim, and never buries the user in duplicates across repeated evaluations.

- Assigning a suggested action promotes it to OPEN. Assignment validates that the owner is a real member of the organization; a client-supplied user id is never trusted.
- Blocking an action requires a reason.
- Every status change writes an `ActionStatusChange` with who made it, plus an audit event.

No action sends anything to a customer. Ground Control drafts and tracks; a human communicates.

## Escalations

Entered by people, tracked by the product. Categories, severities, and a six-state status. Closing requires a resolution summary. `revenueExposure` is the account's ARR — the revenue in the room, explicitly **not** a predicted loss, and the UI says so.

Customer communication state is recorded, not performed. Ground Control never contacts a customer.

## Data quality and freshness

Twelve detection categories. `detectDataQualityIssues()` is re-runnable: it upserts, auto-resolves what no longer applies, and respects issues a person dismissed. Dismissal requires a reason.

`getDataQualitySummary()` returns one of **Ready / Usable / Limited / Needs Attention / Not Evaluated** together with the reasons that produced it.

`getDataFreshness()` reports CURRENT / AGING / STALE / MISSING / UNKNOWN per category against a per-organization expectation.

## Where each screen gets its numbers

| Screen | Source |
| --- | --- |
| Mission Control | `getPortfolioSummary()` plus `getDataQualitySummary()` |
| Customer Portfolio | Direct org-scoped query with fixed saved views, sorting, and pagination |
| Account Detail | `calculateAccountHealth()` and `getAccountMetrics()`, calculated live, plus stored snapshots |
| Risk Radar | Stored `RiskSignal` rows from the last evaluation run |
| Renewal Center | Stored `Renewal` rows plus `calculateForecastConfidence()` |
| Actions | Stored `RecommendedAction` rows |
| Escalations | Stored `Escalation` rows plus `getEscalationSummary()` |
| Data Quality | Stored `DataQualityIssue` rows plus the summary |
| Executive Brief | `buildBriefSections()`, which composes all of the above |

## What is not built

- No AI service layer. The Executive Brief is assembled from counts, sums, and rules; its final section says so explicitly.
- No billing data, so no payment risk.
- No goal tracking or success plans, so the business outcomes health component is inert.
- No customer-facing communication of any kind.
- No integrations. CSV import only.
- Postgres row-level security is written (`prisma/rls-postgres.sql`) but unverified locally, because Docker is unavailable in this environment. Tenant isolation is enforced and tested at the service layer today.

## Local demo data

`node scripts/seed-demo-org.mjs` creates one clearly labeled demo organization with five accounts, including one deliberately incomplete account, so the whole surface can be exercised without a real customer's data. It never touches an existing organization and never deletes anything. See `DEMO_DATA.md`.

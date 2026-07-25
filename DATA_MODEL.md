# Data Model

This documents the **target** data model (all conceptual entities requested for the platform) and marks what is **implemented** in the current schema (`prisma/schema.prisma`) versus **planned** for a later phase. See `IMPLEMENTATION_PLAN.md` for phase sequencing.

Status legend: ✅ implemented · 🚧 planned, not yet in schema

## Tenancy rule

Every tenant-owned table has a non-nullable `organizationId`. No exceptions. No query against a tenant-owned table runs without an organization scope — enforced at the service layer *and* at the database layer via Postgres RLS (`SECURITY.md`). Rows that logically belong to a `CustomerAccount` also carry `organizationId` directly (denormalized on purpose) so RLS policies never have to join through a parent table to know who owns a row.

## Fields that separate "unknown" from "fine"

Two nullable timestamps exist specifically so the product cannot present a storage default as an assessment. Both are load-bearing; do not remove them or read around them.

| Field | Meaning when null |
|---|---|
| `CustomerAccount.healthCalculatedAt` | Health has never been calculated for this account. `healthCategory` still holds its schema default (`STABLE`), which is **not** an assessment. The UI must show "Not assessed", and the account must be excluded from health distributions. |
| `Organization.dataQualityEvaluatedAt` | Data quality detection has never run for this organization. `getDataQualitySummary()` returns the state **Not Evaluated**, never "Ready". |

## Identity & access

| Entity | Status | Notes |
|---|---|---|
| Organization | ✅ | The Signal & State client (an ICP company using Ground Control), or the internal Signal & State org itself |
| User | ✅ | A person; extended from the old single-tenant `User` with email verification fields |
| Membership | ✅ | Join of User ↔ Organization with a Role; a user can belong to more than one org (e.g. a consultant) |
| OrganizationInvitation | ✅ | Token-based invite: single-use, time-limited (7 days), email-bound, revocable/resendable — see `invitation-service.ts` |
| OnboardingSession | ✅ | One per organization; path/status/progress — see `onboarding-service.ts` and `ONBOARDING_ARCHITECTURE.md` |
| SetupChecklistItem | ✅ | Persistent post-onboarding checklist, org-scoped, required/optional, auto-resolved where derivable from real data |
| OnboardingEvent | ✅ | Local-only analytics; sanitized metadata, never sent to a real provider |
| OrganizationSetupProfile | ✅ | Company profile answers + health model / risk rule / Executive Brief configuration state, one per organization |
| ExecutiveBrief | ✅ | Deterministic, rule-based brief (no AI layer yet) — see `executive-brief-service.ts` |
| ExecutiveBriefSection | ✅ | Ordered sections belonging to an ExecutiveBrief |
| Role | ✅ | Enum: `owner`, `administrator`, `executive`, `cs_leader`, `cs_manager`, `analyst`, `viewer`, `signal_state_consultant` — see `SECURITY.md` for the permission matrix |
| Team | 🚧 | Grouping of Users within an org for ownership/workload views |

## Customer domain

| Entity | Status | Notes |
|---|---|---|
| CustomerAccount | ✅ | The company the *organization's* customer sells to. Core fields: name, segment, tier, ownerId, ARR, currency, renewal date |
| CustomerContact | 🚧 | Person at a CustomerAccount |
| Contract | 🚧 | Commercial agreement; source of ARR/term |
| Subscription | 🚧 | Billing-system mirror of what's being paid for |
| Renewal | ✅ | One row per renewal cycle; forecast category + confidence |
| CustomerSegment | 🚧 | Org-defined segmentation dimension |
| CustomerTier | 🚧 | Org-defined tier (e.g. Enterprise/Mid-Market/SMB) |
| Relationship | 🚧 | Aggregate relationship state for an account |
| Stakeholder | 🚧 | A contact's role in the relationship (champion, economic buyer, blocker, executive sponsor) |

## Signals & evidence

| Entity | Status | Notes |
|---|---|---|
| ProductUsageEvent | 🚧 | Raw usage event (from CSV or usage integration) |
| ProductUsageSummary | 🚧 | Rolled-up usage per account per period — this is what the UI reads, not raw events |
| SupportTicket | 🚧 | Imported/synced ticket |
| CustomerInteraction | 🚧 | Meeting, call, or logged touchpoint |
| Meeting | 🚧 | Scheduled/occurred meeting |
| MeetingNote | 🚧 | Notes attached to a Meeting, source for VoC |
| EmailInteraction | 🚧 | Metadata only unless explicit permission for content analysis |
| SurveyResponse | 🚧 | NPS/CSAT/CHS survey response |

## Health, risk, and opportunity

| Entity | Status | Notes |
|---|---|---|
| HealthScore | ✅ | Deterministic, versioned, one row per calculation |
| HealthScoreComponent | ✅ | Adoption/Relationship/Support/Commercial/Outcomes sub-scores with weight + confidence |
| RiskSignal | ✅ | See `RISK_CATEGORIES` in schema comments; always has an explanation (`SECURITY.md`/`PRODUCT.md` format) |
| OpportunitySignal | 🚧 | Expansion/cross-sell/advocacy/reference etc. |
| AdvocacySignal | 🚧 | Subtype of opportunity focused on reference/case-study fit |

## Feedback

| Entity | Status | Notes |
|---|---|---|
| CustomerFeedbackItem | 🚧 | Atomic piece of feedback (ticket, note excerpt, survey comment) |
| FeedbackTheme | 🚧 | AI-assisted grouping of feedback items; **never auto-confirmed** — a human reviews/merges/dismisses |

## Action & operating layer

| Entity | Status | Notes |
|---|---|---|
| RecommendedAction | ✅ | The unit of "what should happen next"; always has evidence + reason |
| AssignedTask | ✅ | Alias/specialization of RecommendedAction once assigned+accepted (see schema — modeled as one table with status, not two) |
| Escalation | 🚧 | Elevated risk requiring cross-functional or executive involvement |
| ExecutiveBrief | 🚧 | Weekly generated summary; stored as structured sections, not just a text blob |
| PortfolioSnapshot | 🚧 | Point-in-time rollup used to compute week-over-week movement |

## Operations & platform

| Entity | Status | Notes |
|---|---|---|
| ImportJob | ✅ | CSV import run: file, mapping, status, error report |
| IntegrationConnection | 🚧 | OAuth/API-key connection to an external system |
| IntegrationEvent | 🚧 | Log of sync activity for a connection |
| Workflow / WorkflowRun | 🚧 | Scheduled/event-triggered background job + its execution log |
| AuditEvent | ✅ | Append-only; see `SECURITY.md` for the required event types |
| Notification | 🚧 | In-app/email/Slack notification instance |
| Comment | 🚧 | Threaded comment on Risk/Action/Account |
| Attachment | 🚧 | File metadata; binary in object storage, never in Postgres |
| SavedView | 🚧 | Persisted Portfolio filter/sort/column configuration |
| DataSource | ✅ | Provenance tag ("csv:2024-05-01", "hubspot", "manual") attached to records for data-confidence scoring |
| DataQualityIssue | 🚧 | Detected data problem, see `PRODUCT.md` Data Quality |
| CustomFieldDefinition / CustomFieldValue | 🚧 | Org-defined extensibility, deferred until a real client needs it |

## AI layer

| Entity | Status | Notes |
|---|---|---|
| AIAnalysisRecord | 🚧 | Every model call, in/out, cost, review state — see `SECURITY.md` §AI |
| AIEvidenceReference | 🚧 | Links an AIAnalysisRecord's claims to the source rows that justify them |

## Billing (Stripe-ready, not wired)

| Entity | Status | Notes |
|---|---|---|
| BillingCustomer | 🚧 | Mirrors Stripe customer; `stripeCustomerId` |
| BillingSubscription | 🚧 | Mirrors Stripe subscription; plan, status, trial, period |
| WebhookEvent | 🚧 | Raw Stripe webhook log for replay/debugging |

## Sales/leads (public site)

| Entity | Status | Notes |
|---|---|---|
| Lead | ✅ | Public-site form submission; status pipeline in `PRODUCT.md` |

## Consultant/engagement (internal workspace)

| Entity | Status | Notes |
|---|---|---|
| ClientEngagement | 🚧 | Signal & State's own engagement record for a client org (Sprint/Managed/Fractional) |
| SprintWorkspace | 🚧 | Structured Customer Intelligence Sprint findings + report |

## Why some entities are 🚧 in this pass

The founder's own priority order is: security → tenant isolation → data correctness → clear customer value → executive usefulness → consultant efficiency → reliability → ease of use → polish → extensibility. Phase 3–5 (`IMPLEMENTATION_PLAN.md`) implement the entities that make Mission Control, Customer Portfolio, Account Detail, Risk Radar, Renewal Center, and Executive Briefs real and correct. Entities that only support integrations, workflow automation, or custom fields are schema-designed here but not migrated until the phase that needs them — adding a Prisma model with no reader or writer is dead weight and a security review liability (an unused table is still a table RLS has to be written for).

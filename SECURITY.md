# Security

This document is implementation-level, not marketing copy. The public-facing trust page (`/trust` on the marketing site) is written from this document and must never claim more than what's true here.

## Priority order

Per the founder's explicit instruction, when any two concerns conflict: **security → tenant isolation → data correctness → clear customer value → executive usefulness → consultant efficiency → reliability → ease of use → visual polish → future extensibility.** Nothing overrides the first three.

## Authentication

- Auth.js v5, Credentials provider, JWT session strategy.
- Passwords hashed with bcrypt (cost factor 10, matching the existing implementation).
- **Planned before pilot use**: email verification on sign-up (unverified accounts get a reduced-trust banner and cannot invite teammates or connect integrations), password reset via signed, single-use, expiring token emailed to the account address, optional TOTP MFA gated behind `Owner`/`Administrator` role requirement for org settings changes.
- Session cookies: `httpOnly`, `secure` in production, `sameSite=lax`.
- Rate limiting on `/api/auth/*` and any credential-checking endpoint (planned: token-bucket per IP + per email, backed by the same Postgres instance — no new infra required at this scale).

## Authorization & roles

Roles (see `DATA_MODEL.md` → Membership): `Owner`, `Administrator`, `Executive`, `Customer Success Leader`, `Customer Success Manager`, `Analyst`, `Viewer`, `Signal & State Consultant`.

| Capability | Owner | Admin | Executive | CS Leader | CS Manager | Analyst | Viewer | Consultant |
|---|---|---|---|---|---|---|---|---|
| View portfolio/accounts | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓* |
| Edit account data | ✓ | ✓ | – | ✓ | ✓ | – | – | ✓* |
| Assign/complete actions | ✓ | ✓ | – | ✓ | ✓ | – | – | ✓* |
| Approve external communication | ✓ | ✓ | ✓ | ✓ | – | – | – | – |
| Change health model weights | ✓ | ✓ | – | ✓ | – | – | – | ✓* |
| Override a health score | ✓ | ✓ | – | ✓ | ✓ | – | – | ✓* |
| Generate/approve Executive Brief | ✓ | ✓ | ✓ | ✓ | – | – | – | – |
| Invite/remove members | ✓ | ✓ | – | – | – | – | – | – |
| Change member roles | ✓ | ✓ | – | – | – | – | – | – |
| Connect/disconnect integrations | ✓ | ✓ | – | – | – | – | – | ✓* |
| Delete organization data | ✓ | – | – | – | – | – | – | – |
| View audit log | ✓ | ✓ | ✓ | ✓ | – | – | – | ✓* |
| Access internal consultant workspace | – | – | – | – | – | – | – | ✓ (Signal & State org only) |

`✓*` = only while holding an active, explicitly granted, logged, and revocable consultant grant on that specific organization (see Consultant Access below). A consultant has **no** access to any client organization by default.

This matrix is enforced in a single `lib/auth/permissions.ts` policy module — UI never hides a control as its only protection; every mutating service function re-checks the permission server-side.

## Tenant isolation

Two independent layers, because application code alone is not a defensible boundary for a company handling other companies' customer data:

1. **Service layer**: every service function requires an `organizationId` (derived from session, never from client-supplied input for mutations) and every Prisma query includes `where: { organizationId }`.
2. **Database layer (Postgres Row-Level Security)**: every tenant-owned table has RLS enabled with a policy that compares the row's `organization_id` to the current session's org, set via `SET LOCAL app.current_org_id` at the start of each request's transaction. This means a bug that forgets the `where` clause in a service function **still cannot** return another org's rows — the database refuses them.

RLS policy pattern applied to every tenant-owned table:

```sql
alter table customer_account enable row level security;
create policy tenant_isolation on customer_account
  using (organization_id = current_setting('app.current_org_id')::text);
```

**Required tests** (see `TESTING.md`): a suite that creates two organizations, seeds each with data, authenticates as a member of Org A, and asserts every list/detail query returns zero rows belonging to Org B — both through the service layer and via a raw query that deliberately skips the service layer, to prove RLS itself (not just app code) is doing the work.

## Consultant access

- A Signal & State consultant has **no standing access** to any client organization.
- Access is granted per-organization via an explicit `ConsultantGrant` record: who granted it, who received it, scope, and an expiry.
- Every grant and every action taken under it is written to the audit log, and the audit log is visible to the client organization's Owner/Administrator — a client can always see if and when a consultant looked at their data.
- Grants are revocable immediately by the client org's Owner.
- A consultant never "impersonates" a client user; they act as themselves, with a visible "Signal & State Consultant" badge on every UI surface, and every write is attributed to them, not to a client user.

## AI usage rules

- All model calls go through one AI service layer (`lib/ai/*`) — never called directly from a page, component, or route handler.
- Every AI call is versioned (prompt template version + model identifier) and stored as an `AIAnalysisRecord` with: organization, customer account (if applicable), prompt version, model, input references (not full raw payload — see below), structured output, confidence, timestamps, review state, approval state, errors, token/cost estimate where available, and `AIEvidenceReference` rows linking claims to source data.
- **Input minimization**: send the smallest evidence set that supports the task (e.g., a handful of relevant support tickets and a usage delta, not a customer's entire interaction history). Never send full personal contact records when a risk explanation doesn't require them.
- **Output validation**: every model response is parsed against a strict schema (zod) before it is stored or shown. Unparseable or out-of-schema output is treated as a failure with a fallback state, never silently coerced into the UI.
- **No secret prompts sent to the browser** — prompt templates live server-side only.
- **No consequential customer action without human approval** — AI may draft a recommended action or a customer email; it cannot assign, send, or execute one. Draft → human review → approve/edit/reject is the only path to anything customer-facing.
- The AI is required to label its own output type — fact, calculation, interpretation, recommendation, or assumption — and the UI renders that label. See `PRODUCT.md` for the required risk-explanation format.
- Client data is **not** used to train any third-party model. This is a real, load-bearing claim on the trust page — it is enforced by using API calls (not fine-tuning) against the Anthropic API with data-retention settings set to the provider's shortest/no-training option once a live key is configured.

## Data confidence

Never let a user mistake missing data for a healthy customer. Every account carries a computed `dataConfidence` considering freshness, completeness, source count, missing required fields, conflicting records, and whether usage/support/contract data exists at all. Low confidence is shown next to the health score, not hidden.

## Input handling

- All external input (forms, CSV rows, webhook payloads, AI output) validated with zod before touching the database.
- Output encoding handled by React by default; any `dangerouslySetInnerHTML` usage (none currently) requires a sanitizer and a code-review flag.
- File uploads (CSV, attachments): restricted by MIME type and extension, size-capped, scanned for the expected structure before parsing, stored outside the web root / in object storage (not committed to the repo, not served from `/public`).
- CSRF: Next.js Server Actions carry same-origin protections by default in this Next version; state-changing route handlers additionally check `Origin`/`Referer` where applicable.

## Secrets

- No secret is ever imported into a Client Component or sent to the browser. `NEXT_PUBLIC_*` variables are the *only* variables allowed in client bundles, and none of them may be a credential — see `ENVIRONMENT.md` for the full list and which side each is available on.
- Third-party credentials (Stripe, Anthropic, Resend, integration OAuth tokens) live in server-only env vars or, for per-organization integration credentials, encrypted at rest in the database with a server-held encryption key — never in plaintext, never returned by any API response.

## Audit log

Append-only `AuditEvent` table. Required event types (from the founder's list): login, logout, org creation, user invitation, role change, data import, data deletion, health model change, health score override, risk creation/update/resolution, action assignment/completion, escalation opened/updated/resolved, brief generation/approval/delivery, integration connect/disconnect, consultant access granted/revoked, AI analysis generation, AI output approval, export creation, org setting change. Audit rows never store sensitive values (e.g., "password reset requested" not "password changed to X").

## Data lifecycle

- **Retention**: tenant data retained for the life of the organization; soft-deleted records purged after a defined grace period (documented, not yet automated in phase 1).
- **Organization deletion workflow**: Owner-initiated, requires confirmation, cascades through all tenant-owned tables, is itself an audited event, and cannot be triggered by a consultant.
- **User deletion**: removes membership and PII, retains audit-log references in anonymized form (so the audit trail isn't destroyed by removing the actor).
- **Data export**: an org Owner/Administrator can request a full export of their organization's data.
- **Integration revocation**: disconnecting an integration immediately invalidates the stored credential and stops future syncs; it does not retroactively delete already-imported data (that's a separate, explicit action).

## Environment separation

Local / Preview / Staging / Production are distinct environments with distinct databases and distinct secrets (see `ENVIRONMENT.md`). The **demo organization** is a real organization row, isolated by RLS exactly like any other — it does not get special-cased application logic, which is the actual guarantee that demo data can't leak into a production customer's view (see `DEMO_DATA.md`).

## What we do not claim

Signal & State and Ground Control are **not** SOC 2 certified, ISO 27001 certified, or HIPAA attested. The trust page states this plainly: *"Ground Control is being designed around modern security and privacy practices. Formal certification work will follow as the company grows."* Do not let marketing copy, sales conversation talking points, or UI microcopy imply otherwise.

## Startup validation

The application validates required environment variables at boot (`lib/env.ts`) and fails loudly and safely — refusing to start rather than running with an undefined `AUTH_SECRET` or database URL.

## Dependency and access review

Dependencies reviewed on a normal cadence via `npm audit` / Dependabot-equivalent (to configure once the repo is hosted with CI). Production access (Vercel project, database, Stripe/Anthropic/Resend dashboards) limited to the founder until a technical co-founder or employee is hired, at which point access review becomes a recurring item.

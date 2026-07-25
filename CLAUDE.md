@AGENTS.md

# Signal & State / Ground Control — agent guide

Read this before making any change. It is the fastest path to acting like a member of the founding team rather than a contractor guessing at intent.

## The company

**Signal & State** turns customer signals into action. It is a customer intelligence and CX/Customer Success transformation company: consulting (Customer Intelligence Sprint, Managed Customer Intelligence, Fractional Customer Executive Advisory) plus the software that powers and eventually productizes that delivery.

## The product

**Ground Control** gives growing B2B software companies a clear view of customer health, renewal risk, adoption, escalation context, feedback, and expansion opportunity — and the action that should happen next. Outcome: **see risk earlier, know what to do next.**

## The target customer

Founder-led/growth-stage B2B software companies, ~$2M–$30M ARR, 15–150 employees, 1–10 person CS team, data scattered across HubSpot/Salesforce + Stripe-like billing + Zendesk/Intercom + a separate analytics tool, no CS Ops leader, no reliable renewal forecast, inconsistent health scoring. See `PRODUCT.md` for the full profile and the 18 executive questions the product must answer.

## Product principles (non-negotiable)

1. Explain every score. 2. Show evidence. 3. Prioritize action over reporting. 4. Protect customer trust. 5. Preserve human judgment. 6. Reduce operational noise. 7. Make executive information concise. 8. Never hide uncertainty. 9. Build for consultants first, then self-service. 10. Solve the smallest valuable problem before expanding.

## Architecture

Next.js (App Router) + TypeScript + React + Tailwind v4 + shadcn/ui-on-base-ui + Prisma + Postgres (SQLite locally) + Auth.js v5. Modular monolith: server-only service modules in `src/lib/services/*`, not microservices — see `ARCHITECTURE.md` for the full boundary list and `DECISIONS.md` for why Supabase-as-platform isn't adopted yet. Full audit and target architecture: `ARCHITECTURE.md`. Full entity list and status: `DATA_MODEL.md`.

## Coding conventions

- Explicit types everywhere; no `any` — use zod-validated `unknown` at external boundaries (CSV, AI output, webhooks).
- Server/client boundary is absolute: Prisma, secrets, and the AI service layer never touch a Client Component.
- Every mutation goes through a service function, never a raw Prisma call from a page/route.
- Small, focused modules; comments explain *why*, not *what*.
- Match `DESIGN_SYSTEM.md`'s language guide in code identifiers, not just copy.

## Data ownership rules

Every tenant-owned table has a non-nullable `organizationId`. Every query is org-scoped in the service layer *and* backstopped by Postgres Row-Level Security — never rely on application code alone for tenant isolation. See `SECURITY.md` and `DATA_MODEL.md`.

## Security rules

No secret in client code — only `NEXT_PUBLIC_*` vars reach the browser, and none of them are ever a credential. Validate all external input. No consequential customer action without human approval — AI drafts, a human sends. Every material action is audited (`SECURITY.md` has the required event list). Do not claim SOC 2 or any compliance certification that hasn't been earned — use: *"Ground Control is being designed around modern security and privacy practices. Formal certification work will follow as the company grows."*

## AI usage rules

One AI service layer (`src/lib/ai/*`) — never call a model from a page or component. Every call is versioned, logged as an `AIAnalysisRecord` with evidence references, and schema-validated before storage. Distinguish fact / calculation / interpretation / recommendation / assumption in output and in the UI. No feature is called "predictive" unless backed by a real, validated model — the phase-1 renewal forecast is a rule-based *confidence category*, not a prediction. No feature is called an "agent" unless it genuinely takes autonomous multi-step action. Until a live `ANTHROPIC_API_KEY` exists, AI features run on a disclosed deterministic fallback (`DECISIONS.md`) — never a fabricated-sounding output.

## Design principles

Executive, editorial, calm, technically credible — a control room crossed with a business publication, not a generic SaaS template and not an entertainment brand. One brand accent (indigo); a separate five-step health color scale that is never reused for anything else. No decorative charts. No color-only meaning. Full system: `DESIGN_SYSTEM.md`.

## Content voice

Direct, calm, experienced, human, clear, executive, useful, confident. No lorem ipsum, ever. Banned words: revolutionary, game-changing, cutting-edge, seamless, supercharge, unlock the power, next-generation, transformative solution, "at the intersection of," "AI-powered" as a reflex prefix. Full guide: `DESIGN_SYSTEM.md` → Content & Language.

## Testing requirements

The founder's twelve priority tests (tenant isolation, consultant access control, deterministic scoring, weight validation, revenue-at-risk correctness, renewal date correctness, import duplicate prevention, AI output validation, communication-approval gating, secret exposure, audit coverage, demo-data isolation) gate every release. Full list and patterns: `TESTING.md`.

## Deployment expectations

Vercel, Postgres in every non-local environment, environment variables validated at boot and never hard-coded domains. Full guide: `ENVIRONMENT.md`.

## Prohibited shortcuts

No fake metrics in production paths. No secrets in the client. No unexplained AI output. No autonomous customer-facing communication. No lorem ipsum. No generic AI-template language. No decorative dashboard-card wall. No decorative charts where a number is clearer. No unearned compliance claims. No unnecessary abstraction or service created for appearance rather than need. No feature outside the current phase's launch scope (`IMPLEMENTATION_PLAN.md`) without a recorded reason.

## Current priorities

See `IMPLEMENTATION_PLAN.md` for the full twelve-phase sequence and live status. As of this writing: Phase 1 (this documentation set) is complete; Phase 3 (multi-tenant organization model + RLS) is in progress; Phase 2 (public website) and Phases 4–12 have not started.

## How to safely make changes

1. Read the relevant doc(s) above before touching code in that area.
2. Check `DECISIONS.md` — a relevant call may already be made and reasoned through.
3. If a change meets one of the ten founder-decision triggers (brand ownership, legal exposure, client data handling, paid vendor selection, destructive data changes, major architectural migration, public pricing, external communication to a real person, production credentials, an unreversible choice) — stop and ask, don't infer.
4. Otherwise, make the smallest testable change, run the checks in `CONTRIBUTING.md`, update `CHANGELOG.md` and `DECISIONS.md` as needed, and report using: Completed / In progress / Next / Risks / Founder decisions needed.

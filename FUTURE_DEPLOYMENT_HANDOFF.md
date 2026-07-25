# Future deployment handoff (preparation only — do not execute)

This document describes how Signal & State / Ground Control should eventually be deployed once the founder explicitly approves it. Nothing in this document is executed by this build. No Vercel CLI command has been run, no project has been linked or modified, and no production environment variable has been touched.

## Target architecture

1. **Existing Vercel project remains the Ground Control portfolio experience** — unchanged, untouched, still serving the existing job-application portfolio at its current domain.
2. **New Vercel project** hosts the commercial Signal & State website and Ground Control application.
3. New project uses a **separate production database** (Postgres — Vercel Postgres, Neon, or Railway are all consistent with the existing stack decisions in `DECISIONS.md`; no specific vendor is chosen here since that's a paid-vendor-selection decision reserved for the founder).
4. New project uses **separate authentication secrets** (`AUTH_SECRET` generated fresh via `npx auth secret`, never reused from local dev).
5. New project uses **separate email credentials** (Resend or Postmark — see `ENVIRONMENT.md`).
6. New project uses **separate analytics credentials**.
7. New project uses **separate error monitoring configuration** (Sentry DSN scoped to the new project).
8. New project uses **separate Stripe configuration** (test mode until the founder approves going live; live keys never touch this repository directly — Vercel environment variables only).
9. New project uses a **separate domain** (e.g. a Signal & State domain/subdomain distinct from the portfolio's).
10. **No production deployment occurs until the founder explicitly approves it.** This document is preparation, not an action.

## Why a separate project, not a shared one

Sharing the existing Vercel project would risk the portfolio deployment on every commercial-app change (build failures, env var collisions, domain routing conflicts) and would mix a live job-search asset with an early-stage commercial product's blast radius. A separate project has independent build/deploy history, independent environment variables, and can fail or be torn down without any risk to the portfolio.

## What "handoff" will look like when approved

1. Founder creates a new Vercel project (or authorizes creation) pointed at this repository, on a dedicated branch or a fork/mirror — not `main`, to avoid the portfolio's existing project auto-deploying commercial commits.
2. Founder provisions a production Postgres database and supplies its connection string as a Vercel environment variable on the *new* project only.
3. `prisma/schema.prisma`'s datasource is switched from `sqlite` to `postgresql` for that environment (see `PRODUCTION_MIGRATION_PLAN.md` once written).
4. `prisma/rls-postgres.sql` policies are applied to that production database.
5. Environment variables in `ENVIRONMENT.md` are set on the new project, scoped appropriately (see `ENVIRONMENT.md`'s environment table).
6. A preview deployment is reviewed by the founder before any production promotion.
7. DNS/domain is pointed at the new project once approved.

None of steps 1–7 have been performed. This file exists so that when the founder is ready, the plan is already written down instead of decided ad hoc.

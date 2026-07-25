# Environment

## Environments

| Environment | Purpose | Database | Notes |
|---|---|---|---|
| Local | Development on a laptop | SQLite (`prisma/dev.db`) | Zero external accounts required |
| Preview | Per-PR Vercel preview | A shared preview Postgres branch (Neon branching or equivalent) | Never contains real client data |
| Staging | Pre-production validation | Dedicated Postgres instance | Mirrors production config, synthetic/demo data only |
| Production | Live application | Dedicated Postgres instance | Real client data; access restricted per `SECURITY.md` |

## Required variables

| Variable | Available to | Required in | Description |
|---|---|---|---|
| `DATABASE_URL` | Server only | All | Postgres (prod/staging/preview) or `file:./dev.db` (local) connection string |
| `AUTH_SECRET` | Server only | All | Auth.js JWT signing secret — generate with `npx auth secret` |
| `NEXT_PUBLIC_APP_URL` | Client + server | All | Ground Control app origin, e.g. `https://app.signalsandstate.com` |
| `NEXT_PUBLIC_SITE_URL` | Client + server | All | Public marketing site origin, e.g. `https://signalsandstate.com` |

## Variables required for features to activate (not required to boot)

The application boots and the demo/CSV-import path works with **none** of these set — each feature they unlock stays in its documented fallback state (see `DECISIONS.md`) until configured.

| Variable | Available to | Unlocks |
|---|---|---|
| `ANTHROPIC_API_KEY` | Server only | Real AI analysis calls (falls back to the deterministic, evidence-bound generator without it) |
| `RESEND_API_KEY` or `POSTMARK_SERVER_TOKEN` | Server only | Real transactional email (lead notifications, Executive Brief delivery, password reset) |
| `EMAIL_FROM_ADDRESS` | Server only | Verified sending address once an email provider is configured |
| `STRIPE_SECRET_KEY` | Server only | Real billing (Stripe customer/subscription sync) |
| `STRIPE_WEBHOOK_SECRET` | Server only | Stripe webhook signature verification |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client | Stripe Elements/Checkout on the client |
| `SENTRY_DSN` | Server only | Server-side error monitoring |
| `NEXT_PUBLIC_SENTRY_DSN` | Client | Client-side error monitoring |
| `NEXT_PUBLIC_ANALYTICS_KEY` | Client | Product analytics (tool TBD — see `DECISIONS.md`) |
| `SLACK_WEBHOOK_URL` | Server only | Slack notification delivery, per-organization if/when connected |
| `NEXT_PUBLIC_BOOKING_URL` | Client | External scheduling link for "Book a Conversation" (`DECISIONS.md` founder decision #4) |
| `ENCRYPTION_KEY` | Server only | At-rest encryption for stored integration credentials |

Any variable **not** prefixed `NEXT_PUBLIC_` is server-only by Next.js convention and must never be read from a Client Component — enforced by code review and by keeping all secret access inside `lib/` server-only modules (`SECURITY.md`).

## Startup validation

`lib/env.ts` validates required variables with zod at process start. Missing a required variable fails the boot with a clear message rather than an obscure runtime error later — "fail safely," not "fail silently" or "fail confusingly."

## Example file

See `.env.example` at the repository root — copy to `.env.local` (read by Next.js) and `.env` (read by the Prisma CLI) for local development. Never commit real values; `.env*` is gitignored except `.env.example`.

## Domains

Never hard-code a domain in application code. `signalsandstate.com` and `app.signalsandstate.com` are placeholders used in documentation and seed copy only, always sourced from `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_APP_URL` at runtime.

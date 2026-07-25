# Production architecture

How Ground Control runs in production, as of v1.0.1.

## Topology

```
GitHub  DerricoSmith/groundcontrol
  ├── main                        -> Vercel project "groundcontrol"        -> groundcontrol-six.vercel.app
  │                                  (the archived portfolio, untouched)
  └── signal-state-production     -> Vercel project "signal-and-state-ground-control"
                                     -> signal-and-state-ground-control.vercel.app
                                        └── Neon Postgres, schema "public"
```

Two Vercel projects, two branches, two databases. Neither can affect the other. The portfolio project is never deployed, configured, or referenced by any command in this repository's release process.

## Application

Next.js App Router on Node 24, deployed as Vercel serverless functions with static assets on the edge.

**Route groups.**

| Group | Purpose | Indexed |
| --- | --- | --- |
| `(public)` | Marketing site, showcase, and the public demo | Yes |
| `(app)` | Authenticated product, wrapped in the app shell | No, by header and by robots |
| `onboarding` | Its own shell, separate from the app chrome | No |
| `api` | Health, auth, and the guarded demo refresh | No |

**Rendering.** Public marketing pages are static. Demo pages and everything authenticated are dynamic, because they read the database per request and must never serve one organization's data from another's cache.

**Service layer.** All business logic lives in server-only modules under `src/lib/services`. No page, route handler, or component builds a database query directly. The `server-only` package enforces the boundary at build time rather than by convention, so Prisma, secrets, and the AI layer cannot reach a Client Component.

## Data

Prisma 6 against Postgres. One schema file, `prisma/schema.prisma`, targeting Postgres, with migrations in `prisma/migrations`. Local development, both test suites, preview, and production all run the same engine, which is what makes the tests meaningful.

| Environment | Schema |
| --- | --- |
| Production | `public` |
| Preview | `gc_preview` |
| Local development | `gc_dev` |
| Vitest | `gc_test` |
| Playwright | `gc_e2e` |

Tenancy is enforced by a non-nullable `organizationId` on every tenant-owned table plus service-layer scoping, verified by the Vitest suite and by `scripts/verify-tenant-isolation.mjs` against any live database. Postgres Row Level Security policies exist in `prisma/rls-postgres.sql` but are **not enabled**; see `SECURITY_REVIEW.md` for the reason and the future design.

## AI

`src/lib/ai/*` is the only place a model can be called. Three provider modes: `anthropic` when a server key exists, `deterministic` when it does not, and `disabled` when explicitly switched off. Production currently runs deterministic, because no key is configured.

Every call writes an `AIAnalysisRecord` with its prompt version, provider, evidence references, and human review state, plus an `AIUsageRecord` with tokens, estimated cost, and latency. No number the product reports is ever sourced from a model.

## Security posture

Security headers and a content security policy are applied to every response from `next.config.ts`. Authenticated route prefixes carry `X-Robots-Tag: noindex` by header as well as in `robots.txt`. Sessions are JWT cookies from Auth.js v5. Secrets exist only as Vercel environment variables and are never committed.

## Observability

Vercel captures runtime logs and errors. `/api/health` reports liveness, database reachability, and which environment the process believes it is in, deliberately without describing the infrastructure. No third-party monitoring provider is connected, because that is a paid vendor decision.

## What this architecture does not do yet

No native integrations, no background job runner, no queue, no caching layer, no read replica, and no multi-region deployment. None are needed at pilot scale, and adding them before there is load to justify them would be the wrong trade.

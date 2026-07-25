# Preview architecture

Preview deployments are branch builds on Vercel. Since v1.0.1 they are fully separated from production.

| | Production | Preview |
| --- | --- | --- |
| Branch | signal-state-production | any other branch |
| URL | signal-and-state-ground-control.vercel.app | per-deployment Vercel URL |
| Database schema | public | gc_preview |
| Auth secret | separate | separate |
| Demo data | seeded and refreshed | seeded |

## Why this matters

In v1.0.0 preview shared the production DATABASE_URL. A preview build running a migration, a seed, or a destructive script would have hit live data. Nothing bad happened, but the exposure was real and it was the most serious operational gap in that release.

## How separation is enforced

Environment variables scoped to Preview only in Vercel, plus `scripts/verify-database-separation.mjs`, which compares redacted host, database, and schema for every configured environment and exits non-zero if any two collide. It never prints a connection string.

Separate auth secrets mean a session issued by a preview deployment is not valid against production and vice versa.

## Limits

Preview and production share one Neon instance and one database role, separated by Postgres schema. That is a genuine namespace boundary, not instance isolation. See PRODUCTION_DATABASE.md for why and what the upgrade path is.

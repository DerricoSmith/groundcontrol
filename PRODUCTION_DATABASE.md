# Production database

## Provider

Neon Postgres, free tier, US East. Provisioned by the founder through the Vercel marketplace. Serverless with autosuspend, which is why scripts that touch it warm the connection before doing real work.

## Schemas

One Neon database, `neondb`, partitioned by Postgres schema.

| Schema | Environment | Reset policy |
| --- | --- | --- |
| `public` | Production | Never. No script in this repository can reset it. |
| `gc_preview` | Preview | Freely, via `scripts/reset-preview.mjs --confirm` |
| `gc_dev` | Local development | Freely |
| `gc_test` | Vitest | Truncated between every test file |
| `gc_e2e` | Playwright | Truncated and reseeded before every run |

### Why schemas rather than separate Neon databases

Creating a Neon branch or a second database needs the Neon API or console, and no Neon credential is available to the tooling here; only a connection string was supplied. Postgres schemas give a genuine namespace boundary that satisfies the requirement that preview data cannot affect production: preview tables are distinct objects, migrations apply per schema, and a query in one schema cannot read another's tables.

**Stated honestly:** this is schema-level isolation on a shared instance, not instance-level isolation. Preview and production share compute, storage quota, and a database role. A connection string can be edited to reach either. That is weaker than separate instances and is recorded in `KNOWN_LIMITATIONS.md`. The upgrade to a Neon branch is a single environment variable change once a Neon API key exists.

## Protections

Three independent guards, because the failure mode is destroying real data:

1. `scripts/with-db.mjs` refuses to run a command routed through `TEST_DATABASE_URL` or `E2E_DATABASE_URL` unless the target is a `gc_test` or `gc_e2e` schema.
2. `tests/helpers/setup-env.ts` refuses to start Vitest against anything that is not a test schema, because `resetTestDatabase()` truncates every table it can reach.
3. `scripts/reset-preview.mjs` and `scripts/reset-test-schema.mjs` validate the schema name against a strict pattern before it reaches any SQL.

`scripts/verify-database-separation.mjs` asserts that every configured environment resolves to a different target, and fails the release if Preview and Production ever collide again.

## Backup and recovery

Neon provides point-in-time restore on the free tier with a short retention window. That is the recovery mechanism; there is no separate backup job.

Recovery is cheap because the data is reproducible. Production currently contains one demo organization, which `scripts/seed-demo-org.mjs` recreates in under a minute, plus any real leads and organizations. There is no real customer data in production today.

## Migrations

See `PRODUCTION_MIGRATIONS.md`. `prisma migrate deploy` is the only migration command run against production. `db push --force-reset` and `migrate reset` are for test schemas and are blocked from reaching production by the guards above.

## Inspecting production safely

```bash
node scripts/verify-tenant-isolation.mjs
```

with `DATABASE_URL` pointed at production. Read-only, prints no credentials, and exits non-zero if isolation fails.

# Local PostgreSQL setup (for Row Level Security verification)

SQLite (`prisma/dev.db`) remains the default for day-to-day local development — it's zero-setup and every `npm run dev` / `npm run build` in this repo uses it. This document adds a **second, local-only** Postgres option so `prisma/rls-postgres.sql` can actually be exercised before commercial launch. SQLite cannot run this SQL at all — it has no concept of Postgres Row Level Security, roles, or `current_setting()`. Tenant isolation tests that run against SQLite are therefore only proving the *application-layer* `organizationId` filters, never the database-layer policy. Both layers matter; only Postgres can prove the second one.

**Status: prepared, not yet exercised.** Docker was not available in the environment this was written in (`docker` was not found on PATH), so the container has not actually been started or migrated against in this pass. The compose file, connection string, and workflow below are ready for whenever Docker is available locally.

## 1. Start local Postgres

```bash
docker compose -f docker-compose.local.yml up -d
```

This starts a throwaway `postgres:16-alpine` container on `127.0.0.1:5433`, isolated from anything remote — see `docker-compose.local.yml` for the exact (non-secret, local-only) credentials.

## 2. Point Prisma at it for a one-off run

Do **not** change `.env`/`.env.local` (those drive the SQLite workflow every other command relies on). Instead, use a separate env file:

```
# .env.postgres.local  (not committed; add to .gitignore if not already covered)
DATABASE_URL="postgresql://groundcontrol:local-dev-only-not-a-real-secret@127.0.0.1:5433/groundcontrol_local"
```

## 3. Switch the datasource provider for this run

`prisma/schema.prisma`'s `datasource db` block currently has `provider = "sqlite"`. Postgres-specific features (and the RLS policies) require `provider = "postgresql"`. Until this repo has two schema files or a templated schema, switch the provider locally, run the Postgres workflow, then switch it back before returning to SQLite-based work:

```bash
# 1. Edit prisma/schema.prisma: provider = "postgresql"
npx dotenv -e .env.postgres.local -- npx prisma migrate dev --name init
npx dotenv -e .env.postgres.local -- npx prisma db execute --file prisma/rls-postgres.sql
# ... run RLS verification / tenant isolation tests against Postgres here ...
# 2. Revert prisma/schema.prisma: provider = "sqlite"
npx prisma generate   # regenerate the client back to the SQLite-targeting shape
```

This friction is intentional and temporary — see "Next" in `LOCAL_BUILD_PROGRESS.md`. A cleaner long-term setup (e.g. a `DATABASE_PROVIDER` env-driven schema, or two generated clients) is future work, not yet built, so as not to destabilize the working SQLite path per the founder's explicit instruction.

## 4. Apply RLS policies

```bash
npx dotenv -e .env.postgres.local -- npx prisma db execute --file prisma/rls-postgres.sql
```

## 5. Row Level Security verification

RLS is only proven by attempting to violate it and having Postgres refuse, not by application code refusing. A real verification:

1. Seed two organizations (e.g. via `prisma/seed-test-orgs.ts`, see `TESTING.md`).
2. Open a raw `pg` connection as the **application role** (not the Postgres superuser — RLS policies are bypassed for table owners/superusers by default), run `SET app.current_org_id = '<org-a-id>'`, then attempt to `SELECT * FROM "CustomerAccount" WHERE "organizationId" = '<org-b-id>'` directly. A correctly-applied policy returns zero rows even though the row exists — Postgres itself is filtering it out, not the application.
3. Run this as an actual automated test (see `tests/integration/rls-postgres.test.ts` once written — not yet present in this pass) rather than a manual check, so this can't silently regress.

## 6. Tear down

```bash
docker compose -f docker-compose.local.yml down       # keep the volume
docker compose -f docker-compose.local.yml down -v     # wipe local Postgres data entirely
```

## The warning, stated plainly

**SQLite cannot enforce Postgres Row Level Security. Any tenant-isolation test that runs only against SQLite is proving application-layer correctness, not the database-layer backstop this product's `SECURITY.md` promises.** Both layers are required in the eventual commercial architecture — see `SECURITY.md` §Tenant isolation and `ARCHITECTURE.md` §4.

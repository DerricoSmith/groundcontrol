# Production migrations

## Current state

One migration: `20260725165055_initial_production_baseline`. It is the whole schema, generated when the project moved from SQLite `db push` to Postgres with real migration history during the v1.0.0 release.

Applied to `public` (production), `gc_preview`, `gc_dev`, `gc_test`, and `gc_e2e`.

## The only command that touches production

```bash
prisma migrate deploy
```

with `DATABASE_URL` pointed at production. It applies pending migrations and nothing else. It never drops, never resets, and never prompts.

**Never run against production:** `prisma migrate reset`, `prisma migrate dev`, or `prisma db push --force-reset`. The first two are destructive; the third recreates the schema. `scripts/with-db.mjs` blocks the test-routed variants from reaching a non-test schema, but nothing stops a human pasting the wrong `DATABASE_URL`, so the discipline matters.

## Adding a migration

1. Edit `prisma/schema.prisma`.
2. `npm run db:migrate:dev -- --name a_short_description` against `gc_dev`. This generates the SQL and applies it locally.
3. Review the generated SQL in `prisma/migrations`. Read it. Prisma will happily generate a destructive statement for a rename it interprets as a drop plus an add.
4. `npm test` and `npm run test:e2e`. Both push the schema to their own schemas first, so they exercise the change.
5. Apply to preview: `node scripts/with-db.mjs PREVIEW_DATABASE_URL npx prisma migrate deploy`.
6. Deploy preview and verify.
7. Apply to production, then deploy production.

Migrations go to the database **before** the code that depends on them is deployed. A deploy that expects a column the database does not have fails at runtime, per request, which is worse than a migration applied a few seconds early.

## Additive changes only, for now

Every migration so far is additive. Two nullable columns added during the Customer Intelligence Core phase, `CustomerAccount.healthCalculatedAt` and `Organization.dataQualityEvaluatedAt`, are load-bearing: null means "never assessed" and "never evaluated", which the product relies on to avoid presenting absence as good news. Do not backfill them with a default.

## Rolling back

There is no down migration. To reverse a schema change, write a new forward migration that undoes it. This is deliberate: a down migration that has never been tested is a false sense of safety.

For a code-level rollback that does not involve the schema, see `ROLLBACK_PLAN.md`.

## Verifying

```bash
npx prisma migrate status
```

with the target `DATABASE_URL`. It reports applied and pending migrations without changing anything.

# Preview database

Schema `gc_preview` on the same Neon instance as production.

## Setup

Already configured. `DATABASE_URL` in the Vercel Preview environment points at `...&schema=gc_preview`.

## Applying migrations

```bash
node scripts/with-db.mjs PREVIEW_DATABASE_URL npx prisma migrate deploy
```

## Seeding

```bash
node scripts/with-db.mjs PREVIEW_DATABASE_URL node scripts/seed-demo-org.mjs
```

Idempotent and self-verifying. See PRODUCTION_SEED.md.

## Verifying separation

```bash
node scripts/verify-database-separation.mjs
```

Fails if preview and production resolve to the same target.

## Resetting

See PREVIEW_RESET.md. Preview is disposable; production is not, and the reset script can only ever target `gc_preview`.

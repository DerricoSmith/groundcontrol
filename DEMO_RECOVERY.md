# Demo recovery

Rebuilding the demonstration environment from nothing.

## When

- The demo organization was deleted.
- Seed verification is failing.
- A new environment needs demo data.
- Preview was reset.

## Steps

1. Confirm which database you are targeting. This is the step people skip.

```bash
node scripts/verify-database-separation.mjs
```

2. Apply migrations.

```bash
node scripts/with-db.mjs PRODUCTION_DATABASE_URL npx prisma migrate deploy
```

3. Seed. Idempotent, so running it against a partially seeded database repairs it.

```bash
node scripts/with-db.mjs PRODUCTION_DATABASE_URL node scripts/seed-demo-org.mjs
```

The script verifies its own output and exits non-zero on a partial seed.

4. Populate derived intelligence: health scores, risks, actions, data quality, and the brief.

Either set `SEED_SECRET` in the environment and POST to `/api/demo/refresh` with the `x-seed-secret` header, then remove it. Or run a local dev server with `DATABASE_URL` pointed at the target and call `http://localhost:3000/api/demo/refresh`, which keeps the secret out of the deployed environment entirely. The second is what v1.0.1 used.

5. Verify.

```bash
node scripts/with-db.mjs PRODUCTION_DATABASE_URL node scripts/verify-tenant-isolation.mjs
```

Then open `/demo` and confirm Mission Control is populated.

## Expected state

14 accounts, 22 contacts, 13 renewals, 2 escalations, 16 tickets, 20 interactions, roughly 32 risks and 32 suggested actions, and one brief of about 15 sections. Risk and action counts vary slightly with the date because several rules are time relative.

## Time

Under two minutes. Nothing here is precious, which is the point of a seed being reproducible.

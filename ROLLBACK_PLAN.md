# Rollback plan

## The portfolio is not at risk

The portfolio and the commercial product are separate Vercel projects reading separate branches and separate databases. No rollback of the commercial release can affect the portfolio.

| | Portfolio | Signal & State |
| --- | --- | --- |
| Vercel project | `groundcontrol` | `signal-and-state-ground-control` |
| Branch | `main`, at `f51b264` | `signal-state-production` |
| URL | groundcontrol-six.vercel.app | signal-and-state-ground-control.vercel.app |
| Database | none | Neon Postgres |

## Roll back a bad deploy

Vercel keeps every deployment. To return to a known good one:

```bash
npx vercel@latest rollback --scope slow-or-fast
```

Or promote a specific earlier deployment:

```bash
npx vercel@latest promote <deployment-url> --scope slow-or-fast
```

This is instant and does not touch the database.

## Roll back a code change

```bash
git revert <sha>
git push origin signal-state-production
```

The Vercel project rebuilds from the branch.

## Roll back the whole release

```bash
git push origin --delete signal-state-production
```

Then delete the Vercel project from the dashboard. `main` and the portfolio deployment are untouched by both commands.

## Database

Migrations so far are a single additive baseline. There is nothing to roll back that would not simply drop the schema.

Neon provides point-in-time restore on the free tier with a short retention window. The demo data is fully reproducible from `scripts/seed-demo-org.mjs` plus the refresh pipeline, so losing it costs minutes, not data.

Real customer data does not exist yet. The only non-demo rows are the smoke test organization and one smoke test lead, both disposable.

**Never run a destructive Prisma command against production.** `migrate deploy` is the only migration command this project runs there. `db push --force-reset` and `migrate reset` are for the `gc_test` and `gc_e2e` schemas, and `scripts/with-db.mjs` refuses to point them anywhere else.

## Local recovery

The pre-commit working tree, all three database backups, and full restore instructions are at:

`../ground-control-local-checkpoints/20260725-precommit/`

All twelve required artifacts were verified present and non-empty before the first commit.

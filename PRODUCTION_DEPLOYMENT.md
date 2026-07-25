# Production deployment

## Prerequisites

Local gates green: typecheck, lint, Vitest, Playwright including accessibility and security, production build.

## Sequence

1. Verify database separation.

```bash
node scripts/verify-database-separation.mjs
```

2. Apply migrations to preview, deploy preview, verify there first.

```bash
node scripts/with-db.mjs PREVIEW_DATABASE_URL npx prisma migrate deploy
npx vercel@latest deploy
```

3. Apply migrations to production. Schema before code, always.

```bash
node scripts/with-db.mjs PRODUCTION_DATABASE_URL npx prisma migrate deploy
```

4. Deploy production.

```bash
npx vercel@latest deploy --prod --yes
```

5. Run the smoke tests in PRODUCTION_SMOKE_TESTS.md.

6. Verify tenant isolation against production.

```bash
node scripts/with-db.mjs PRODUCTION_DATABASE_URL node scripts/verify-tenant-isolation.mjs
```

7. Confirm the portfolio is untouched: remote `main` still at `f51b264721d5b16272a2d07cb90032ad247356cf`, and `groundcontrol-six.vercel.app` returns 200.

8. Tag and push.

## Never

- Deploy the `groundcontrol` portfolio project.
- Merge or push to `main`.
- Force push any branch.
- Run a destructive Prisma command against production.
- Set an environment variable by piping a string in PowerShell. Use file redirection.

## If a deploy fails

Vercel keeps every deployment. `npx vercel@latest rollback` returns to the previous one instantly without touching the database. See ROLLBACK_PLAN.md.

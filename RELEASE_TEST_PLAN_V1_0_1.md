# Release test plan, v1.0.1

## Gate order

Each gate must pass before the next runs. A failure stops the release.

| # | Gate | Command |
| --- | --- | --- |
| 1 | Type checking | `npx tsc --noEmit` |
| 2 | Lint | `npm run lint` |
| 3 | Database separation | `node scripts/verify-database-separation.mjs` |
| 4 | Unit and integration | `npm test` |
| 5 | End to end, including accessibility and security | `npm run test:e2e` |
| 6 | Production build | `npm run build` |
| 7 | Preview migration | `node scripts/with-db.mjs PREVIEW_DATABASE_URL npx prisma migrate deploy` |
| 8 | Preview seed | `node scripts/with-db.mjs PREVIEW_DATABASE_URL node scripts/seed-demo-org.mjs` |
| 9 | Preview deploy and verify | `npx vercel@latest deploy` |
| 10 | Production migration | `node scripts/with-db.mjs PRODUCTION_DATABASE_URL npx prisma migrate deploy` |
| 11 | Production deploy | `npx vercel@latest deploy --prod --yes` |
| 12 | Production smoke tests | PRODUCTION_SMOKE_TESTS.md |
| 13 | Production tenant isolation | `node scripts/verify-tenant-isolation.mjs` |
| 14 | Portfolio preservation | Remote `main` SHA and portfolio URL |

## New for v1.0.1

Gates 3, 7, 8, and 13 are new, as are the accessibility and security suites inside gate 5.

## On failure

Diagnose, fix, add a regression test where practical, commit, push, redeploy, and rerun from the failed gate. Do not skip forward.

## Definition of a passing release

All fourteen gates green, plus the twenty v1.0.0 smoke tests and the nine v1.0.1 additions, plus confirmation that the portfolio project is untouched.

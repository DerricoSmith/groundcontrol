# Production smoke tests

Automated as of v1.0.1. 45 checks, no artifacts left behind.

```bash
node scripts/production-smoke-tests.mjs
node scripts/production-smoke-tests.mjs --url https://some-preview.vercel.app
```

## Result, 2026-07-25, v1.0.1

**45 of 45 passed.** All artifacts cleaned up and cleanup verified.

| Group | Checks | Result |
| --- | --- | --- |
| Public pages | 11 | Pass |
| Demo | 10 | Pass, populated and disclosing fictional data |
| Security headers and protected routes | 14 | Pass |
| Health endpoint | 3 | Pass, reveals nothing about the infrastructure |
| Lead capture | 1 | Pass, stored then removed |
| Data integrity | 3 | Pass, one demo org, 14 accounts, no v1.0.0 smoke residue |
| Portfolio preservation | 1 | Pass |
| Cleanup | 2 | Pass, verified |

## Cleanup protocol

v1.0.0 verified production by hand and left an organization and a lead behind. The suite now:

1. Creates records with unique, time-stamped identifiers.
2. Records exactly what it created rather than matching a pattern later.
3. Removes them in a `finally` block that runs even when an earlier check failed.
4. Verifies removal and reports a cleanup failure as a failure.

It never deletes anything it did not create.

## Preview

Preview deployments sit behind Vercel SSO, so they return 302 to an authentication page and cannot be smoke tested over plain HTTP. That is correct security posture, not a defect. Preview correctness is verified through the database and `verify-database-separation.mjs` instead.

## v1.0.0 baseline

The original twenty manual checks all passed at v1.0.0 and are subsumed by the automated suite. Two failures found only in production during that release, a build-breaking `new URL()` on an environment variable and a corrupted `DATABASE_URL` from a PowerShell pipe, are recorded in `RELEASE_NOTES_V1.md` and both are guarded against now.

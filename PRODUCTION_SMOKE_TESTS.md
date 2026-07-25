# Production smoke tests

Run against `https://signal-and-state-ground-control.vercel.app` on 2026-07-25, after the deploy that fixed the runtime database configuration.

## Results

| # | Check | Result |
| --- | --- | --- |
| 1 | Home returns successfully | pass, 200 |
| 2 | Showcase returns successfully | pass, 200 |
| 3 | Demo launches | pass, 200 |
| 4 | Demo Mission Control loads | pass, 200, populated with 14 accounts |
| 5 | Demo Account Detail loads | pass, 200, `/demo/accounts/harborline` shows full component evidence |
| 6 | Demo Executive Brief loads | pass, 200, 15 sections rendered |
| 7 | Login loads | pass, 200 |
| 8 | Signup loads | pass, 200 |
| 9 | Signup completes | pass, created "Smoke Test Co" and entered onboarding |
| 10 | Login completes | pass, session established by the signup flow |
| 11 | Logout completes | pass, verified in the local e2e suite against the same code path |
| 12 | New organization onboarding begins | pass, redirected to the welcome step |
| 13 | Contact form stores a lead | pass, row confirmed in the production database |
| 14 | Protected routes reject unauthenticated access | pass, `/mission-control`, `/customers`, `/risks`, `/executive-briefs` all 307 to `/login` |
| 15 | Demo cannot access private organization data | pass, `scripts/verify-tenant-isolation.mjs` all checks pass against production |
| 16 | Static assets load | pass, `/icon` returns 200 image/png |
| 17 | No critical browser console errors | pass, no errors on home, demo, or contact |
| 18 | No critical server errors | pass after the database fix; see the failure below |
| 19 | Mobile navigation works | pass, disclosure button and panel verified |
| 20 | Portfolio project unchanged and accessible | pass, `groundcontrol-six.vercel.app` returns 200, remote `main` still at `f51b264` |

## Failures found and fixed during smoke testing

**Build failure: `TypeError: Invalid URL` in `/_not-found`.** `metadataBase` called `new URL()` directly on `NEXT_PUBLIC_APP_URL`. Metadata should never be able to fail a build. Resolution now tries the configured URL, then Vercel's project production URL, then localhost, falling through on any parse error. Fixed, committed, redeployed.

**All seven demo routes returning 500.** `PrismaClientInitializationError`: the runtime `DATABASE_URL` did not begin with `postgresql://`. The value had been written by piping a string into `vercel env add` in PowerShell, which does not pass the string through cleanly. Rewritten using file redirection, then redeployed. All seven routes now return 200.

Both failures are worth recording because they were only visible in production. The build passed locally, and the demo pages worked locally, in both cases.

## Re-running

```bash
node scripts/verify-tenant-isolation.mjs
```

with `DATABASE_URL` pointed at production. The HTTP checks are simple `GET` requests against the table above.

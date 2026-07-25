# Preview environment

Variables scoped to the Vercel **Preview** environment only.

| Variable | Value shape | Notes |
| --- | --- | --- |
| DATABASE_URL | Neon connection with `schema=gc_preview` | Never the production schema |
| AUTH_SECRET | 64 hex characters | Different from production, so sessions do not cross |

`NEXT_PUBLIC_APP_URL` is not set for Preview. The root layout falls back to `VERCEL_PROJECT_PRODUCTION_URL` and then localhost, so metadata resolves without a per-deployment value.

`SEED_SECRET` and `ANTHROPIC_API_KEY` are not set for Preview.

## Rules

- Preview variables are set with `--environment preview` and never copied from production values.
- Set values by file redirection, not by piping a string. See PRODUCTION_ENVIRONMENT.md for why.
- Environment changes need a redeploy to take effect.

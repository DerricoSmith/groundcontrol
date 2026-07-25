# Production environment

Environment variables for the Signal & State commercial project. **Names and purposes only. No values appear in this repository, and every file that could hold one is gitignored.**

## Vercel project

`signal-and-state-ground-control`, team `slow-or-fast`, production branch `signal-state-production`.

## Variables

| Variable | Environments | Required | Purpose |
| --- | --- | --- | --- |
| `DATABASE_URL` | Production, Preview | Yes | Postgres connection. Production targets the `public` schema; Preview targets `gc_preview`. They are verified to differ by `scripts/verify-database-separation.mjs`. |
| `AUTH_SECRET` | Production, Preview | Yes | Signs and encrypts session cookies. Production and Preview hold **different** secrets, so a preview session is not valid in production. |
| `NEXT_PUBLIC_APP_URL` | Production | Yes | Canonical public URL. Feeds `metadataBase`, the sitemap, and robots. The only `NEXT_PUBLIC_*` variable, and it is not a credential. |
| `SEED_SECRET` | None currently | No | Gates `POST /api/demo/refresh`. Set it only while running a refresh, then remove it. It is absent from production, which makes that route return 404. |
| `ANTHROPIC_API_KEY` | None currently | No | Enables the model-backed AI path. Absent, so production runs the deterministic fallback and says so in the interface. |
| `ANTHROPIC_MODEL` | None currently | No | Overrides the default model when a key is present. |
| `AI_DISABLED` | None currently | No | Set to `true` to stop all AI features regardless of key. Outranks a present key. |

## Local development

`.env` at the repository root, gitignored, holding `DATABASE_URL`, `TEST_DATABASE_URL`, `E2E_DATABASE_URL`, `PREVIEW_DATABASE_URL`, `PRODUCTION_DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`, and optionally `SEED_SECRET`.

One file rather than two. Prisma's CLI auto-loads `.env` while Next.js prefers `.env.local`, and keeping both meant the CLI and the application could disagree about which database they were talking to.

## Rules

- No secret is ever committed. `.gitignore` covers `.env*`.
- No secret is ever printed by a script. `verify-database-separation.mjs` prints host, database, and schema; never credentials.
- Only `NEXT_PUBLIC_*` variables reach the browser, and the single one that exists is a public URL.
- Preview and Production hold separate values for every secret they share a name for.
- `vercel env pull` masks values as `[SENSITIVE]`. That is expected, not a failure.

## Setting a variable safely

Piping a string into `vercel env add` from PowerShell does not pass the value through cleanly; this produced a corrupted `DATABASE_URL` during the v1.0.0 release and took the demo down. Use file redirection:

```bash
npx vercel@latest env add DATABASE_URL production < path/to/value.txt
```

Delete the file afterwards. Environment changes require a redeploy to take effect.

# End-to-end tests

Run with `npm run test:e2e`. This:

1. Force-resets `prisma/e2e.db` — a database that exists only for this test suite, never the interactive `prisma/dev.db` you use when running `npm run dev`, and never Vitest's `prisma/test.db`.
2. Starts `next dev` on port 3101 against that database (Playwright's `webServer` in `playwright.config.ts` manages this — you don't need a separate terminal).
3. Runs every spec in this directory against `http://localhost:3101`.

Each spec creates its own users/organizations with unique emails (usually suffixed with a timestamp) rather than relying on shared seed data, since specs share one database within a run and `fullyParallel` is off specifically so that isn't a race condition — but specs should still not assume they're the only spec that has ever run.

Do not point `DATABASE_URL` at `prisma/dev.db` for these tests, and do not add a `--force-reset` step anywhere that could run against it by accident — that flag is only ever combined with the `e2e.db` path in `package.json`'s `test:e2e:db:reset` script.

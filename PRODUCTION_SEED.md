# Production seed

`scripts/seed-demo-org.mjs` creates the fictional demonstration organization. It is the only script that writes to production as a matter of routine, so its safety properties are the point of this document.

## Running it

```bash
node scripts/with-db.mjs PRODUCTION_DATABASE_URL node scripts/seed-demo-org.mjs
node scripts/with-db.mjs PRODUCTION_DATABASE_URL node scripts/seed-demo-org.mjs --dry-run
```

Then populate the derived intelligence, which lives in TypeScript services rather than the script:

```bash
curl -X POST https://signal-and-state-ground-control.vercel.app/api/demo/refresh \
  -H "x-seed-secret: <value>"
```

`SEED_SECRET` is absent from production by default, which makes that route return 404. Set it, run the refresh, then remove it. Alternatively run a local server against the production database and call `localhost`, which is what was done for v1.0.1 and avoids putting the secret in the production environment at all.

## Safety properties

| Property | How it is enforced |
| --- | --- |
| Idempotent | Every record is upserted on a stable identifier. The organization by slug, accounts by `externalId`, tickets by `externalTicketId`, interactions by `externalId`, usage periods and renewals by a per-account key. |
| Scoped | It only ever touches the organization whose slug is `meridian-systems-demo`, and that organization carries `isDemo = true`. |
| Non-destructive | It never drops, truncates, or resets. There is no delete in the script. |
| Cannot touch real data | It never queries or writes outside the demo organization. |
| No shared credential | The demo owner exists so accounts can show an owner name. Its password is random bytes, hashed, and discarded. The public demo is read-only and server rendered, so nothing signs in. |
| Cold-start tolerant | Warms the connection first, then retries transient connection failures with backoff. Constraint violations are not retried; they are real bugs and are rethrown. |
| Verified | Counts records and asserts six required scenarios before reporting success. |
| Fails loudly | A partial seed exits non-zero and prints what is missing rather than printing a reassuring message. |

## What it verifies

After writing, it checks that the portfolio can actually tell its stories:

- 14 accounts exist
- at least two open escalations
- an account with no revenue on file
- an account with no renewal date
- an account with a departed champion
- an account with a renewal plan
- at least one overdue action

If any check fails, the script exits non-zero. Re-running repairs the gap, because it is idempotent.

## The reliability bug fixed in v1.0.1

v1.0.0 documented the seed as "occasionally fails on a cold database and succeeds on retry", and the working theory was a Neon cold-start timeout.

That was wrong. The real cause was a deterministic bug: the renewal plan branch set `RenewalStatus` to `IN_PLANNING`, which is not a member of the enum. It only ran on a genuinely fresh seed, because on any later run the plan already existed and the branch was skipped. So the failure looked intermittent while actually being reliable, and "retry fixed it" was idempotency stepping over the broken code path rather than a transient recovering.

Fixed by using `PLANNING`. The cold-start handling was added anyway, because Neon does suspend and it is correct to warm the connection, but it was not the cause. Diagnosing this is why the seed now verifies its own output: a partial seed that prints success is how a bug hides for a whole release.

## Related

`DEMO_DATA.md` for what the fourteen accounts represent, `DEMO_VALIDATION.md` for the checks, `DEMO_RECOVERY.md` for rebuilding it from nothing.

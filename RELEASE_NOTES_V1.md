# Ground Control Production Showcase v1

Released 25 July 2026. Tag `signal-state-v1.0.0` on branch `signal-state-production`.

Live at https://signal-and-state-ground-control.vercel.app

## What this release is

The smallest version of Ground Control that can credibly stand on its own: a working multi-tenant customer intelligence product, a public demonstration anyone can open without an account, and a company site that explains what it does without overclaiming.

## Highlights

**A demo that needs no account.** Fourteen fictional accounts covering the situations a customer success leader actually faces: usage collapsing ahead of a renewal, a departed champion, strong adoption with an absent executive sponsor, a recovering account, a reference candidate, a renewal nobody has prepared, an account with several overdue actions, and one deliberately incomplete record that the product reports as unmeasured rather than healthy.

**Explainable scoring.** Health decomposes into five weighted components. Each shows its score, its weight, its confidence, and the individual records behind it. A component with no data carries zero confidence and has its weight redistributed, so a gap lowers certainty instead of quietly averaging toward fine.

**Risk with evidence.** Eleven deterministic rules, each producing what changed, the current state, the supporting evidence, the potential impact, the recommended response, and a confidence value. A twelfth rule is in the catalog and reports itself permanently unavailable because the billing data it needs does not exist.

**An AI layer that is honest about itself.** Three provider modes. Every output is schema validated, stored with its prompt version and evidence references, and labeled in the interface. With no provider configured, which is how production currently runs, the same features work on deterministic composition and say so. No number the product reports has ever passed through a model.

## What changed under the hood

Local development and both test suites moved from SQLite to Postgres, matching production exactly. The suite went from fourteen seconds to about three minutes. That bought production parity in every test, one schema with no drift, and the ability to verify tenant isolation against the real engine. Recorded in `DECISIONS.md`.

## Four honesty bugs fixed before release

Each was the same failure: absence presented as good news. Each was found by using the product rather than reading it. Each now has a regression test.

- Accounts that had never been scored displayed as Stable, because that is the storage default. They now read as unmeasured and are excluded from the health distribution.
- Data quality that had never been evaluated displayed as Ready. It now reads Not Evaluated.
- Revenue at risk was summed once per risk, reporting $1.87M of exposure in a portfolio holding $788K. It is now counted once per account.
- A risk rule fired for an account with no contacts and no interactions at all. That is a data gap, not a disengaged sponsor, and the rule now returns nothing.

## Two bugs found only in production

The build failed on `metadataBase` calling `new URL()` on an environment variable, and all seven demo routes returned 500 because the runtime database URL had been corrupted by a shell pipe. Both fixed and redeployed. Documented in `PRODUCTION_SMOKE_TESTS.md` because they passed locally and would have passed any local gate.

## What is not in this release

See `KNOWN_LIMITATIONS.md`. In short: CSV import only with no native integrations, no payment risk, no business outcomes scoring, no automated communication, no formal certification, and Postgres Row Level Security written but not enabled. The trust page says all of this publicly.

## The portfolio is unchanged

`main` remains at `f51b264721d5b16272a2d07cb90032ad247356cf` and the portfolio deployment at groundcontrol-six.vercel.app was never touched. The commercial product is a separate branch, a separate Vercel project, and a separate database.

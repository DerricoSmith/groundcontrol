# Ground Control Release Hardening v1.0.1

Released 25 July 2026. Tag `signal-state-v1.0.1` on `signal-state-production`.

Live at https://signal-and-state-ground-control.vercel.app

Not a feature release. This closes the gaps v1.0.0 reported honestly, and fixes six real defects found along the way.

## Preview no longer shares the production database

The most serious gap in v1.0.0. A preview branch build could have written to live data. Preview now runs against its own `gc_preview` schema with its own auth secret, and `scripts/verify-database-separation.mjs` fails the release if they ever collide again.

## The seed bug was not what v1.0.0 said it was

v1.0.0 documented the demo seed as intermittently failing on a cold database, with a Neon cold start as the theory.

That was wrong. The real cause was deterministic: the renewal plan branch set a `RenewalStatus` of `IN_PLANNING`, which is not a member of the enum. It only ran on a genuinely fresh seed, because on any later run the plan already existed and the branch was skipped. Idempotency was stepping over the broken path, so a reliable bug looked intermittent and "it works on retry" looked like a transient recovering.

Found by resetting a schema to empty and watching it fail the same way every time. The seed now verifies its own output against six required scenarios and exits non-zero on a partial seed, because a partial seed that prints success is how this hid for a whole release.

## Accessibility is now tested, and it found real barriers

19 axe-core tests across every public, demo, authentication, and authenticated route. Zero critical, zero serious.

Six violations fixed: inline links distinguished only by colour on three pages, an icon-only button with no accessible name, three colour contrast failures, and data tables unreachable by keyboard. The colour findings produced a durable fix rather than a patch, since the design system now separates tokens tuned for icons from tokens safe as text.

## Security hardening

Security headers and a content security policy on every response, `X-Robots-Tag` by path prefix, `robots.txt`, a sitemap, and a health endpoint that deliberately says almost nothing. 19 security tests assert all of it against real HTTP responses.

Production dependency advisories went from six to three by upgrading Next by a patch. The remaining three are `sharp` inside Next's image optimization, unreachable because the application accepts no image from any user.

Row Level Security is still not enabled, and the trust page still says so. The blocker is architectural and documented rather than glossed.

## Two latent v1.0.0 defects fixed

A check-then-create race in onboarding entry that crashed under concurrency on Postgres, now insert-and-catch with a concurrency test. And the end-to-end suite, which could not reset its database after the Postgres move and so failed on every run after the first.

## Showcase

Five annotated product screenshots from the fictional demo, each answering what it is, why it matters, what decision it supports, and what was personally designed. Served through `next/image` so a phone does not download a 1440 pixel PNG.

## Production cleanup

The two fictional smoke artifacts from v1.0.0 are gone, removed by a script that matches exact identifiers, refuses anything holding real data, and verifies afterwards. The smoke suite is now automated at 45 checks and cleans up after itself, so routine verification no longer accumulates junk.

## Documentation

All 25 required release documents now exist, plus 21 more. `RELEASE_DOCUMENTATION_INDEX.md` states which were verified against the running system.

## The portfolio is still untouched

`main` remains at `f51b264721d5b16272a2d07cb90032ad247356cf`. groundcontrol-six.vercel.app returns 200.

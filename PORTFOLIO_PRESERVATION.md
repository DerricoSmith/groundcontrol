# Portfolio preservation record

This file exists to protect the deployed portfolio project while the Signal &
State / Ground Control commercial rebuild happens in this same working tree,
uncommitted. Read this before running any Git or Vercel command in this repo.

## The production baseline

- **Committed Git SHA (HEAD at start of this build):** `f51b264721d5b16272a2d07cb90032ad247356cf`
- **Branch:** `main`
- **Remote:** `origin` → a GitHub repository under the account that owns this project (URL intentionally omitted here beyond what's already public in `git remote -v`; no credentials are stored in this file or anywhere in the repo)

**This committed SHA is the production baseline.** It is what's pushed to GitHub and what Vercel has deployed as the portfolio project that is actively being used for job applications. As of this writing, nothing in this working session has committed, amended, or pushed anything — the SHA above is unchanged from before this build started.

## Current work state

All Signal & State / Ground Control commercial work — the multi-tenant schema, auth rewrite, governance docs, app shell rewrite, and everything added in this build — **remains uncommitted** in the working tree. `git status` at any point will show this directly; nothing here is hidden in a commit, stash, or separate ref.

- **Date/time of this record:** 2026-07-24, local time at checkpoint ~16:16 (see checkpoint timestamp `20260724-161638` for the precise moment)
- **Local database path:** `prisma/dev.db` (SQLite)
- **Current local application mode:** local development only (`npm run dev`), backed by the local SQLite file above. No production or remote database is configured or reachable from this working tree.

## The rule

**The existing Vercel project must not be touched.** No `git push`, no `vercel deploy`, no `vercel --prod`, no `vercel link`, no change to Vercel project settings or environment variables, for the duration of this local build. See `LOCAL_ONLY_DEVELOPMENT.md` and `FUTURE_DEPLOYMENT_HANDOFF.md` for the full detail and the eventual separate-deployment plan.

## Recommendation

Signal & State / Ground Control should eventually be deployed as a **separate Vercel project**, with its own production database, domain, and credentials — not layered onto the existing portfolio deployment. See `FUTURE_DEPLOYMENT_HANDOFF.md` for the proposed architecture. This is a recommendation for a future, explicitly-approved step; nothing here authorizes it.

## Branch safety note

The working tree was on `main` (the same branch as the portfolio baseline) when this build continued. A local-only branch, `signal-state-local-build`, was created and checked out once Git confirmed the switch would carry forward all uncommitted changes rather than discard them (`git switch -c` preserves the working tree and index; it does not touch untracked files or existing edits). No upstream was set and nothing was pushed. If for any reason that switch could not be verified safe, work continued on `main` instead and that fact would be recorded here — see the actual branch in effect via `git branch --show-current`.

## Recovery checkpoints

External, out-of-repo checkpoints (working tree archive, portfolio baseline archive, patches, and a database backup) are written to `../ground-control-local-checkpoints/<timestamp>/` — see each directory's `RESTORE_INSTRUCTIONS.md`.

- `20260724-161638` — initial checkpoint, before this build's test/invitation work began. Includes the portfolio baseline archive.
- `20260724-163832` — after the test foundation, tenant-isolation suite, and invitation flow milestones.
- `20260724-164737` — before the foundation-gaps/Playwright/onboarding-architecture phase.
- `20260724-172241` — after that phase (active org selection, membership administration, Playwright, onboarding architecture), with build/test results captured.
- `20260724-173547` — before the Quick Start onboarding UI phase.
- `20260724-182317` — after that phase (full onboarding UI, Customer Portfolio, Account Detail, Executive Brief page), 147/147 tests passing.

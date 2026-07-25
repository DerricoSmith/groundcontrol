# Recruiter guide

For Rico, on using this project in a hiring conversation.

## The one link

https://signal-and-state-ground-control.vercel.app/showcase

## What it proves

**Executive customer leadership.** The problems it solves are the ones you were accountable for: retention, renewals, escalations, and executive engagement.

**Product thinking.** Scope discipline is visible. Eleven working risk rules shipped, a twelfth honestly marked unavailable because the data does not exist, and a long roadmap deliberately not started.

**Data and workflow design.** A normalized multi-tenant model across accounts, contacts, usage, support, interactions, renewals, risks, actions, and escalations.

**AI implementation judgment.** Knowing where a model helps, where it must be kept out, and how to remain useful when it is unavailable. Production runs the deterministic path today.

**Hands on building.** A deployed multi-tenant application with authentication, imports, 260 unit tests, 49 end-to-end tests including accessibility and security, and a production database.

## The strongest thirty seconds

Section 12, "What I personally built". Specifically: three of the scoring decisions exist because you found the opposite behaviour in your own product while using it. Unscored accounts were showing as healthy, unevaluated data quality was showing as ready, and revenue at risk was being counted per risk rather than per account.

That is the difference between someone who prompted an AI and someone who owns a system. Nobody finds those bugs from a specification.

## Answering "did AI build this"

Directly, without defensiveness: the implementation was advanced through AI assisted workflows including Claude Code, and the judgment is the product. What a health score decomposes into. Why missing data must lower confidence rather than assume the middle. Why an account with no contacts has a data gap and not a disengaged sponsor. Why a human dismissal is never reopened by the machine. No tool makes those calls, and they are what make the output trustworthy.

## If they want depth

- Architecture: `/showcase#architecture`
- Security and tenancy: `/showcase#security`
- The live product: `/demo`, no account needed

# Demo guide

The public demonstration at `/demo`. No account, no signup, entirely fictional.

## The two minute path

1. **`/demo`** Mission Control. Portfolio size, revenue at risk, renewals closing, accounts needing attention.
2. **`/demo/accounts`** The portfolio. Fourteen accounts with honest gaps.
3. **`/demo/accounts/harborline`** Account detail. The health score decomposed into five components with evidence.
4. **`/demo/risks`** Risk radar. Six part explanations, revenue counted once per account.
5. **`/demo/renewals`** Renewal center. Milestone plans and explained forecast confidence.
6. **`/demo/actions`** Actions. Suggested work carrying the risk evidence.
7. **`/demo/brief`** Executive brief. Sixteen deterministic sections.

Every page links onward, and the six step sequence appears on the demo entry page. It can be ignored; the navigation reaches every page in any order.

## What to point at

**For a customer success leader:** Harborline Freight. Usage collapsing, an open escalation, urgent tickets, and a renewal 54 days out. The account detail shows exactly why the score is what it is.

**For someone sceptical of health scores:** the component breakdown on any account. Weights, confidence, and the individual records.

**For someone sceptical of AI claims:** the executive brief's final section, which states that no model wrote any of it.

**For an operator:** Bastion Retail Group, which is deliberately incomplete and reads as unmeasured rather than healthy.

## Isolation

Server rendered and read only. The organization is resolved from a constant slug that must also carry `isDemo`, so no URL manipulation reaches a real customer. There are no forms and no submit controls, asserted by `e2e/security.spec.ts`.

## Refreshing it

See PRODUCTION_SEED.md and DEMO_RECOVERY.md.

# Demo validation

What the demo must be able to demonstrate, and how that is checked.

## Automated, on every seed

`scripts/seed-demo-org.mjs` verifies before reporting success. A failure exits non-zero.

| Check | Why it matters |
| --- | --- |
| 14 accounts exist | The portfolio is complete, not partially written |
| At least two open escalations | Escalation tracking has something to show |
| An account with no revenue on file | Proves incomplete records read as unmeasured, not healthy |
| An account with no renewal date | Proves the renewal section says "no date on file" rather than "no renewals" |
| An account with a departed champion | The champion departure scenario is present |
| An account with a renewal plan | Renewal preparation has something to show |
| Overdue actions exist | The ownership and follow-through story is present |

## Automated, in the test suite

`e2e/security.spec.ts` asserts the demo is read only, discloses fictional data on every page, and cannot be pointed at another organization. `e2e/accessibility.spec.ts` audits all seven demo routes against a seeded database.

## Manual, before a release

Open `/demo` and confirm Mission Control shows a non-zero portfolio, that Harborline Freight tells its story end to end, and that the executive brief renders its sections.

## Scenario coverage

The fourteen accounts cover: high revenue with declining usage and an approaching renewal; a healthy expansion candidate; a departed champion; strong usage with weak executive engagement; commercial contraction signalled; a recovering account; concentrated product feedback; a reference candidate; missing renewal information; stale customer information; a renewal plan with unresolved implementation risk; several overdue actions; and a deliberately incomplete record.

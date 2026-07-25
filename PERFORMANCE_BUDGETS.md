# Performance budgets

Thresholds that should trigger work if crossed. Chosen for the pilot and demonstration experience, not for enterprise scale.

| Budget | Threshold | Rationale |
| --- | --- | --- |
| Static public page payload | Under 300 KB transferred | Home and showcase must open fast on a phone |
| Any single image transferred | Under 250 KB | Enforced by `next/image` optimization, not by hand |
| Demo Mission Control server response | Under 1.5 s warm | Below the point where a visitor assumes it is broken |
| Demo Account Detail server response | Under 2 s warm | Heaviest demo page |
| Queries per page render | Under 12 | A rise usually means an N plus one crept in |
| Customer Portfolio page size | 50 rows | Already enforced |
| Risk Radar and Actions result cap | 200 rows | Already enforced |
| Third-party scripts on public pages | Zero | Currently zero. Adding one is a decision, not a default |
| Vitest suite | Under 5 minutes | Beyond that people stop running it locally |
| Playwright suite | Under 4 minutes | Same reason |

## Cold start

Neon suspends an idle compute, so a first request can exceed these numbers. That is a platform characteristic of the free tier, not a regression, and it is excluded from the budgets above. If cold starts become a demonstration problem, the fix is a paid Neon tier or a keep-warm ping, and both are founder decisions.

## Reviewing

Compare against PERFORMANCE_BASELINE.md after any change that adds an image, a dependency, a query, or a page.

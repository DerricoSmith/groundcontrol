# Release documentation index

Every required release document, its state, and whether it matches production. Verified 2026-07-25 for v1.0.1.

"Accurate" means the document was checked against the running system, not merely written.

| # | Document | Required | Exists | Last verified | Accurate | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | FINISH_LINE_PLAN.md | Yes | Yes | 2026-07-25 | Yes | v1.0.0 plan. Historical, retained. |
| 2 | RELEASE_PROGRESS.md | Yes | Yes | 2026-07-25 | Yes | Updated with v1.0.1 outcomes |
| 3 | PRODUCTION_ARCHITECTURE.md | Yes | Yes | 2026-07-25 | Yes | Topology, rendering, data, AI, security posture |
| 4 | PRODUCTION_DEPLOYMENT.md | Yes | Yes | 2026-07-25 | Yes | Sequence used for this release |
| 5 | PRODUCTION_ENVIRONMENT.md | Yes | Yes | 2026-07-25 | Yes | Names only, no values |
| 6 | PRODUCTION_DATABASE.md | Yes | Yes | 2026-07-25 | Yes | Schema strategy and its honest limits |
| 7 | PRODUCTION_MIGRATIONS.md | Yes | Yes | 2026-07-25 | Yes | One baseline migration |
| 8 | PRODUCTION_SEED.md | Yes | Yes | 2026-07-25 | Yes | Includes the real cause of the v1.0.0 seed bug |
| 9 | DEMO_GUIDE.md | Yes | Yes | 2026-07-25 | Yes | Two minute path |
| 10 | SHOWCASE_CONTENT.md | Yes | Yes | 2026-07-25 | Yes | Matches the 16 sections plus screenshots |
| 11 | SHOWCASE_AUDIENCES.md | Yes | Yes | 2026-07-25 | Yes | Four readers |
| 12 | RECRUITER_GUIDE.md | Yes | Yes | 2026-07-25 | Yes | |
| 13 | INVESTOR_GUIDE.md | Yes | Yes | 2026-07-25 | Yes | No unsupported claims |
| 14 | PROSPECT_GUIDE.md | Yes | Yes | 2026-07-25 | Yes | |
| 15 | SECURITY_REVIEW.md | Yes | Yes | 2026-07-25 | Yes | Includes RLS blocker and residual risks |
| 16 | ACCESSIBILITY_REVIEW.md | Yes | Yes | 2026-07-25 | Yes | 19 tests, 0 critical, 0 serious |
| 17 | PERFORMANCE_REVIEW.md | Yes | Yes | 2026-07-25 | Yes | |
| 18 | PRODUCTION_TEST_RESULTS.md | Yes | Yes | 2026-07-25 | Yes | |
| 19 | PRODUCTION_SMOKE_TESTS.md | Yes | Yes | 2026-07-25 | Yes | Updated for the automated 45 check suite |
| 20 | RELEASE_NOTES_V1.md | Yes | Yes | 2026-07-25 | Yes | v1.0.0 notes, retained |
| 21 | ROLLBACK_PLAN.md | Yes | Yes | 2026-07-25 | Yes | |
| 22 | KNOWN_LIMITATIONS.md | Yes | Yes | 2026-07-25 | Yes | Updated for v1.0.1 |
| 23 | ROADMAP.md | Yes | Yes | 2026-07-25 | Yes | |
| 24 | LIVE_URLS.md | Yes | Yes | 2026-07-25 | Yes | |
| 25 | PORTFOLIO_LINK_SNIPPET.md | Yes | Yes | 2026-07-25 | Yes | |

**25 of 25 required documents present.**

## Added in v1.0.1 beyond the required list

| Document | Purpose |
| --- | --- |
| HARDENING_PLAN_V1_0_1.md | This phase's plan |
| RELEASE_NOTES_V1_0_1.md | What changed in this release |
| PREVIEW_ARCHITECTURE.md | Preview topology |
| PREVIEW_DATABASE.md | Preview schema and operations |
| PREVIEW_ENVIRONMENT.md | Preview variables |
| PREVIEW_RESET.md | Disposing of preview safely |
| DEMO_RECOVERY.md | Rebuilding the demo from nothing |
| DEMO_VALIDATION.md | What the demo must prove |
| ACCESSIBILITY_TESTING.md | Running the a11y suite |
| ACCESSIBILITY_MANUAL_REVIEW.md | The manual pass |
| ACCESSIBILITY_KNOWN_LIMITATIONS.md | What is not covered |
| SECURITY_FINDINGS_V1_0_1.md | Findings with disposition |
| SECURITY_TEST_PLAN.md | What the security tests assert |
| DEPENDENCY_REVIEW.md | Advisories and exposure |
| CONTENT_SECURITY_POLICY.md | The policy and its honest weakness |
| PERFORMANCE_BASELINE.md | Numbers to compare against |
| PERFORMANCE_BUDGETS.md | Thresholds |
| PERFORMANCE_FINDINGS_V1_0_1.md | Findings with disposition |
| TEST_COVERAGE_MATRIX.md | 34 categories against reality |
| RELEASE_TEST_PLAN_V1_0_1.md | Gate order |
| PRODUCTION_REGRESSION_TESTS.md | Post-deploy checks |

## Retained governance documents

PRODUCT, ARCHITECTURE, DATA_MODEL, SECURITY, DESIGN_SYSTEM, IMPLEMENTATION_PLAN, LAUNCH_CHECKLIST, DECISIONS, TESTING, DEMO_DATA, ENVIRONMENT, CONTRIBUTING, CHANGELOG, CUSTOMER_INTELLIGENCE_CORE, CSV_IMPORT_ARCHITECTURE, ONBOARDING_ARCHITECTURE, ONBOARDING_KNOWN_LIMITATIONS, PORTFOLIO_PRESERVATION, LOCAL_BUILD_PROGRESS, and others predating this release.

## Verification

This table is checked by reading each document against the running system before a release is tagged. A document that exists but no longer matches production is marked inaccurate rather than left implying otherwise.

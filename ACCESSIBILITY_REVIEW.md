# Accessibility review

Reviewed 2026-07-25 for v1.0.1.

## Automated coverage

`e2e/accessibility.spec.ts` runs axe-core against every route the release plan requires, using `@axe-core/playwright` locally. Nothing is sent to an external service, so no application content leaves the machine.

Tags: `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`. The release fails on **critical** and **serious**. Moderate and minor are printed and recorded.

**Result: 19 tests, 0 critical, 0 serious.**

| Group | Routes |
| --- | --- |
| Public | `/`, `/ground-control`, `/showcase`, `/about`, `/services`, `/trust`, `/contact`, `/privacy`, `/terms` |
| Demo | Mission Control, Portfolio, Account Detail, Risks, Renewals, Actions, Executive Brief |
| Authentication | `/login`, `/signup` |
| Authenticated | Onboarding, Mission Control, Portfolio, Executive Briefs, Team, Imports, Risks, Renewals, Actions, Data Quality |

Run with `npm run test:a11y`.

## Violations found and fixed

Every one was a real barrier, and every one was invisible until the tooling existed.

| Impact | Finding | Fix |
| --- | --- | --- |
| Serious | `link-in-text-block` on Privacy, Terms, and Signup. Inline links were distinguished from surrounding text by colour alone. | Underlined links inside `p`, `li`, and `dd` at the base layer, so a new paragraph cannot reintroduce it. Standalone navigation and card links are unaffected. |
| Critical | `button-name` on the notifications trigger. An icon-only button with no accessible name. | `aria-label="Notifications"`, and the icon marked `aria-hidden` so it is not announced twice. |
| Serious | `color-contrast` on the portfolio sort controls, which used a decorative grey. | Moved to the secondary text colour. Sort options are controls, not captions. |
| Serious | `color-contrast` on the topbar status pill. `--positive` on `--positive-soft` measures about 3.3:1. | Added `--positive-strong` for text on soft backgrounds, in both themes. |
| Serious | `color-contrast` on the demo warning metric. `--warning` is amber at about 2.1:1 as text. | Added `--warning-strong`. |
| Serious | `scrollable-region-focusable` on every data table. Horizontally scrolling containers were unreachable by keyboard. | The shared table container is focusable with a visible focus ring and a labelled group role. |

The colour findings produced a durable improvement rather than a patch: the design system now distinguishes tokens tuned for icons and bars from tokens safe for text, which is the distinction that was missing.

## Manual review

See `ACCESSIBILITY_MANUAL_REVIEW.md`.

## What this is not

This is automated coverage plus a manual pass, not a WCAG conformance claim and not a third-party audit. Automated tooling reliably catches roughly a third of real barriers. No screen reader user has tested this product, and no assistive technology testing beyond keyboard navigation has been performed.

Remaining known gaps are in `ACCESSIBILITY_KNOWN_LIMITATIONS.md`.

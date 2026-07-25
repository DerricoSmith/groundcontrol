# Accessibility testing

How to run the automated accessibility suite and what it covers.

## Running it

```bash
npm run test:a11y
```

Resets and reseeds the `gc_e2e` schema, starts a dev server on port 3101, and runs `e2e/accessibility.spec.ts` under the `accessibility` Playwright project.

The full end-to-end run (`npm run test:e2e`) includes it.

## Tooling

`@axe-core/playwright`, running axe-core in the browser. Local only. No application content is sent to any external service.

Tags: `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`.

The Next.js dev tools launcher is excluded, since it is not part of the product and is absent from a production build.

## Thresholds

| Impact | Behaviour |
| --- | --- |
| Critical | Fails the release |
| Serious | Fails the release |
| Moderate | Printed, recorded in `ACCESSIBILITY_KNOWN_LIMITATIONS.md` |
| Minor | Printed |

Failure output names the rule, the help text, and the first three offending selectors, so a failure is actionable without opening a trace.

## Adding a route

Add it to the relevant `test.describe` block in `e2e/accessibility.spec.ts`. Public, demo, and authentication routes are simple path and label pairs. Authenticated routes go in the array inside the authenticated test, which signs up a fresh account first so it does not depend on seeded users.

## Why it needs a seeded demo

The demo pages render an honest "unavailable" state when the demo organization is missing. That state is accessible, but auditing it proves nothing about the real pages, so `test:e2e:db:reset` seeds the demo before the suite runs.

## What it does not do

It does not test with a screen reader, does not verify zoom or high contrast, and does not constitute a WCAG conformance claim. See `ACCESSIBILITY_KNOWN_LIMITATIONS.md`.

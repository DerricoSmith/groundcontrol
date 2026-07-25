# Accessibility known limitations

Published deliberately. A review that lists only passes is marketing.

## Not done

**No screen reader testing.** Nothing has been verified with NVDA, JAWS, or VoiceOver. Landmarks, labels, and announcements are correct by construction and by axe, which is not the same as correct in practice. This is the largest gap.

**No third-party audit.** No accessibility specialist has reviewed the product, and no WCAG conformance claim is made anywhere on the site.

**Automated tooling catches roughly a third of barriers.** Zero critical and serious violations across 19 routes is meaningful, but it is a floor rather than a ceiling.

**Field descriptions are not programmatically associated.** Help text under form fields sits adjacent in the DOM rather than being wired with `aria-describedby`. A sighted user sees it; a screen reader user may not hear it with the field.

**`prefers-reduced-motion` is not explicitly honoured.** Animation is sparse and no essential content depends on it, but the media query is not implemented. The screenshot generator disables animation, so this is not visible in the captured images.

**Zoom to 200 percent is unverified.** Layouts are relative and should reflow, but this has not been tested.

**Windows High Contrast Mode is unverified.**

**No accessibility statement page.** The trust page covers security and data handling but does not yet publish an accessibility statement or a contact route for accessibility problems.

## Deliberate choices worth knowing

**Data tables are focusable containers.** Fixing `scrollable-region-focusable` means a keyboard user tabs onto the table container before its contents. This is correct, and it adds a tab stop per table.

**Inline links are underlined; navigation links are not.** Links inside a text block need a non-colour distinguisher. Links that are visually obvious as controls do not, and underlining everything would make the interface noisy.

**The demo is read only.** It has no forms, so form accessibility in the demo is untested by definition. The authenticated product's forms are covered.

## Priority if this is picked up next

1. Screen reader pass on the demo and the authenticated core.
2. `aria-describedby` on form field help text.
3. `prefers-reduced-motion`.
4. Zoom and high contrast verification.
5. An accessibility statement with a contact route.

# Accessibility manual review

Performed 2026-07-25 for v1.0.1. Keyboard and visual inspection in Chromium at desktop and mobile widths. **No screen reader testing was performed**; see the limitations document.

| Check | Result | Notes |
| --- | --- | --- |
| Keyboard navigation | Pass | Every interactive element is reachable by Tab. No keyboard trap found. |
| Focus order | Pass | Follows visual order. The public mobile menu is a disclosure below its trigger, so focus continues naturally rather than jumping. |
| Focus visibility | Pass | A visible ring on all focusable elements, including the newly focusable table containers. |
| Skip link | Pass | First tab stop on public pages, targets `#main`, visible on focus. |
| Landmark structure | Pass | `header`, `nav` with labels, `main` with an id, `footer`. Multiple navs are distinguished by `aria-label`. |
| Heading hierarchy | Pass | One `h1` per page, descending without skips. Section headings render as `h2`, card titles as `h3`. |
| Form labels | Pass | Every input has a `label` with a matching `for`. The honeypot is labelled and hidden from assistive technology. |
| Field descriptions | Partial | Help text sits adjacent rather than being wired with `aria-describedby`. Recorded as a limitation. |
| Error announcements | Pass | Form errors use `role="alert"`; the success state uses `role="status"`. |
| Table captions | Pass | Data tables carry a caption, visually hidden where the surrounding heading already says it. |
| Table headers | Pass | `th` with `scope`, row headers on the identifying column. |
| Dialog behaviour | Pass | Base UI dropdowns manage focus and close on Escape. The public mobile menu closes on Escape too. |
| Mobile menu | Pass | `aria-expanded`, `aria-controls`, and a label that changes between Open and Close. |
| Reduced motion | Partial | Framer Motion is used sparingly and no essential content depends on animation, but `prefers-reduced-motion` is not explicitly honoured. Recorded as a limitation. |
| Status labels | Pass | Health bands, risk severities, renewal states, and milestone completion all carry text. Milestone dots pair with visually hidden Complete or Not complete text. Nothing depends on colour alone. |
| Colour contrast | Pass | Verified by axe across all tested routes after the token fixes. |
| Link purpose | Pass | No bare "click here". Demo links name their destination. |
| Button names | Pass | Verified by axe after the notifications fix. |
| Loading states | Pass | Buttons show a pending label rather than only a spinner. |
| Empty states | Pass | Empty states explain why something is empty and what to do, rather than showing a bare zero. |

## Responsive verification

Checked at 390, 768, 1280, and 1920 pixels wide.

- Public pages reflow to a single column without horizontal scrolling.
- Wide data tables scroll inside their own container; the page body never scrolls horizontally.
- Mobile navigation replaces the desktop nav below the medium breakpoint.
- The authenticated bottom bar carries five destinations; the rest live in the mobile menu.
- Demo Mission Control and Account Detail are usable at 390 pixels, which is the width the screenshots were captured at.

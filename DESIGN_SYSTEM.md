# Design System

Two related but distinct visual registers:

- **Signal & State (public site)** — editorial, executive, a business publication crossed with a control room. Serif display type allowed. More whitespace, more narrative.
- **Ground Control (application)** — dense, calm, operational. Grotesk only. Every pixel earns its place because a CS Manager may look at this for two hours a day.

Both share the same token system (color, spacing, radius) so the product never feels like a different company than the site that sold it.

## Inspiration, and its limits

Signals, movement, sequencing, information flow, grids, rhythm, system states, control rooms, editorial business publications (think *The Information*, *Stratechery*, Bloomberg Terminal's clarity without its density-for-density's-sake). Rico's global/creative background should read as **restraint and rhythm**, not literal imagery. Concretely: no turntables, no vinyl, no waveform decoration, no nightclub palette. If a visual motif doesn't also make sense to a Series B CFO, it doesn't belong on the site.

## Color

**Brand/interactive accent** — a single indigo, used for links, primary actions, focus rings, and the one "this is interactive" signal in the product. It is never used to mean "healthy" or "at risk" — that vocabulary is reserved for the health scale below, so the two systems never collide.

```
--brand:        #4338CA   (light mode)   /  #818CF8 (dark mode)
--brand-hover:  #3730A3               /  #A5B4FC
--brand-soft:   #EEF2FF               /  rgba(129,140,248,0.14)
```

**Health scale** — five ordinal steps, always used consistently in this order, never re-mapped per feature:

```
Strong    #15803D  (deep green)
Stable    #0891B2  (teal/blue — deliberately not green, so "stable" never reads as "great")
Watch     #B45309  (amber)
At Risk   #C2410C  (orange)
Critical  #B91C1C  (red)
```

**Neutrals** — warm-white surfaces in light mode, graphite (not pure black) in dark mode, matching the existing token approach from the prior build (`--background`, `--surface`, `--surface-soft`, `--text-primary/secondary/muted`, `--border`). Reused as-is; see `src/app/globals.css`.

**Never encode meaning through color alone.** Every health category, risk severity, and status also carries a text label and, where useful, an icon — required for accessibility and because color-blind executives read these screens too.

## Typography

- **Application UI**: Geist Sans only, all weights. No serif inside Ground Control's tables, cards, or dense views — a data-dense operational tool needs one typographic voice, not two.
- **Public site & Insights articles**: Geist Sans for UI chrome and body text; a serif (Fraunces, already integrated) reserved for hero headlines and pull-quotes only — editorial accent, not a whole-page identity.
- **Type scale** (application): 12 / 12.5 / 13 / 14 / 15 / 17 / 20 / 24 / 28px, in that order of frequency of use. Tables and dense data default to 13px. Page titles are 24–28px, never larger — this is an operating tool, not a landing page.
- **Numerals**: tabular figures (`font-variant-numeric: tabular-nums`) everywhere a number appears in a table or metric tile, so columns of numbers align.

## Spacing, radius, elevation

- 4px base spacing unit; component padding steps at 8/12/16/20/24/32.
- Radius: 8px for inputs/buttons, 12–14px for cards, 20px for modals/drawers — restrained, not the very rounded "consumer app" radius used in the prior solopreneur build.
- Shadows: one soft elevation step for cards, one slightly stronger for popovers/dialogs. No decorative glows, no gradients on data surfaces. Gradients are permitted only on the public marketing site's hero sections.

## Components

Reused from the prior build, restyled to the tighter radius/spacing above rather than rebuilt: `SurfaceCard`, `MetricCard` → **StatTile**, `Badges` → **StatusPill** (health/risk/forecast/priority variants), `ActionCard` → **RecommendedActionCard**, `EmptyState`, `PageHeader`.

New for this product:
- **EvidenceList** — the repeating "supporting evidence" bullet list required under every score/risk/recommendation. One shape, used everywhere a claim needs proof.
- **ExplanationBlock** — renders the required format (Current state → What changed → Supporting evidence → Potential impact → Recommended action → Confidence) as a single consistent component, never freehand prose assembled per-page.
- **ConfidenceTag** — small inline label ("High confidence" / "Limited data") — never omitted when an AI-derived or score value is shown.
- **PortfolioTable** — dense, sortable, filterable, column-configurable table for Customer Portfolio, Risk Radar, Renewal Center, Actions. One table primitive, several column presets, not four bespoke tables.

### Rules

- **Charts**: used only when a trend or distribution is genuinely clearer as a chart than as a number + delta. Mission Control leads with numbers and short explanations, not a dashboard wall — decorative charts (e.g. a donut chart for a two-category split) are not used; a simple stat with a movement indicator is.
- **Tables**: sticky header, keyboard-navigable rows, every status column backed by a StatusPill (label + icon, not color alone).
- **Forms**: labeled inputs (never placeholder-as-label), inline validation messages tied to the field via `aria-describedby`, required fields marked in text not color.
- **Buttons**: one primary action per view. Destructive actions require a confirming second step and are never styled the same as primary actions.
- **Dialogs vs. Drawers**: Dialogs for short confirmations and single-field edits. Drawers (right-side) for anything that needs room — Account Brief quick view, Risk detail, Action detail.
- **Toasts**: confirmation of a completed action only, never used to convey information the user must retain (that goes in the page).
- **Empty states**: every one explains what belongs there, why it matters, and the next step — never a bare "No data."
- **Loading states**: skeletons that match the shape of the content they'll become, not a generic spinner, for anything above a simple button.
- **Error states**: a user-safe message plus a retry affordance where retrying is possible; full detail goes to server logs, never to the browser console or UI (`SECURITY.md`).

## Accessibility

Semantic HTML first. Keyboard navigation and visible focus rings on every interactive element (the existing `focus-visible` ring token is reused). Labeled form fields and errors. WCAG AA contrast minimum on all text/background pairs — validated against both the health-scale colors and the neutrals, in both themes. Logical heading order per page. Tables use real `<table>` semantics with scoped headers, not div-grids. Reduced-motion media query respected (Framer Motion transitions are disabled/minimized under `prefers-reduced-motion`). Every icon-only button has an accessible name.

## Content & language guide

**Preferred terms** (use consistently): Customer Account, Health, Risk, Opportunity, Action, Renewal, Escalation, Signal, Evidence, Executive Brief, Data Confidence, Customer Feedback, Relationship, Business Outcome.

**Definitions that must not drift**:
- **Customer Account** = the company the *organization's* customer sells to (i.e., the org's customer).
- **Organization** = the Signal & State client using Ground Control.
- **User** = a person signed into Ground Control.

Avoid inconsistent substitutes: "client," "user," "subscriber," "contact," "company" used interchangeably with the terms above. "Contact" is reserved specifically for `CustomerContact` records.

**Tone**: direct, calm, experienced, human, clear, executive, useful, confident. Written like an operator who has sat in the renewal meeting, not like a product marketer describing one.

**Banned language** (site and product copy): revolutionary, game-changing, cutting-edge, seamless, supercharge, unlock the power, next-generation, transformative solution, at the intersection of, "AI-powered" as a prefix to everything. If a sentence would sound at home in any SaaS company's generic template, rewrite it specific to this product.

**No lorem ipsum, ever** — use realistic, labeled placeholder content or an explicit "not yet available" state instead.

**Predictive language**: do not describe a feature as "predictive" unless it is backed by an actual model with validated accuracy — the current renewal forecast is a *rule-based confidence category*, not a prediction, and is described that way in copy.

**"Agent" language**: reserve the word "agent" for something that actually takes multi-step autonomous action. A single AI call that drafts one explanation is not an agent — call it what it is (e.g. "risk explanation," "brief generation").

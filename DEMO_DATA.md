# Demo Data

## What exists today: the local demo organization

`node scripts/seed-demo-org.mjs` creates **Meridian Systems (Demo)** in `prisma/dev.db` with five accounts, so the whole product surface can be exercised locally without a real customer's data. This is the working demo data that exists now; the twenty-account Northwind Analytics narrative below remains the target for the productized demo in Phase 11.

The five accounts are chosen to exercise different states, not to fill a table:

| Account | ARR | What it demonstrates |
| --- | --- | --- |
| Harborline Freight | $240,000 | Usage collapsing, executive gone quiet, urgent tickets open, an active escalation, renewal inside 90 days |
| Calder Manufacturing | $410,000 | A genuinely healthy account: rising usage, recent executive contact, one satisfied ticket |
| Trellis Health | $96,000 | Renewal in three weeks with nobody engaged and no champion recorded |
| Northgate Legal | $42,000 | Steady and small, with no executive sponsor on file |
| Bastion Retail Group | none | Deliberately incomplete: no ARR, no renewal date, no owner, no contacts. The product must report it as unmeasured, never as healthy. |

Safety properties: the script never touches an existing organization, never deletes anything, and refuses to write twice. It is never imported by application code. Sign-in credentials are printed by the script.

`node scripts/seed-demo-org.mjs` also marks the demo organization's onboarding complete, because its data arrives through the script rather than through the wizard.

---

## Target demo data (Phase 11)

The demo organization is a real, RLS-isolated `Organization` row named **"Northwind Analytics"** — a fictional 40-person B2B SaaS company (~$9M ARR) that looks exactly like Ground Control's ICP, so the demo doubles as "this is what your own portfolio will look like." It is seeded, not hand-edited live, and is fully resettable (`scripts/seed-demo.ts`, planned in Phase 11).

## Coherence rule

Every record supports one of the eight required scenarios below or the portfolio-level rollups (revenue by health category, renewals approaching, open escalations, etc.). No unrelated filler rows — the founder's explicit instruction is a coherent story, not randomized noise, so every one of the 20 accounts has a reason to exist in the narrative.

## The 20 accounts (segment / ARR / role in the story)

| # | Account (working name) | Segment | ARR | Health | Scenario role |
|---|---|---|---|---|---|
| 1 | Ridgeline Freight Co. | Enterprise | $180,000 | At Risk | **Scenario 1** — declining usage, unresolved priority tickets, renewal in 94 days |
| 2 | Bramble & Finch | Mid-Market | $64,000 | Strong | **Scenario 2** — rising adoption, expansion opportunity |
| 3 | Solace Health Group | Enterprise | $210,000 | Watch | **Scenario 3** — champion departed 18 days ago, no replacement identified |
| 4 | Kestrel Logistics | Mid-Market | $88,000 | Stable | **Scenario 4** — strong usage, executive sponsor has not engaged in 70+ days |
| 5 | Fenwick Studio | SMB | $14,400 | Critical | **Scenario 5** — failed payment, low response rate |
| 6 | Anchorpoint Systems | Mid-Market | $72,000 | Stable (recovering) | **Scenario 6** — was At Risk 60 days ago, recovery plan executed, trending up |
| 7 | Vantage Robotics | Enterprise | $145,000 | Watch | **Scenario 7** — 6 open feature requests tied to $145K ARR |
| 8 | Harlow & Rye | Mid-Market | $58,000 | Strong | **Scenario 8** — high satisfaction, reference/case-study candidate |
| 9 | Ninebark Data | SMB | $22,000 | Strong | Steady, low-touch, healthy — portfolio baseline |
| 10 | Coldwater Devices | Mid-Market | $91,000 | Stable | Renewed last quarter, on a standard cadence |
| 11 | Palisade Software | Enterprise | $260,000 | Strong | Largest account, strong QBR cadence — advocacy candidate #2 |
| 12 | Thistledown Co. | SMB | $9,600 | Watch | Low adoption since onboarding, no clear champion |
| 13 | Marrow Health | Mid-Market | $76,000 | At Risk | Second active escalation — critical bug open 11 days |
| 14 | Greywolf Analytics | Enterprise | $198,000 | Stable | Renewal in 45 days, plan in progress, moderate confidence |
| 15 | Fernback Industries | SMB | $12,800 | Critical | Churned 40 days ago — historical record for churn-pattern context |
| 16 | Osprey Cloud | Mid-Market | $67,000 | Strong | Renewed early with expansion — proof positive outcome |
| 17 | Cobalt & Iron | Enterprise | $175,000 | Watch | Data confidence: Low — missing usage data, flags the "don't mistake missing data for health" case |
| 18 | Loamfield Partners | SMB | $16,000 | Stable | Third open escalation — billing dispute |
| 19 | Wrenhouse Media | Mid-Market | $54,000 | Strong | Expansion opportunity — additional seats, mid-cycle |
| 20 | Saltbrush Tech | SMB | $11,200 | Critical | Inactive 55 days, no interaction on file — quiet churn risk |

Currency: all demo accounts in USD (single reporting currency, per `DECISIONS.md`/`DATA_MODEL.md` currency rule for phase 1).

## Supporting records (minimums the founder specified)

- **Risks**: ≥5 meaningful, spread across categories — Ridgeline (adoption decline + open critical issue), Solace (champion departure), Kestrel (executive sponsor disengagement), Fenwick (payment risk), Marrow (open critical issue), Cobalt & Iron (data quality concern).
- **Opportunities**: ≥3 expansion (Bramble & Finch, Wrenhouse, Palisade), ≥2 advocacy (Harlow & Rye, Palisade).
- **Escalations**: ≥3 open (Marrow critical bug, Loamfield billing dispute, Ridgeline unresolved priority tickets).
- **Interactions**: ≥8 recent, distributed across accounts with recent activity — deliberately sparse or absent on Cobalt & Iron (data confidence) and Saltbrush (inactivity risk).
- **Support tickets**: ≥20, weighted toward Ridgeline, Marrow, and Fenwick.
- **Feedback themes**: at least one clearly revenue-weighted theme built from Vantage Robotics' six feature requests plus similar requests on two other accounts, to demonstrate "feedback affecting the most revenue."
- **Renewed customers**: Osprey Cloud (early renewal + expansion), Coldwater Devices (standard renewal).
- **Churned customer**: Fernback Industries (historical, with a documented reason — not just a status flip).
- **Recovering customer**: Anchorpoint Systems, with a visible before/after health trend and a completed recovery action plan.
- **Data confidence variation**: Cobalt & Iron (low — missing usage data) versus Palisade Software (high — every source connected) so the portfolio view visibly shows the spread.

## Weekly Executive Brief

One generated brief exists for Northwind Analytics referencing this data directly: revenue at risk driven by Ridgeline + Marrow + Fenwick, new risk (Solace champion departure), a recovery (Anchorpoint), two renewals requiring attention (Greywolf, Ridgeline), the Vantage feature-request theme, and one overdue action.

## Guided demo mode

A presenter mode (Phase 11) that walks Rico through: the portfolio problem (Mission Control) → which accounts need attention and why (Risk Radar, using Ridgeline/Solace/Marrow) → evidence (Account Detail on Ridgeline) → recommended actions → the Executive Brief → "this is how Signal & State configures the platform for each company" (Health Model Configuration). Highlights and navigation only — it must not alter underlying data or interfere with the normal product for anyone using the demo org outside presenter mode. A one-click reset restores the seed state.

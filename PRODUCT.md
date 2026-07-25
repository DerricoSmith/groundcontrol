# Ground Control — Product

Ground Control is the software product of **Signal & State**, a customer intelligence and CX/Customer Success transformation company. This document defines what the product is, who it is for, and what it must never become.

## Company

**Signal & State** turns customer signals into action.

Signal & State sells three things:
1. **Consulting and managed services** — the Customer Intelligence Sprint, Managed Customer Intelligence, and Fractional Customer Executive Advisory.
2. **Ground Control** — the software platform that powers that delivery and, over time, sells directly.
3. **Judgment** — Rico's experience as an operator who scaled a company from zero to ~$40M ARR and advised across a $150M+ customer portfolio. The product exists to encode that judgment, not replace it.

## Product

**Ground Control gives growing B2B software companies a clear view of customer health, renewal risk, adoption, escalation context, customer feedback, expansion opportunity, and the action that should happen next.**

Outcome, stated simply: **see risk earlier, know what to do next.**

## Who it's for

Primary ICP: founder-led or growth-stage B2B software companies, roughly $2M–$30M ARR.

Typical shape of that company:
- 15–150 employees, 1–10 person CS team
- HubSpot or Salesforce; Stripe or another subscriber billing system; Zendesk or Intercom; product usage data living in a separate analytics tool
- Customer information scattered across 4+ systems, no single source of truth
- Renewals tracked in a spreadsheet or a CS lead's head
- Health scores that exist but are inconsistent — "gut feel with a number attached"
- No dedicated CS Ops leader
- Leadership cannot say, with evidence, which 10 accounts need attention this week
- Wants better retention, cannot justify a six-figure enterprise CS platform

## What the product is not

- Not a generic analytics dashboard.
- Not a CRM replacement — it reads from HubSpot/Salesforce, it does not replace them.
- Not a chatbot. Command-style AI interaction is secondary to structured evidence and explained scores.
- Not a black box. Every score, risk, and recommendation is traceable to source evidence.
- Not autonomous. AI drafts and recommends; a human approves anything that reaches a real customer or changes a deterministic number.

## The 18 executive questions the product must answer

1. Which customers are at risk? 2. Why? 3. How much revenue is exposed? 4. What changed recently? 5. Which risks are new? 6. Which are getting worse? 7. Which customers are recovering? 8. Which have expansion potential? 9. Which could become advocates/references? 10. What should the team do next? 11. Who owns each action? 12. Which actions are overdue? 13. What feedback is affecting the most revenue? 14. What should leadership know this week? 15. What patterns are appearing across the portfolio? 16. How confident should leadership be in the renewal forecast? 17. Are CS activities producing better outcomes? 18. Which problems need Product, Support, Sales, Finance, or executive involvement?

Every screen in the product should trace back to one or more of these questions. If a feature doesn't help answer one of them, it doesn't belong in the first release.

## Product areas (first commercial release)

Mission Control · Customer Portfolio · Account Detail · Risk Radar · Renewal Center · Opportunity Center · Voice of Customer · Actions · Executive Briefs · Data Imports · Integrations · Health Model Configuration · Organization Settings · Team Management · Audit Log · Demo Environment.

See `IMPLEMENTATION_PLAN.md` for what ships in the first release versus what is roadmap.

## Product principles

These govern every product decision. They are also recorded in `CLAUDE.md` for coding-time reference.

1. **Explain every score.** A number with no explanation is not intelligence, it's noise.
2. **Show evidence.** Every claim is traceable to a source record.
3. **Prioritize action over reporting.** The product should change what a CS team does this week, not just what they read.
4. **Protect customer trust.** Signal & State's own customers are trusting us with their customers' data. That trust is the business.
5. **Preserve human judgment.** AI interprets and recommends. People decide.
6. **Reduce operational noise.** Fewer, better signals beat more dashboards.
7. **Make executive information concise.** A brief an executive can read in five minutes is more valuable than a report that takes thirty.
8. **Never hide uncertainty.** Low data confidence is shown, not smoothed over.
9. **Build for consultants first, then self-service.** The first users are Signal & State consultants onboarding founding clients by hand. Self-service comes after the workflow is proven.
10. **Solve the smallest valuable problem before expanding.** Renewal risk visibility beats a platform that does everything shallowly.

## Language

See `DESIGN_SYSTEM.md` → Content & Language for the full guide. Short version: **Customer Account** is the company the client sells to. **Organization** is the Signal & State client using Ground Control. **User** is a person signed into Ground Control. Don't call things "clients," "subscribers," or "companies" interchangeably with these terms.

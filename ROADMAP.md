# Roadmap

What is not built, kept separate from what is, so the line stays visible.

## Not started

**Integrations.** Native connectors for Salesforce, HubSpot, Zendesk, Intercom, product analytics, and billing. CSV import is the only path today.

**Payment risk.** The twelfth risk rule exists in the catalog and reports itself permanently unavailable. It needs billing data no import provides.

**Business outcomes scoring.** The fifth health component is inert. It needs goal tracking and success plans.

**Automated delivery.** Executive brief by email or Slack, and scheduled distribution. Nothing is sent automatically today, by design; adding delivery means adding an explicit human approval step first.

**Voice of Customer.** Theme grouping across feedback and support with confirmation and dismissal. Partially possible from existing ticket and interaction data.

**Predictive modelling.** The renewal forecast is a rule-based confidence category. A validated predictive model would be a genuine addition, and nothing will be called predictive until one exists.

**Guided Setup and Assisted Setup.** Two onboarding paths beyond Quick Start.

**Row Level Security.** Policies written, not enabled. The blocker and the intended design are in SECURITY_REVIEW.md.

**SOC 2 and formal certification.**

**Subscription billing.** Stripe, plans, and self-service.

**Native mobile application.** The web product is responsive; there is no native app.

**Multilingual interface.**

**Benchmarking and custom reporting.**

**Autonomous actions.** Nothing acts without a person.

## Near term, if picked up next

1. Screen reader accessibility pass, the largest known gap.
2. Rate limiting on authentication and import endpoints before real traffic.
3. CSV formula injection prevention, before any customer-facing export ships.
4. A separate Neon branch for preview, once a Neon API key exists.
5. Tighter content security policy with a nonce.
6. Lead management view for the founder.

## Principles

- Nothing on this list is described as built anywhere on the site.
- No feature is called predictive without a validated model.
- No feature is called an agent without genuine autonomous multi-step action.
- Nothing ships that presents missing data as good news.

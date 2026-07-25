/**
 * Demo identity, in one place.
 *
 * Pure constants with no server dependency so both the public demo routes and
 * Client Components can import them. The slug is the single source of truth
 * for "which organization is the demo", and every demo code path resolves the
 * organization through it rather than accepting an id from a URL. That is what
 * makes it impossible to point a demo route at a real customer's organization.
 */

export const DEMO_ORGANIZATION_SLUG = "meridian-systems-demo";

export const DEMO_ORGANIZATION_NAME = "Meridian Systems";

/** Shown wherever demo data is displayed. Never omitted. */
export const DEMO_DISCLOSURE =
  "Every company, person, number, and event in this demonstration is fictional. Meridian Systems does not exist.";

export const DEMO_STEPS = [
  {
    key: "portfolio",
    href: "/demo",
    label: "Portfolio overview",
    question: "What is the shape of the customer base?",
    detail:
      "Fourteen fictional accounts, scored by the same deterministic model a real organization would use. Accounts that have never been scored are shown as unmeasured rather than healthy.",
  },
  {
    key: "revenue",
    href: "/demo",
    label: "Revenue at risk",
    question: "How much revenue needs attention, and where is it?",
    detail:
      "Revenue exposure is counted once per account, never once per risk, so the number matches what the business actually has at stake.",
  },
  {
    key: "account",
    href: "/demo/accounts",
    label: "Account evidence",
    question: "Why is this account at risk?",
    detail:
      "Open any account to see the component scores, their weights, their confidence, and the individual records behind each one.",
  },
  {
    key: "action",
    href: "/demo/actions",
    label: "Recommended action",
    question: "What should happen next, and who owns it?",
    detail:
      "Each suggested action carries the evidence from the risk that produced it. Nothing is sent to a customer automatically.",
  },
  {
    key: "renewal",
    href: "/demo/renewals",
    label: "Renewal context",
    question: "What is closing, and how confident are we?",
    detail:
      "Forecast confidence is a rule-based category with its contributing factors shown. It is not a prediction and is never described as one.",
  },
  {
    key: "brief",
    href: "/demo/brief",
    label: "Executive brief",
    question: "What should leadership do about it?",
    detail:
      "Sixteen sections assembled from counts, sums, and rules. The final section states plainly that no model wrote any of it.",
  },
] as const;

export type DemoStepKey = (typeof DEMO_STEPS)[number]["key"];

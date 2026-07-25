import type { EscalationCategory, EscalationSeverity, EscalationStatus } from "@prisma/client";

/**
 * Pure escalation vocabulary. Kept separate from `escalation-service.ts` so
 * Client Components can render the choices without pulling Prisma or
 * `server-only` into the browser bundle.
 */

export const ESCALATION_CATEGORIES: EscalationCategory[] = [
  "PRODUCT",
  "SUPPORT",
  "IMPLEMENTATION",
  "RELATIONSHIP",
  "COMMERCIAL",
  "BILLING",
  "SECURITY",
  "LEGAL",
  "EXECUTIVE",
  "OTHER",
];

export const ESCALATION_SEVERITIES: EscalationSeverity[] = ["LOW", "MODERATE", "HIGH", "CRITICAL"];

/** Statuses that mean the escalation is still live work. */
export const OPEN_ESCALATION_STATUSES: EscalationStatus[] = ["NEW", "INVESTIGATING", "ACTION_PLAN_ACTIVE", "MONITORING"];

export const CUSTOMER_COMMUNICATION_STATES = [
  { value: "none", label: "Not yet acknowledged to the customer" },
  { value: "acknowledged", label: "Acknowledged to the customer" },
  { value: "updating", label: "Customer receiving regular updates" },
  { value: "closed_with_customer", label: "Closed with the customer" },
] as const;

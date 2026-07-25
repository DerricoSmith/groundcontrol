/**
 * Contact reasons, shared between the public form and the lead service.
 * Kept free of server imports so the Client Component can render the options
 * without pulling Prisma into the browser bundle.
 */
export const REASONS = [
  { value: "review", label: "Book a Customer Intelligence Review" },
  { value: "sprint", label: "Customer Intelligence Sprint" },
  { value: "managed", label: "Managed Customer Intelligence" },
  { value: "transformation", label: "Customer Success and CX Transformation" },
  { value: "fractional", label: "Fractional Customer Executive Advisory" },
  { value: "pilot", label: "Ground Control Pilot" },
  { value: "recruiting", label: "Recruiting or hiring conversation" },
  { value: "investment", label: "Investment or partnership" },
  { value: "other", label: "Something else" },
] as const;

export const REASON_VALUES = REASONS.map((reason) => reason.value) as [string, ...string[]];

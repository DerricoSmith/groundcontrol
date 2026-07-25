import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export class LeadError extends Error {}

/**
 * Public lead intake.
 *
 * This is the only endpoint on the site an anonymous visitor can write to, so
 * it is the one with the most defensive validation. A submission is never
 * silently discarded: if it fails validation the visitor is told why, and if
 * it passes it is stored.
 */

import { REASON_VALUES } from "@/lib/services/lead-constants";

export { REASONS } from "@/lib/services/lead-constants";

/**
 * Free-email domains are allowed. Rejecting them would block real founders
 * using a personal address, which costs more than the noise it prevents.
 */
export const LeadInputSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(200),
  company: z.string().trim().max(160).optional(),
  role: z.string().trim().max(160).optional(),
  requestedService: z.enum(REASON_VALUES).optional(),
  primaryProblem: z.string().trim().max(2000).optional(),
  notes: z.string().trim().max(4000).optional(),
  sourcePage: z.string().trim().max(200).optional(),
});

export type LeadInput = z.infer<typeof LeadInputSchema>;

/** Submissions closer together than this from one address are treated as duplicates. */
const DUPLICATE_WINDOW_MS = 60_000;

export async function submitLead(input: unknown): Promise<{ id: string }> {
  const parsed = LeadInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new LeadError(parsed.error.issues[0]?.message ?? "Please check the form and try again.");
  }
  const data = parsed.data;

  // Rate limit by address rather than by IP: it is the field we actually have,
  // and it stops the common case of a double submit or a naive script loop.
  const recent = await prisma.lead.findFirst({
    where: { email: data.email, createdAt: { gt: new Date(Date.now() - DUPLICATE_WINDOW_MS) } },
    select: { id: true },
  });
  if (recent) {
    // Reported as success to the visitor, because from their point of view the
    // message did arrive. Returning an error would invite a retry loop.
    return { id: recent.id };
  }

  const lead = await prisma.lead.create({
    data: {
      name: data.name,
      email: data.email,
      company: data.company || null,
      role: data.role || null,
      requestedService: data.requestedService || null,
      primaryProblem: data.primaryProblem || null,
      notes: data.notes || null,
      sourcePage: data.sourcePage || null,
      consentGiven: true,
      status: "new",
    },
  });

  return { id: lead.id };
}

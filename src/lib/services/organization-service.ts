import "server-only";
import { prisma } from "@/lib/prisma";
import { recordAuditEvent } from "@/lib/services/audit-service";

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return base || "organization";
}

async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name);
  let candidate = base;
  let suffix = 1;
  // Small, bounded loop — org creation is rare enough that this is not a
  // performance concern, and it avoids a race-prone "check then insert".
  while (await prisma.organization.findUnique({ where: { slug: candidate } })) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}

/**
 * Creates a brand-new organization with its founding user as OWNER. This is
 * the only way an organization comes into existence in phase 1 — there is
 * no "join an existing organization by email domain" flow yet, and no
 * automatic demo-data seeding (that's a deliberate Phase-3 simplification;
 * full onboarding + demo seeding is Phase 11, see IMPLEMENTATION_PLAN.md).
 */
export async function createOrganizationForNewUser(params: {
  userId: string;
  organizationName: string;
  currency?: string;
}) {
  const slug = await uniqueSlug(params.organizationName);

  const organization = await prisma.organization.create({
    data: {
      name: params.organizationName,
      slug,
      currency: params.currency ?? "USD",
      memberships: {
        create: {
          userId: params.userId,
          role: "OWNER",
        },
      },
    },
  });

  await recordAuditEvent({
    organizationId: organization.id,
    actorUserId: params.userId,
    eventType: "organization_created",
    targetType: "Organization",
    targetId: organization.id,
    metadata: { name: organization.name },
  });

  return organization;
}

import { cache } from "react";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

export const ACTIVE_ORG_COOKIE = "gc_active_org";

export interface CurrentMembership {
  userId: string;
  userName: string;
  userEmail: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  isDemo: boolean;
  role: Role;
}

export interface AvailableOrganization {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  role: Role;
  isActive: boolean;
}

/**
 * Loads every membership the signed-in user holds, once per request
 * (memoized via cache()). Every other function on this page derives from
 * this single query so "which organizations can this user act as" is
 * computed exactly once per request.
 */
const loadMembershipsForCurrentUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return { userId: null as string | null, memberships: [] };

  const memberships = await prisma.membership.findMany({
    where: { userId: session.user.id },
    include: { organization: true, user: true },
    orderBy: { createdAt: "asc" },
  });

  return { userId: session.user.id, memberships };
});

/**
 * Resolves the user's *active* organization for this request. The active
 * organization is chosen from an httpOnly cookie (set only by
 * switchOrganizationAction, never by client script) and is always
 * re-validated against real membership rows here — a cookie value that no
 * longer corresponds to a membership (org access revoked, member removed)
 * is never trusted, and the resolver falls back to the user's oldest
 * remaining membership instead. This is the single choke point every
 * service function and page goes through to get an organizationId — never
 * accept an organizationId from client input for a mutation.
 */
export const getCurrentMembership = cache(async (): Promise<CurrentMembership | null> => {
  const { userId, memberships } = await loadMembershipsForCurrentUser();
  if (!userId || memberships.length === 0) return null;

  const cookieStore = await cookies();
  const requestedOrgId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;

  const requested = requestedOrgId ? memberships.find((m) => m.organizationId === requestedOrgId) : undefined;
  const active = requested ?? memberships[0];

  return {
    userId: active.user.id,
    userName: active.user.name,
    userEmail: active.user.email,
    organizationId: active.organization.id,
    organizationName: active.organization.name,
    organizationSlug: active.organization.slug,
    isDemo: active.organization.isDemo,
    role: active.role,
  };
});

/** Every organization the signed-in user belongs to, for the organization switcher. */
export const getAvailableOrganizations = cache(async (): Promise<AvailableOrganization[]> => {
  const [{ memberships }, current] = await Promise.all([loadMembershipsForCurrentUser(), getCurrentMembership()]);

  return memberships.map((m) => ({
    organizationId: m.organizationId,
    organizationName: m.organization.name,
    organizationSlug: m.organization.slug,
    role: m.role,
    isActive: m.organizationId === current?.organizationId,
  }));
});

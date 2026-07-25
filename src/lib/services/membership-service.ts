import "server-only";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assertCan } from "@/lib/auth/permissions";
import { recordAuditEvent } from "@/lib/services/audit-service";

export class MembershipError extends Error {}

const GRANTABLE_ROLES: Role[] = [
  "ADMINISTRATOR",
  "EXECUTIVE",
  "CS_LEADER",
  "CS_MANAGER",
  "ANALYST",
  "VIEWER",
  "SIGNAL_STATE_CONSULTANT",
];

async function countOwners(organizationId: string): Promise<number> {
  return prisma.membership.count({ where: { organizationId, role: "OWNER" } });
}

export interface ChangeMemberRoleParams {
  organizationId: string;
  membershipId: string;
  newRole: Role;
  actingUserId: string;
  actingRole: Role;
}

/**
 * Changes a member's role. Ownership itself is deliberately out of scope
 * here: this function can never promote someone to OWNER or demote an
 * existing OWNER — transferring ownership is a bigger, harder-to-reverse
 * decision than a routine role change and isn't built yet. That also means
 * "the final owner can never be demoted" is true by construction, not just
 * by a count check.
 */
export async function changeMemberRole(params: ChangeMemberRoleParams) {
  assertCan(params.actingRole, "change_member_roles");

  if (!GRANTABLE_ROLES.includes(params.newRole)) {
    throw new MembershipError("Ownership cannot be changed here.");
  }

  const membership = await prisma.membership.findFirst({
    where: { id: params.membershipId, organizationId: params.organizationId },
    include: { user: true },
  });
  if (!membership) throw new MembershipError("Member not found.");

  if (membership.role === "OWNER") {
    throw new MembershipError("The organization owner's role cannot be changed here.");
  }

  if (membership.role === params.newRole) {
    return membership;
  }

  const updated = await prisma.membership.update({
    where: { id: membership.id },
    data: { role: params.newRole },
  });

  await recordAuditEvent({
    organizationId: params.organizationId,
    actorUserId: params.actingUserId,
    eventType: "user_role_changed",
    targetType: "User",
    targetId: membership.userId,
    metadata: { email: membership.user.email, fromRole: membership.role, toRole: params.newRole },
  });

  return updated;
}

export interface RemoveMemberParams {
  organizationId: string;
  membershipId: string;
  actingUserId: string;
  actingRole: Role;
}

/**
 * Removes a member from an organization. An OWNER membership can only be
 * removed by another OWNER, and the last remaining OWNER can never be
 * removed — an organization must always have at least one owner. Removal
 * takes effect immediately: the next time getCurrentMembership() resolves
 * for the removed user, their now-deleted membership row simply won't be
 * found, so they lose access on their very next request without any
 * separate "revoke session" step.
 */
export async function removeMember(params: RemoveMemberParams) {
  assertCan(params.actingRole, "change_member_roles");

  const membership = await prisma.membership.findFirst({
    where: { id: params.membershipId, organizationId: params.organizationId },
    include: { user: true },
  });
  if (!membership) throw new MembershipError("Member not found.");

  if (membership.role === "OWNER") {
    if (params.actingRole !== "OWNER") {
      throw new MembershipError("Only an owner can remove another owner.");
    }
    const ownerCount = await countOwners(params.organizationId);
    if (ownerCount <= 1) {
      throw new MembershipError("An organization must have at least one owner — invite and promote a replacement before removing the last owner.");
    }
  }

  await prisma.membership.delete({ where: { id: membership.id } });

  await recordAuditEvent({
    organizationId: params.organizationId,
    actorUserId: params.actingUserId,
    eventType: "user_removed",
    targetType: "User",
    targetId: membership.userId,
    metadata: { email: membership.user.email, role: membership.role },
  });

  return { removedUserId: membership.userId };
}

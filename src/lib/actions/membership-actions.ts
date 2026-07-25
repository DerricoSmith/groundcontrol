"use server";

import { revalidatePath } from "next/cache";
import type { Role } from "@prisma/client";
import { getCurrentMembership } from "@/lib/auth/session";
import { changeMemberRole, MembershipError, removeMember } from "@/lib/services/membership-service";

export async function changeMemberRoleAction(membershipId: string, newRole: Role): Promise<{ error?: string }> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "You must be logged in." };

  try {
    await changeMemberRole({
      organizationId: membership.organizationId,
      membershipId,
      newRole,
      actingUserId: membership.userId,
      actingRole: membership.role,
    });
    revalidatePath("/organization/members");
    return {};
  } catch (error) {
    if (error instanceof MembershipError || error instanceof Error) return { error: error.message };
    throw error;
  }
}

export async function removeMemberAction(membershipId: string): Promise<{ error?: string }> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "You must be logged in." };

  try {
    await removeMember({
      organizationId: membership.organizationId,
      membershipId,
      actingUserId: membership.userId,
      actingRole: membership.role,
    });
    revalidatePath("/organization/members");
    return {};
  } catch (error) {
    if (error instanceof MembershipError || error instanceof Error) return { error: error.message };
    throw error;
  }
}

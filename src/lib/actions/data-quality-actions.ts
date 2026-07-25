"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/auth/session";
import { detectDataQualityIssues, resolveDataQualityIssue } from "@/lib/services/data-quality-service";
import { recalculateOrganizationHealth } from "@/lib/services/health-calculation-service";

export async function recalculateDataQualityAction(): Promise<{ error?: string; detected?: number; resolved?: number }> {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  try {
    await recalculateOrganizationHealth(membership.organizationId);
    const result = await detectDataQualityIssues({
      organizationId: membership.organizationId,
      actingUserId: membership.userId,
      actingRole: membership.role,
    });
    revalidatePath("/data-quality");
    revalidatePath("/mission-control");
    return result;
  } catch (error) {
    if (error instanceof Error) return { error: error.message };
    throw error;
  }
}

export async function resolveIssueAction(issueId: string, dismiss: boolean, reason?: string): Promise<{ error?: string }> {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  try {
    await resolveDataQualityIssue({
      organizationId: membership.organizationId,
      issueId,
      actingUserId: membership.userId,
      actingRole: membership.role,
      dismiss,
      dismissalReason: reason,
    });
    revalidatePath("/data-quality");
    return {};
  } catch (error) {
    if (error instanceof Error) return { error: error.message };
    throw error;
  }
}

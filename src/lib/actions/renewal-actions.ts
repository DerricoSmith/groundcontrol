"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ForecastCategory } from "@prisma/client";
import { getCurrentMembership } from "@/lib/auth/session";
import { createRenewalPlan, toggleMilestone, changeForecast, closeRenewal, RenewalError } from "@/lib/services/renewal-service";

function fail(error: unknown): { error: string } {
  if (error instanceof RenewalError || error instanceof Error) return { error: error.message };
  throw error;
}

export async function createRenewalPlanAction(renewalId: string): Promise<{ error?: string }> {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  try {
    await createRenewalPlan({
      organizationId: membership.organizationId,
      renewalId,
      actingUserId: membership.userId,
      actingRole: membership.role,
    });
    revalidatePath(`/renewals/${renewalId}`);
    revalidatePath("/renewals");
    return {};
  } catch (error) {
    return fail(error);
  }
}

export async function toggleMilestoneAction(renewalId: string, milestoneId: string, completed: boolean): Promise<{ error?: string }> {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  try {
    await toggleMilestone({
      organizationId: membership.organizationId,
      milestoneId,
      completed,
      actingUserId: membership.userId,
      actingRole: membership.role,
    });
    revalidatePath(`/renewals/${renewalId}`);
    return {};
  } catch (error) {
    return fail(error);
  }
}

export async function changeForecastAction(renewalId: string, toCategory: ForecastCategory, reason?: string): Promise<{ error?: string }> {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  try {
    await changeForecast({
      organizationId: membership.organizationId,
      renewalId,
      toCategory,
      reason,
      actingUserId: membership.userId,
      actingRole: membership.role,
    });
    revalidatePath(`/renewals/${renewalId}`);
    revalidatePath("/renewals");
    return {};
  } catch (error) {
    return fail(error);
  }
}

export async function closeRenewalAction(
  renewalId: string,
  outcome: "RENEWED" | "CHURNED",
  actualAmount?: number,
  closeReason?: string
): Promise<{ error?: string }> {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  try {
    await closeRenewal({
      organizationId: membership.organizationId,
      renewalId,
      outcome,
      actualAmount,
      closeReason,
      actingUserId: membership.userId,
      actingRole: membership.role,
    });
    revalidatePath(`/renewals/${renewalId}`);
    revalidatePath("/renewals");
    return {};
  } catch (error) {
    return fail(error);
  }
}

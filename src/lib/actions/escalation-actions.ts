"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { EscalationCategory, EscalationSeverity, EscalationStatus } from "@prisma/client";
import { getCurrentMembership } from "@/lib/auth/session";
import {
  createEscalation,
  updateEscalationStatus,
  assignEscalation,
  setCustomerCommunicationState,
  EscalationError,
} from "@/lib/services/escalation-service";

function fail(error: unknown): { error: string } {
  if (error instanceof EscalationError || error instanceof Error) return { error: error.message };
  throw error;
}

export async function createEscalationAction(
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const targetDate = String(formData.get("targetResolutionDate") ?? "").trim();

  try {
    await createEscalation({
      organizationId: membership.organizationId,
      customerAccountId: String(formData.get("customerAccountId") ?? ""),
      title: String(formData.get("title") ?? ""),
      category: String(formData.get("category") ?? "OTHER") as EscalationCategory,
      severity: String(formData.get("severity") ?? "MODERATE") as EscalationSeverity,
      description: String(formData.get("description") ?? ""),
      customerImpact: String(formData.get("customerImpact") ?? ""),
      targetResolutionDate: targetDate ? new Date(targetDate) : null,
      actingUserId: membership.userId,
      actingRole: membership.role,
    });
    revalidatePath("/escalations");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function updateEscalationStatusAction(
  escalationId: string,
  status: EscalationStatus,
  resolutionSummary?: string
): Promise<{ error?: string }> {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  try {
    await updateEscalationStatus({
      organizationId: membership.organizationId,
      escalationId,
      status,
      resolutionSummary,
      actingUserId: membership.userId,
      actingRole: membership.role,
    });
    revalidatePath("/escalations");
    return {};
  } catch (error) {
    return fail(error);
  }
}

export async function assignEscalationAction(escalationId: string, ownerId: string | null): Promise<{ error?: string }> {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  try {
    await assignEscalation({
      organizationId: membership.organizationId,
      escalationId,
      ownerId,
      actingUserId: membership.userId,
      actingRole: membership.role,
    });
    revalidatePath("/escalations");
    return {};
  } catch (error) {
    return fail(error);
  }
}

export async function setCommunicationStateAction(escalationId: string, state: string): Promise<{ error?: string }> {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  try {
    await setCustomerCommunicationState({
      organizationId: membership.organizationId,
      escalationId,
      state,
      actingUserId: membership.userId,
      actingRole: membership.role,
    });
    revalidatePath("/escalations");
    return {};
  } catch (error) {
    return fail(error);
  }
}

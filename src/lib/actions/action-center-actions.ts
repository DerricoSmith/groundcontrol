"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionStatus } from "@prisma/client";
import { getCurrentMembership } from "@/lib/auth/session";
import { changeActionStatus, assignAction, generateSuggestedActions, ActionError } from "@/lib/services/action-service";

function fail(error: unknown): { error: string } {
  if (error instanceof ActionError || error instanceof Error) return { error: error.message };
  throw error;
}

export async function generateSuggestedActionsAction(): Promise<{ error?: string; created?: number }> {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  try {
    const result = await generateSuggestedActions({
      organizationId: membership.organizationId,
      actingUserId: membership.userId,
      actingRole: membership.role,
    });
    revalidatePath("/actions");
    return result;
  } catch (error) {
    return fail(error);
  }
}

export async function changeActionStatusAction(actionId: string, toStatus: ActionStatus, note?: string): Promise<{ error?: string }> {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  try {
    await changeActionStatus({
      organizationId: membership.organizationId,
      actionId,
      toStatus,
      note,
      actingUserId: membership.userId,
      actingRole: membership.role,
    });
    revalidatePath("/actions");
    return {};
  } catch (error) {
    return fail(error);
  }
}

export async function assignActionAction(actionId: string, ownerId: string | null): Promise<{ error?: string }> {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  try {
    await assignAction({
      organizationId: membership.organizationId,
      actionId,
      ownerId,
      actingUserId: membership.userId,
      actingRole: membership.role,
    });
    revalidatePath("/actions");
    return {};
  } catch (error) {
    return fail(error);
  }
}

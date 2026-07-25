"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { RiskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentMembership } from "@/lib/auth/session";
import { assertCan } from "@/lib/auth/permissions";
import { recordAuditEvent } from "@/lib/services/audit-service";
import { evaluateOrganizationRisks } from "@/lib/services/risk-engine";

export async function runRiskEvaluationAction(): Promise<{ error?: string; created?: number; updated?: number; resolved?: number }> {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  try {
    const result = await evaluateOrganizationRisks({
      organizationId: membership.organizationId,
      actingUserId: membership.userId,
      actingRole: membership.role,
      triggerSource: "manual",
    });
    revalidatePath("/risks");
    revalidatePath("/mission-control");
    return { created: result.risksCreated, updated: result.risksUpdated, resolved: result.risksResolved };
  } catch (error) {
    if (error instanceof Error) return { error: error.message };
    throw error;
  }
}

/**
 * Changes a risk's status. Dismissal requires a reason and resolution
 * requires a note — a risk that simply disappears with no explanation
 * destroys the audit trail the product exists to provide.
 */
export async function changeRiskStatusAction(params: {
  riskId: string;
  toStatus: RiskStatus;
  note?: string;
}): Promise<{ error?: string }> {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  try {
    assertCan(membership.role, "manage_actions");

    if (params.toStatus === "DISMISSED" && !params.note?.trim()) {
      return { error: "Dismissing a risk requires a reason." };
    }
    if (params.toStatus === "RESOLVED" && !params.note?.trim()) {
      return { error: "Resolving a risk requires a resolution note." };
    }

    const risk = await prisma.riskSignal.findFirst({
      where: { id: params.riskId, organizationId: membership.organizationId },
    });
    if (!risk) return { error: "Risk not found." };

    await prisma.$transaction([
      prisma.riskSignal.update({
        where: { id: risk.id },
        data: {
          status: params.toStatus,
          resolvedAt: params.toStatus === "RESOLVED" ? new Date() : null,
          resolutionNote: params.toStatus === "RESOLVED" ? params.note : risk.resolutionNote,
          dismissalReason: params.toStatus === "DISMISSED" ? params.note : risk.dismissalReason,
        },
      }),
      prisma.riskStatusChange.create({
        data: {
          organizationId: membership.organizationId,
          riskSignalId: risk.id,
          fromStatus: risk.status,
          toStatus: params.toStatus,
          reason: params.note,
          changedById: membership.userId,
        },
      }),
    ]);

    await recordAuditEvent({
      organizationId: membership.organizationId,
      actorUserId: membership.userId,
      eventType: params.toStatus === "RESOLVED" ? "risk_resolved" : "risk_updated",
      targetType: "RiskSignal",
      targetId: risk.id,
      metadata: { fromStatus: risk.status, toStatus: params.toStatus },
    });

    revalidatePath("/risks");
    revalidatePath(`/risks/${risk.id}`);
    return {};
  } catch (error) {
    if (error instanceof Error) return { error: error.message };
    throw error;
  }
}

export async function assignRiskOwnerAction(riskId: string, ownerId: string | null): Promise<{ error?: string }> {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  try {
    assertCan(membership.role, "manage_actions");
    const risk = await prisma.riskSignal.findFirst({
      where: { id: riskId, organizationId: membership.organizationId },
    });
    if (!risk) return { error: "Risk not found." };

    // An owner must be a member of this organization — never accept an
    // arbitrary user id from the client.
    if (ownerId) {
      const membershipExists = await prisma.membership.findUnique({
        where: { userId_organizationId: { userId: ownerId, organizationId: membership.organizationId } },
      });
      if (!membershipExists) return { error: "That user is not a member of this organization." };
    }

    await prisma.riskSignal.update({ where: { id: risk.id }, data: { ownerId } });
    revalidatePath("/risks");
    return {};
  } catch (error) {
    if (error instanceof Error) return { error: error.message };
    throw error;
  }
}

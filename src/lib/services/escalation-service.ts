import "server-only";
import type { EscalationCategory, EscalationSeverity, EscalationStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assertCan } from "@/lib/auth/permissions";
import { recordAuditEvent } from "@/lib/services/audit-service";
import { CUSTOMER_COMMUNICATION_STATES, OPEN_ESCALATION_STATUSES } from "@/lib/services/escalation-constants";

export class EscalationError extends Error {}

/**
 * Escalations are entered by people, not inferred. An escalation is a claim
 * that something is seriously wrong for a customer, and the product must never
 * manufacture that claim from indirect signals. The risk engine reads open
 * escalations; it does not create them.
 */

export {
  ESCALATION_CATEGORIES,
  ESCALATION_SEVERITIES,
  OPEN_ESCALATION_STATUSES,
  CUSTOMER_COMMUNICATION_STATES,
} from "@/lib/services/escalation-constants";

export async function createEscalation(params: {
  organizationId: string;
  customerAccountId: string;
  title: string;
  category: EscalationCategory;
  severity: EscalationSeverity;
  description: string;
  customerImpact?: string;
  targetResolutionDate?: Date | null;
  ownerId?: string | null;
  actingUserId: string;
  actingRole: Role;
}) {
  assertCan(params.actingRole, "manage_actions");

  if (!params.title.trim()) throw new EscalationError("An escalation needs a title.");
  if (!params.description.trim()) {
    throw new EscalationError("An escalation needs a description. Someone reading this later must be able to tell what happened.");
  }

  const account = await prisma.customerAccount.findFirst({
    where: { id: params.customerAccountId, organizationId: params.organizationId },
    select: { id: true, arr: true },
  });
  if (!account) throw new EscalationError("Account not found in this organization.");

  if (params.ownerId) {
    await assertMember(params.organizationId, params.ownerId);
  }

  const escalation = await prisma.escalation.create({
    data: {
      organizationId: params.organizationId,
      customerAccountId: account.id,
      title: params.title.trim(),
      category: params.category,
      severity: params.severity,
      description: params.description.trim(),
      customerImpact: params.customerImpact?.trim() || null,
      targetResolutionDate: params.targetResolutionDate ?? null,
      ownerId: params.ownerId ?? null,
      // Revenue exposure is the account's ARR: the amount that is in the room
      // during this escalation. It is not a prediction of loss.
      revenueExposure: account.arr,
      customerCommunicationState: "none",
    },
  });

  await recordAuditEvent({
    organizationId: params.organizationId,
    actorUserId: params.actingUserId,
    eventType: "escalation_opened",
    targetType: "Escalation",
    targetId: escalation.id,
    metadata: { category: params.category, severity: params.severity },
  });

  return escalation;
}

export async function updateEscalationStatus(params: {
  organizationId: string;
  escalationId: string;
  status: EscalationStatus;
  resolutionSummary?: string;
  actingUserId: string;
  actingRole: Role;
}) {
  assertCan(params.actingRole, "manage_actions");

  const escalation = await prisma.escalation.findFirst({
    where: { id: params.escalationId, organizationId: params.organizationId },
  });
  if (!escalation) throw new EscalationError("Escalation not found.");

  const isClosing = params.status === "RESOLVED" || params.status === "CLOSED";
  if (isClosing && !params.resolutionSummary?.trim()) {
    throw new EscalationError("Closing an escalation requires a resolution summary.");
  }

  const updated = await prisma.escalation.update({
    where: { id: escalation.id },
    data: {
      status: params.status,
      resolvedAt: isClosing ? (escalation.resolvedAt ?? new Date()) : null,
      resolutionSummary: isClosing ? params.resolutionSummary!.trim() : escalation.resolutionSummary,
    },
  });

  await recordAuditEvent({
    organizationId: params.organizationId,
    actorUserId: params.actingUserId,
    eventType: isClosing ? "escalation_resolved" : "escalation_updated",
    targetType: "Escalation",
    targetId: escalation.id,
    metadata: { fromStatus: escalation.status, toStatus: params.status },
  });

  return updated;
}

export async function assignEscalation(params: {
  organizationId: string;
  escalationId: string;
  ownerId: string | null;
  executiveOwnerId?: string | null;
  actingUserId: string;
  actingRole: Role;
}) {
  assertCan(params.actingRole, "manage_actions");

  const escalation = await prisma.escalation.findFirst({
    where: { id: params.escalationId, organizationId: params.organizationId },
  });
  if (!escalation) throw new EscalationError("Escalation not found.");

  if (params.ownerId) await assertMember(params.organizationId, params.ownerId);
  if (params.executiveOwnerId) await assertMember(params.organizationId, params.executiveOwnerId);

  const updated = await prisma.escalation.update({
    where: { id: escalation.id },
    data: {
      ownerId: params.ownerId,
      executiveOwnerId: params.executiveOwnerId === undefined ? escalation.executiveOwnerId : params.executiveOwnerId,
    },
  });

  await recordAuditEvent({
    organizationId: params.organizationId,
    actorUserId: params.actingUserId,
    eventType: "escalation_updated",
    targetType: "Escalation",
    targetId: escalation.id,
    metadata: { ownerAssigned: Boolean(params.ownerId) },
  });

  return updated;
}

export async function setCustomerCommunicationState(params: {
  organizationId: string;
  escalationId: string;
  state: string;
  actingUserId: string;
  actingRole: Role;
}) {
  assertCan(params.actingRole, "manage_actions");

  if (!CUSTOMER_COMMUNICATION_STATES.some((s) => s.value === params.state)) {
    throw new EscalationError("Unrecognized customer communication state.");
  }

  const escalation = await prisma.escalation.findFirst({
    where: { id: params.escalationId, organizationId: params.organizationId },
    select: { id: true },
  });
  if (!escalation) throw new EscalationError("Escalation not found.");

  // This records what a person says has happened with the customer. Ground
  // Control never contacts a customer itself.
  return prisma.escalation.update({
    where: { id: escalation.id },
    data: { customerCommunicationState: params.state },
  });
}

export interface EscalationSummary {
  openCount: number;
  criticalCount: number;
  overdueCount: number;
  unownedCount: number;
  revenueExposure: number;
}

export async function getEscalationSummary(organizationId: string): Promise<EscalationSummary> {
  const open = await prisma.escalation.findMany({
    where: { organizationId, status: { in: OPEN_ESCALATION_STATUSES } },
    select: { severity: true, ownerId: true, targetResolutionDate: true, revenueExposure: true },
  });

  const now = new Date();
  return {
    openCount: open.length,
    criticalCount: open.filter((e) => e.severity === "CRITICAL").length,
    overdueCount: open.filter((e) => e.targetResolutionDate !== null && e.targetResolutionDate < now).length,
    unownedCount: open.filter((e) => e.ownerId === null).length,
    revenueExposure: open.reduce((sum, e) => sum + e.revenueExposure, 0),
  };
}

async function assertMember(organizationId: string, userId: string): Promise<void> {
  // Never trust a client-supplied user id: it must be a real member here.
  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
  });
  if (!membership) throw new EscalationError("That user is not a member of this organization.");
}

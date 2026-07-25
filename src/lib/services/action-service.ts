import "server-only";
import type { ActionStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assertCan } from "@/lib/auth/permissions";
import { recordAuditEvent } from "@/lib/services/audit-service";

export class ActionError extends Error {}

export const ACTION_TYPES = [
  "executive_outreach",
  "customer_meeting",
  "recovery_plan",
  "adoption_plan",
  "renewal_planning",
  "expansion_conversation",
  "support_escalation",
  "product_follow_up",
  "payment_follow_up",
  "stakeholder_mapping",
  "success_plan_update",
  "training",
  "reference_request",
  "survey_follow_up",
  "internal_alignment",
  "data_correction",
  "custom_action",
] as const;
export type ActionType = (typeof ACTION_TYPES)[number];

export const ACTION_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  ACTION_TYPES.map((t) => [t, t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())])
);

/**
 * Generates suggested actions from open risks. Suggestions are created once
 * per (account, risk rule) via suggestionKey, so repeated risk evaluations
 * never bury a user in duplicates.
 *
 * Nothing here sends anything to a customer. A suggested action is an
 * internal to-do, and any customer-facing communication would require a
 * separate, human-approved step that does not exist yet.
 */
export async function generateSuggestedActions(params: {
  organizationId: string;
  actingUserId: string;
  actingRole: Role;
}): Promise<{ created: number }> {
  assertCan(params.actingRole, "manage_actions");

  const openRisks = await prisma.riskSignal.findMany({
    where: { organizationId: params.organizationId, status: { in: ["NEW", "OPEN", "MONITORING"] }, ruleKey: { not: null } },
    include: { customerAccount: { select: { name: true } } },
  });

  let created = 0;

  for (const risk of openRisks) {
    const suggestionKey = `risk:${risk.ruleKey}`;
    const existing = await prisma.recommendedAction.findFirst({
      where: { customerAccountId: risk.customerAccountId, suggestionKey },
    });
    if (existing) continue;

    await prisma.recommendedAction.create({
      data: {
        organizationId: params.organizationId,
        customerAccountId: risk.customerAccountId,
        riskSignalId: risk.id,
        suggestionKey,
        title: risk.recommendedResponse,
        actionType: inferActionType(risk.category),
        reason: risk.currentState,
        evidence: risk.evidence as string[],
        priority: risk.severity === "CRITICAL" ? "urgent" : risk.severity === "HIGH" ? "high" : "normal",
        status: "SUGGESTED",
        source: "risk_rule",
      },
    });
    created++;
  }

  return { created };
}

function inferActionType(riskCategory: string): ActionType {
  switch (riskCategory) {
    case "adoption_decline":
    case "low_adoption":
      return "adoption_plan";
    case "relationship_gap":
      return "customer_meeting";
    case "executive_disengagement":
    case "customer_inactivity":
      return "executive_outreach";
    case "champion_departure":
      return "stakeholder_mapping";
    case "support_deterioration":
    case "unresolved_escalation":
      return "support_escalation";
    case "renewal_planning_gap":
      return "renewal_planning";
    case "missing_renewal_date":
      return "data_correction";
    case "negative_sentiment":
      return "recovery_plan";
    default:
      return "custom_action";
  }
}

export async function changeActionStatus(params: {
  organizationId: string;
  actionId: string;
  toStatus: ActionStatus;
  note?: string;
  actingUserId: string;
  actingRole: Role;
}) {
  assertCan(params.actingRole, "manage_actions");

  const action = await prisma.recommendedAction.findFirst({
    where: { id: params.actionId, organizationId: params.organizationId },
  });
  if (!action) throw new ActionError("Action not found.");

  if (params.toStatus === "BLOCKED" && !params.note?.trim()) {
    throw new ActionError("Blocking an action requires a reason.");
  }

  const [updated] = await prisma.$transaction([
    prisma.recommendedAction.update({
      where: { id: action.id },
      data: {
        status: params.toStatus,
        completedAt: params.toStatus === "COMPLETED" ? new Date() : null,
        blockedReason: params.toStatus === "BLOCKED" ? params.note : action.blockedReason,
        actualOutcome: params.toStatus === "COMPLETED" ? (params.note ?? action.actualOutcome) : action.actualOutcome,
      },
    }),
    prisma.actionStatusChange.create({
      data: {
        organizationId: params.organizationId,
        actionId: action.id,
        fromStatus: action.status,
        toStatus: params.toStatus,
        note: params.note,
        changedById: params.actingUserId,
      },
    }),
  ]);

  await recordAuditEvent({
    organizationId: params.organizationId,
    actorUserId: params.actingUserId,
    eventType: params.toStatus === "COMPLETED" ? "action_completed" : "action_assigned",
    targetType: "RecommendedAction",
    targetId: action.id,
    metadata: { fromStatus: action.status, toStatus: params.toStatus },
  });

  return updated;
}

export async function assignAction(params: {
  organizationId: string;
  actionId: string;
  ownerId: string | null;
  dueDate?: Date | null;
  actingUserId: string;
  actingRole: Role;
}) {
  assertCan(params.actingRole, "manage_actions");

  const action = await prisma.recommendedAction.findFirst({
    where: { id: params.actionId, organizationId: params.organizationId },
  });
  if (!action) throw new ActionError("Action not found.");

  // Never trust a client-supplied user id: it must be a real member here.
  if (params.ownerId) {
    const membership = await prisma.membership.findUnique({
      where: { userId_organizationId: { userId: params.ownerId, organizationId: params.organizationId } },
    });
    if (!membership) throw new ActionError("That user is not a member of this organization.");
  }

  const updated = await prisma.recommendedAction.update({
    where: { id: action.id },
    data: {
      ownerId: params.ownerId,
      dueDate: params.dueDate === undefined ? action.dueDate : params.dueDate,
      // Assigning a suggested action is what turns it into real work.
      status: action.status === "SUGGESTED" && params.ownerId ? "OPEN" : action.status,
    },
  });

  await recordAuditEvent({
    organizationId: params.organizationId,
    actorUserId: params.actingUserId,
    eventType: "action_assigned",
    targetType: "RecommendedAction",
    targetId: action.id,
    metadata: { ownerAssigned: Boolean(params.ownerId) },
  });

  return updated;
}

export async function addActionComment(params: {
  organizationId: string;
  actionId: string;
  body: string;
  actingUserId: string;
  actingRole: Role;
}) {
  assertCan(params.actingRole, "manage_actions");
  if (!params.body.trim()) throw new ActionError("A comment cannot be empty.");

  const action = await prisma.recommendedAction.findFirst({
    where: { id: params.actionId, organizationId: params.organizationId },
  });
  if (!action) throw new ActionError("Action not found.");

  return prisma.actionComment.create({
    data: {
      organizationId: params.organizationId,
      actionId: action.id,
      body: params.body.trim(),
      authorId: params.actingUserId,
    },
  });
}

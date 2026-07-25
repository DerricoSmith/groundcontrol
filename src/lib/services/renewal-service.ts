import "server-only";
import type { ForecastCategory, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assertCan } from "@/lib/auth/permissions";
import { recordAuditEvent } from "@/lib/services/audit-service";

/**
 * Renewal planning and forecast confidence.
 *
 * Milestones are a fixed ordered list rather than a configurable workflow —
 * the founder explicitly excluded a general workflow builder. Forecast
 * confidence is a documented weighted sum of observable factors, and the
 * factors are always returned alongside the number so it can be explained.
 * It is not a prediction and is never described as one.
 */

export const RENEWAL_MILESTONES = [
  { key: "internal_strategy", label: "Internal strategy complete" },
  { key: "customer_goals_reviewed", label: "Customer goals reviewed" },
  { key: "adoption_reviewed", label: "Adoption reviewed" },
  { key: "risks_reviewed", label: "Risks reviewed" },
  { key: "executive_alignment", label: "Executive alignment complete" },
  { key: "commercial_position", label: "Commercial position confirmed" },
  { key: "proposal_prepared", label: "Renewal proposal prepared" },
  { key: "proposal_delivered", label: "Customer proposal delivered" },
  { key: "legal_review", label: "Legal review complete" },
  { key: "procurement", label: "Procurement complete" },
  { key: "decision_received", label: "Renewal decision received" },
] as const;

export class RenewalError extends Error {}

export interface ConfidenceFactor {
  label: string;
  contribution: number;
  detail: string;
}

export interface ForecastConfidence {
  score: number; // 0–1
  factors: ConfidenceFactor[];
  explanation: string;
}

/**
 * Confidence is the weighted sum of factors we can actually observe. Each
 * factor's contribution is reported so the number is never a black box.
 */
export async function calculateForecastConfidence(renewalId: string, now = new Date()): Promise<ForecastConfidence> {
  const renewal = await prisma.renewal.findUniqueOrThrow({
    where: { id: renewalId },
    include: { plan: { include: { milestones: true } }, customerAccount: true },
  });

  const [openRisks, recentInteractions, forecastChanges] = await Promise.all([
    prisma.riskSignal.count({
      where: { customerAccountId: renewal.customerAccountId, status: { in: ["NEW", "OPEN", "MONITORING"] } },
    }),
    prisma.customerInteraction.count({
      where: {
        customerAccountId: renewal.customerAccountId,
        interactionDate: { gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.renewalForecastChange.count({
      where: { renewalId, createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } },
    }),
  ]);

  const factors: ConfidenceFactor[] = [];

  // Data completeness (0.2)
  const hasArr = renewal.arr > 0;
  const dataScore = (hasArr ? 0.1 : 0) + (renewal.customerAccount.dataConfidence >= 0.5 ? 0.1 : 0);
  factors.push({
    label: "Data completeness",
    contribution: dataScore,
    detail: `Recurring revenue ${hasArr ? "on file" : "missing"}; account data confidence ${Math.round(renewal.customerAccount.dataConfidence * 100)} percent.`,
  });

  // Renewal plan completeness (0.25)
  const milestones = renewal.plan?.milestones ?? [];
  const completed = milestones.filter((m) => m.completed).length;
  const planScore = milestones.length > 0 ? (completed / milestones.length) * 0.25 : 0;
  factors.push({
    label: "Renewal plan completeness",
    contribution: planScore,
    detail: milestones.length > 0 ? `${completed} of ${milestones.length} milestones complete.` : "No renewal plan exists.",
  });

  // Customer engagement (0.2)
  const engagementScore = recentInteractions >= 3 ? 0.2 : recentInteractions > 0 ? 0.1 : 0;
  factors.push({
    label: "Customer engagement",
    contribution: engagementScore,
    detail: `${recentInteractions} interaction${recentInteractions === 1 ? "" : "s"} recorded in the last 90 days.`,
  });

  // Commercial progress (0.2)
  const advancedStatuses = ["VERBAL_COMMITMENT", "PROCUREMENT", "LEGAL_REVIEW", "COMMERCIAL_REVIEW"];
  const commercialScore = advancedStatuses.includes(renewal.status) ? 0.2 : renewal.status === "CUSTOMER_DISCUSSION" ? 0.1 : 0;
  factors.push({
    label: "Commercial progress",
    contribution: commercialScore,
    detail: `Renewal status is ${renewal.status.replace(/_/g, " ").toLowerCase()}.`,
  });

  // Open risks reduce confidence (up to -0.15)
  const riskPenalty = Math.min(0.15, openRisks * 0.05);
  factors.push({
    label: "Open risks",
    contribution: -riskPenalty,
    detail: `${openRisks} open risk${openRisks === 1 ? "" : "s"} on this account.`,
  });

  // Recent forecast churn reduces confidence (up to -0.1)
  const churnPenalty = Math.min(0.1, forecastChanges * 0.05);
  factors.push({
    label: "Forecast stability",
    contribution: -churnPenalty,
    detail: `${forecastChanges} forecast change${forecastChanges === 1 ? "" : "s"} in the last 30 days.`,
  });

  // Customer intent, when recorded (0.15)
  const intentScore = renewal.customerIntent ? 0.15 : 0;
  factors.push({
    label: "Customer intent",
    contribution: intentScore,
    detail: renewal.customerIntent ? `Recorded intent: ${renewal.customerIntent}` : "No customer intent recorded.",
  });

  const raw = factors.reduce((sum, f) => sum + f.contribution, 0);
  const score = Math.max(0, Math.min(1, raw));

  const positives = factors.filter((f) => f.contribution > 0).map((f) => f.label.toLowerCase());
  const negatives = factors.filter((f) => f.contribution < 0).map((f) => f.label.toLowerCase());

  const explanation = `Confidence of ${Math.round(score * 100)} percent, based on ${
    positives.length > 0 ? positives.join(", ") : "no positive factors"
  }${negatives.length > 0 ? `, reduced by ${negatives.join(" and ")}` : ""}. This is a weighted summary of recorded facts, not a prediction.`;

  return { score, factors, explanation };
}

export async function createRenewalPlan(params: {
  organizationId: string;
  renewalId: string;
  actingUserId: string;
  actingRole: Role;
}) {
  assertCan(params.actingRole, "manage_actions");

  const renewal = await prisma.renewal.findFirst({
    where: { id: params.renewalId, organizationId: params.organizationId },
    include: { plan: true },
  });
  if (!renewal) throw new RenewalError("Renewal not found.");
  if (renewal.plan) return renewal.plan;

  const plan = await prisma.renewalPlan.create({
    data: {
      organizationId: params.organizationId,
      renewalId: renewal.id,
      ownerId: renewal.ownerId,
      milestones: {
        create: RENEWAL_MILESTONES.map((m, index) => ({
          organizationId: params.organizationId,
          key: m.key,
          label: m.label,
          order: index,
        })),
      },
    },
    include: { milestones: true },
  });

  await prisma.renewal.update({ where: { id: renewal.id }, data: { status: "PLANNING" } });

  await recordAuditEvent({
    organizationId: params.organizationId,
    actorUserId: params.actingUserId,
    eventType: "action_assigned",
    targetType: "RenewalPlan",
    targetId: plan.id,
    metadata: { renewalId: renewal.id },
  });

  return plan;
}

export async function toggleMilestone(params: {
  organizationId: string;
  milestoneId: string;
  completed: boolean;
  actingUserId: string;
  actingRole: Role;
}) {
  assertCan(params.actingRole, "manage_actions");

  const milestone = await prisma.renewalMilestone.findFirst({
    where: { id: params.milestoneId, organizationId: params.organizationId },
  });
  if (!milestone) throw new RenewalError("Milestone not found.");

  return prisma.renewalMilestone.update({
    where: { id: milestone.id },
    data: {
      completed: params.completed,
      completedAt: params.completed ? new Date() : null,
      completedById: params.completed ? params.actingUserId : null,
    },
  });
}

export async function changeForecast(params: {
  organizationId: string;
  renewalId: string;
  toCategory: ForecastCategory;
  reason?: string;
  actingUserId: string;
  actingRole: Role;
}) {
  assertCan(params.actingRole, "manage_actions");

  const renewal = await prisma.renewal.findFirst({
    where: { id: params.renewalId, organizationId: params.organizationId },
  });
  if (!renewal) throw new RenewalError("Renewal not found.");

  const confidence = await calculateForecastConfidence(renewal.id);

  await prisma.$transaction([
    prisma.renewal.update({
      where: { id: renewal.id },
      data: { forecastCategory: params.toCategory, forecastConfidence: confidence.score },
    }),
    // Append-only history: a forecast that moved is itself information.
    prisma.renewalForecastChange.create({
      data: {
        organizationId: params.organizationId,
        renewalId: renewal.id,
        fromCategory: renewal.forecastCategory,
        toCategory: params.toCategory,
        fromConfidence: renewal.forecastConfidence,
        toConfidence: confidence.score,
        reason: params.reason,
        changedById: params.actingUserId,
      },
    }),
  ]);

  await recordAuditEvent({
    organizationId: params.organizationId,
    actorUserId: params.actingUserId,
    eventType: "risk_updated",
    targetType: "Renewal",
    targetId: renewal.id,
    metadata: { fromCategory: renewal.forecastCategory, toCategory: params.toCategory },
  });

  return confidence;
}

export async function closeRenewal(params: {
  organizationId: string;
  renewalId: string;
  outcome: "RENEWED" | "CHURNED";
  actualAmount?: number;
  closeReason?: string;
  actingUserId: string;
  actingRole: Role;
}) {
  assertCan(params.actingRole, "manage_actions");

  if (params.outcome === "CHURNED" && !params.closeReason?.trim()) {
    throw new RenewalError("Closing a renewal as churned requires a reason.");
  }

  const renewal = await prisma.renewal.findFirst({
    where: { id: params.renewalId, organizationId: params.organizationId },
  });
  if (!renewal) throw new RenewalError("Renewal not found.");

  const updated = await prisma.renewal.update({
    where: { id: renewal.id },
    data: {
      status: params.outcome,
      forecastCategory: params.outcome,
      actualAmount: params.actualAmount,
      closeReason: params.closeReason,
      closedAt: new Date(),
    },
  });

  await recordAuditEvent({
    organizationId: params.organizationId,
    actorUserId: params.actingUserId,
    eventType: "risk_resolved",
    targetType: "Renewal",
    targetId: renewal.id,
    metadata: { outcome: params.outcome, actualAmount: params.actualAmount ?? 0 },
  });

  return updated;
}

export async function createManualRenewal(params: {
  organizationId: string;
  customerAccountId: string;
  renewalDate: Date;
  arr: number;
  currency: string;
  actingUserId: string;
  actingRole: Role;
}) {
  assertCan(params.actingRole, "manage_actions");

  const account = await prisma.customerAccount.findFirst({
    where: { id: params.customerAccountId, organizationId: params.organizationId },
  });
  if (!account) throw new RenewalError("Customer account not found in this organization.");

  const periodStart = new Date(params.renewalDate);
  periodStart.setFullYear(periodStart.getFullYear() - 1);

  const renewal = await prisma.renewal.create({
    data: {
      organizationId: params.organizationId,
      customerAccountId: params.customerAccountId,
      periodStart,
      periodEnd: params.renewalDate,
      arr: params.arr,
      currency: params.currency,
    },
  });

  if (!account.renewalDate || params.renewalDate < account.renewalDate) {
    await prisma.customerAccount.update({
      where: { id: account.id },
      data: { renewalDate: params.renewalDate },
    });
  }

  await recordAuditEvent({
    organizationId: params.organizationId,
    actorUserId: params.actingUserId,
    eventType: "data_imported",
    targetType: "Renewal",
    targetId: renewal.id,
    metadata: { source: "manual" },
  });

  return renewal;
}

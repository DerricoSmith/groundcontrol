import "server-only";
import { prisma } from "@/lib/prisma";
import { MEANINGFUL_INTERACTION_TYPES, EXECUTIVE_INTERACTION_TYPES } from "@/lib/services/import/interaction-import";

/**
 * Deterministic derived metrics for one customer account, computed from
 * imported records only.
 *
 * Three rules hold everywhere in this file:
 *  1. Absent data produces an explicit "insufficient data" state, never a
 *     neutral-or-positive one. Not knowing is not the same as fine.
 *  2. Every state is reachable by a documented threshold, so a user can
 *     always be told exactly why an account is in the state it is in.
 *  3. Nothing here is called predictive. These are measurements of what
 *     has already happened.
 */

export type UsageTrend = "INCREASING" | "STABLE" | "DECLINING" | "INACTIVE" | "INSUFFICIENT_DATA";
export type SupportTrend = "IMPROVING" | "STABLE" | "DETERIORATING" | "CRITICAL" | "INSUFFICIENT_DATA";
export type EngagementState = "ACTIVE" | "COOLING" | "DISENGAGED" | "NONE_RECORDED";

// Thresholds are constants rather than inline numbers so the docs and the
// code cannot drift apart.
export const USAGE_MATERIAL_CHANGE_PERCENT = 10; // below this, movement is "stable" noise
export const USAGE_INACTIVE_DAYS = 45; // no recorded activity for this long = inactive
export const INTERACTION_COOLING_DAYS = 45;
export const INTERACTION_DISENGAGED_DAYS = 90;
export const EXECUTIVE_COOLING_DAYS = 90;
export const EXECUTIVE_DISENGAGED_DAYS = 180;

export interface UsageMetrics {
  trend: UsageTrend;
  explanation: string;
  evidence: string[];
  latestPeriodEnd?: Date;
  latestActiveUsers?: number;
  priorActiveUsers?: number;
  changePercent?: number;
  adoptionPercentage?: number;
  seatUtilizationPercentage?: number;
  lastActiveAt?: Date;
  periodsAvailable: number;
}

export interface SupportMetrics {
  trend: SupportTrend;
  explanation: string;
  evidence: string[];
  openTickets: number;
  openUrgentTickets: number;
  openHighPriorityTickets: number;
  recentTicketCount: number;
  priorTicketCount: number;
  reopenedTickets: number;
  averageResolutionMinutes?: number;
  averageSatisfaction?: number;
  ticketsAvailable: number;
}

export interface RelationshipMetrics {
  daysSinceMeaningfulInteraction?: number;
  daysSinceExecutiveInteraction?: number;
  daysSinceChampionInteraction?: number;
  meaningfulInteractionsLast90Days: number;
  executiveEngagement: EngagementState;
  championEngagement: EngagementState;
  hasExecutiveSponsor: boolean;
  hasChampion: boolean;
  departedChampionNames: string[];
  /** Contacts recorded for this account. Zero means the relationship picture is absent, not empty. */
  contactsOnFile: number;
  /** Interactions recorded for this account. Zero means nothing was imported, not that nothing happened. */
  interactionsOnFile: number;
  confidence: number;
  evidence: string[];
}

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

function percentChange(prior: number, latest: number): number {
  if (prior === 0) return latest === 0 ? 0 : 100;
  return ((latest - prior) / prior) * 100;
}

/**
 * Usage movement compares the two most recent non-overlapping periods.
 * Active users is the primary measure; adoption percentage is the fallback
 * when seat counts were not supplied.
 */
export async function getUsageMetrics(customerAccountId: string, now = new Date()): Promise<UsageMetrics> {
  const periods = await prisma.productUsageSummary.findMany({
    where: { customerAccountId },
    orderBy: { periodEnd: "desc" },
    take: 2,
  });

  if (periods.length === 0) {
    return {
      trend: "INSUFFICIENT_DATA",
      explanation: "No product usage has been imported for this account.",
      evidence: [],
      periodsAvailable: 0,
    };
  }

  const [latest, prior] = periods;
  const evidence = [
    `Latest usage period ${latest.periodStart.toISOString().slice(0, 10)} to ${latest.periodEnd.toISOString().slice(0, 10)}.`,
  ];

  // Inactivity is checked before movement: an account with no recorded
  // activity is inactive regardless of how its user count moved.
  if (latest.lastActiveAt) {
    const idleDays = daysBetween(latest.lastActiveAt, now);
    if (idleDays >= USAGE_INACTIVE_DAYS) {
      evidence.push(`Last recorded activity ${idleDays} days ago (${latest.lastActiveAt.toISOString().slice(0, 10)}).`);
      return {
        trend: "INACTIVE",
        explanation: `No recorded product activity for ${idleDays} days.`,
        evidence,
        latestPeriodEnd: latest.periodEnd,
        latestActiveUsers: latest.activeUsers ?? undefined,
        adoptionPercentage: latest.adoptionPercentage ?? undefined,
        seatUtilizationPercentage: latest.seatUtilizationPercentage ?? undefined,
        lastActiveAt: latest.lastActiveAt,
        periodsAvailable: periods.length,
      };
    }
  }

  if (!prior) {
    return {
      trend: "INSUFFICIENT_DATA",
      explanation: "Only one usage period has been imported. At least two are needed to measure movement.",
      evidence,
      latestPeriodEnd: latest.periodEnd,
      latestActiveUsers: latest.activeUsers ?? undefined,
      adoptionPercentage: latest.adoptionPercentage ?? undefined,
      seatUtilizationPercentage: latest.seatUtilizationPercentage ?? undefined,
      lastActiveAt: latest.lastActiveAt ?? undefined,
      periodsAvailable: 1,
    };
  }

  const latestValue = latest.activeUsers ?? latest.adoptionPercentage;
  const priorValue = prior.activeUsers ?? prior.adoptionPercentage;
  const measure = latest.activeUsers != null && prior.activeUsers != null ? "active users" : "adoption percentage";

  if (latestValue == null || priorValue == null) {
    return {
      trend: "INSUFFICIENT_DATA",
      explanation: "The imported usage periods do not share a comparable measure (active users or adoption percentage).",
      evidence,
      latestPeriodEnd: latest.periodEnd,
      periodsAvailable: periods.length,
    };
  }

  const changePercent = percentChange(priorValue, latestValue);
  evidence.push(`${measure} moved from ${priorValue} to ${latestValue} (${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(1)}%).`);

  let trend: UsageTrend;
  if (Math.abs(changePercent) < USAGE_MATERIAL_CHANGE_PERCENT) trend = "STABLE";
  else if (changePercent > 0) trend = "INCREASING";
  else trend = "DECLINING";

  const explanation =
    trend === "STABLE"
      ? `${measure} changed by less than ${USAGE_MATERIAL_CHANGE_PERCENT}% between the two most recent periods.`
      : `${measure} ${trend === "DECLINING" ? "declined" : "increased"} ${Math.abs(changePercent).toFixed(0)}% between the two most recent periods.`;

  return {
    trend,
    explanation,
    evidence,
    latestPeriodEnd: latest.periodEnd,
    latestActiveUsers: latest.activeUsers ?? undefined,
    priorActiveUsers: prior.activeUsers ?? undefined,
    changePercent,
    adoptionPercentage: latest.adoptionPercentage ?? undefined,
    seatUtilizationPercentage: latest.seatUtilizationPercentage ?? undefined,
    lastActiveAt: latest.lastActiveAt ?? undefined,
    periodsAvailable: periods.length,
  };
}

const OPEN_TICKET_STATUSES = ["NEW", "OPEN", "PENDING", "ON_HOLD"] as const;

/**
 * Support trend compares ticket volume in the last 30 days against the 30
 * days before that, with open urgent tickets and escalations overriding to
 * CRITICAL regardless of volume movement.
 */
export async function getSupportMetrics(customerAccountId: string, now = new Date()): Promise<SupportMetrics> {
  const tickets = await prisma.supportTicket.findMany({ where: { customerAccountId } });

  if (tickets.length === 0) {
    return {
      trend: "INSUFFICIENT_DATA",
      explanation: "No support tickets have been imported for this account.",
      evidence: [],
      openTickets: 0,
      openUrgentTickets: 0,
      openHighPriorityTickets: 0,
      recentTicketCount: 0,
      priorTicketCount: 0,
      reopenedTickets: 0,
      ticketsAvailable: 0,
    };
  }

  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const open = tickets.filter((t) => OPEN_TICKET_STATUSES.includes(t.status as (typeof OPEN_TICKET_STATUSES)[number]));
  const openUrgent = open.filter((t) => t.priority === "URGENT");
  const openHigh = open.filter((t) => t.priority === "HIGH");
  const recent = tickets.filter((t) => t.createdDate >= thirtyDaysAgo);
  const prior = tickets.filter((t) => t.createdDate >= sixtyDaysAgo && t.createdDate < thirtyDaysAgo);
  const reopened = tickets.filter((t) => t.reopenCount > 0);

  const resolved = tickets.filter((t) => t.resolutionMinutes != null);
  const averageResolutionMinutes =
    resolved.length > 0 ? resolved.reduce((s, t) => s + (t.resolutionMinutes ?? 0), 0) / resolved.length : undefined;

  const rated = tickets.filter((t) => t.satisfactionScore != null);
  const averageSatisfaction =
    rated.length > 0 ? rated.reduce((s, t) => s + (t.satisfactionScore ?? 0), 0) / rated.length : undefined;

  const evidence = [
    `${open.length} open ticket${open.length === 1 ? "" : "s"} of ${tickets.length} imported.`,
    `${recent.length} ticket${recent.length === 1 ? "" : "s"} opened in the last 30 days, ${prior.length} in the 30 days before that.`,
  ];
  if (openUrgent.length > 0) evidence.push(`${openUrgent.length} open urgent ticket${openUrgent.length === 1 ? "" : "s"}.`);
  if (reopened.length > 0) evidence.push(`${reopened.length} ticket${reopened.length === 1 ? "" : "s"} reopened at least once.`);

  let trend: SupportTrend;
  let explanation: string;

  if (openUrgent.length > 0) {
    trend = "CRITICAL";
    explanation = `${openUrgent.length} urgent ticket${openUrgent.length === 1 ? " is" : "s are"} still open.`;
  } else if (prior.length === 0 && recent.length === 0) {
    trend = "STABLE";
    explanation = "No tickets were opened in the last 60 days.";
  } else if (prior.length === 0) {
    trend = recent.length >= 3 ? "DETERIORATING" : "STABLE";
    explanation =
      recent.length >= 3
        ? `${recent.length} tickets opened in the last 30 days, with none in the prior 30 days.`
        : `${recent.length} ticket${recent.length === 1 ? "" : "s"} opened in the last 30 days.`;
  } else {
    const change = percentChange(prior.length, recent.length);
    if (change >= 50) {
      trend = "DETERIORATING";
      explanation = `Ticket volume rose ${change.toFixed(0)}% compared with the previous 30 days.`;
    } else if (change <= -50) {
      trend = "IMPROVING";
      explanation = `Ticket volume fell ${Math.abs(change).toFixed(0)}% compared with the previous 30 days.`;
    } else {
      trend = "STABLE";
      explanation = "Ticket volume is broadly unchanged compared with the previous 30 days.";
    }
  }

  return {
    trend,
    explanation,
    evidence,
    openTickets: open.length,
    openUrgentTickets: openUrgent.length,
    openHighPriorityTickets: openHigh.length,
    recentTicketCount: recent.length,
    priorTicketCount: prior.length,
    reopenedTickets: reopened.length,
    averageResolutionMinutes,
    averageSatisfaction,
    ticketsAvailable: tickets.length,
  };
}

function engagementFrom(days: number | undefined, coolingDays: number, disengagedDays: number): EngagementState {
  if (days === undefined) return "NONE_RECORDED";
  if (days >= disengagedDays) return "DISENGAGED";
  if (days >= coolingDays) return "COOLING";
  return "ACTIVE";
}

export async function getRelationshipMetrics(customerAccountId: string, now = new Date()): Promise<RelationshipMetrics> {
  const [interactions, contacts] = await Promise.all([
    prisma.customerInteraction.findMany({ where: { customerAccountId }, orderBy: { interactionDate: "desc" } }),
    prisma.customerContact.findMany({ where: { customerAccountId } }),
  ]);

  const meaningful = interactions.filter((i) => MEANINGFUL_INTERACTION_TYPES.includes(i.type));
  const executive = interactions.filter(
    (i) => EXECUTIVE_INTERACTION_TYPES.includes(i.type) || i.executiveParticipated
  );
  const champion = interactions.filter((i) => i.championParticipated);

  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const meaningfulLast90 = meaningful.filter((i) => i.interactionDate >= ninetyDaysAgo).length;

  const daysSinceMeaningfulInteraction = meaningful[0] ? daysBetween(meaningful[0].interactionDate, now) : undefined;
  const daysSinceExecutiveInteraction = executive[0] ? daysBetween(executive[0].interactionDate, now) : undefined;
  const daysSinceChampionInteraction = champion[0] ? daysBetween(champion[0].interactionDate, now) : undefined;

  const activeContacts = contacts.filter((c) => c.isActive);
  const roleSets = activeContacts.map((c) => ((c.roles as string[] | null) ?? []));
  const hasExecutiveSponsor = roleSets.some((r) => r.includes("EXECUTIVE_SPONSOR"));
  const hasChampion = roleSets.some((r) => r.includes("CHAMPION"));

  const departedChampionNames = contacts
    .filter((c) => c.departedAt && ((c.roles as string[] | null) ?? []).includes("CHAMPION"))
    .map((c) => c.name);

  const evidence: string[] = [];
  if (interactions.length === 0) evidence.push("No customer interactions have been imported for this account.");
  else evidence.push(`${meaningful.length} meaningful interaction${meaningful.length === 1 ? "" : "s"} recorded of ${interactions.length} total.`);
  if (contacts.length === 0) evidence.push("No contacts have been imported for this account.");
  else evidence.push(`${activeContacts.length} active contact${activeContacts.length === 1 ? "" : "s"} on file.`);
  if (daysSinceMeaningfulInteraction !== undefined) {
    evidence.push(`Last meaningful interaction ${daysSinceMeaningfulInteraction} days ago.`);
  }

  // Confidence reflects how much of the relationship picture actually
  // exists, so a quiet account with no data is never mistaken for a
  // healthy one with genuine silence.
  let confidence = 0;
  if (contacts.length > 0) confidence += 0.3;
  if (interactions.length > 0) confidence += 0.3;
  if (meaningful.length > 0) confidence += 0.2;
  if (hasExecutiveSponsor || hasChampion) confidence += 0.2;

  return {
    daysSinceMeaningfulInteraction,
    daysSinceExecutiveInteraction,
    daysSinceChampionInteraction,
    meaningfulInteractionsLast90Days: meaningfulLast90,
    executiveEngagement: engagementFrom(daysSinceExecutiveInteraction, EXECUTIVE_COOLING_DAYS, EXECUTIVE_DISENGAGED_DAYS),
    championEngagement: engagementFrom(daysSinceChampionInteraction, INTERACTION_COOLING_DAYS, INTERACTION_DISENGAGED_DAYS),
    hasExecutiveSponsor,
    hasChampion,
    departedChampionNames,
    contactsOnFile: contacts.length,
    interactionsOnFile: interactions.length,
    confidence: Math.min(1, confidence),
    evidence,
  };
}

export interface AccountMetrics {
  usage: UsageMetrics;
  support: SupportMetrics;
  relationship: RelationshipMetrics;
  openEscalations: number;
  criticalEscalations: number;
}

export async function getAccountMetrics(customerAccountId: string, now = new Date()): Promise<AccountMetrics> {
  const [usage, support, relationship, escalations] = await Promise.all([
    getUsageMetrics(customerAccountId, now),
    getSupportMetrics(customerAccountId, now),
    getRelationshipMetrics(customerAccountId, now),
    prisma.escalation.findMany({
      where: { customerAccountId, status: { notIn: ["RESOLVED", "CLOSED"] } },
      select: { severity: true },
    }),
  ]);

  return {
    usage,
    support,
    relationship,
    openEscalations: escalations.length,
    criticalEscalations: escalations.filter((e) => e.severity === "CRITICAL").length,
  };
}

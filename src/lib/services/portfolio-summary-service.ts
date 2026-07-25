import "server-only";
import type { HealthCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { OPEN_ESCALATION_STATUSES } from "@/lib/services/escalation-constants";

/**
 * The portfolio summary behind Mission Control.
 *
 * Every number here is a count or a sum of records that exist. Nothing is
 * estimated, and nothing is filled in when data is absent — an absent number
 * is reported as absent, with the reason, rather than as a zero that reads
 * like good news.
 */

export const OPEN_RISK_STATUSES = ["NEW", "OPEN", "MONITORING", "IMPROVING"] as const;
export const OPEN_ACTION_STATUSES = ["AWAITING_APPROVAL", "OPEN", "IN_PROGRESS", "BLOCKED", "ASSIGNED"] as const;
const CLOSED_RENEWAL_STATUSES = ["RENEWED", "CHURNED"] as const;

export interface HealthDistributionEntry {
  category: HealthCategory;
  accounts: number;
  arr: number;
}

export interface PortfolioChange {
  accountId: string;
  accountName: string;
  previousScore: number;
  currentScore: number;
  delta: number;
  changeReason: string | null;
  calculatedAt: Date;
}

export interface AttentionItem {
  accountId: string;
  accountName: string;
  headline: string;
  detail: string;
  arr: number;
}

export interface PortfolioSummary {
  accountCount: number;
  totalArr: number;
  /** Accounts with no ARR on file. Their revenue cannot be counted anywhere above. */
  accountsMissingArr: number;
  healthDistribution: HealthDistributionEntry[];
  /** Accounts whose health has never been calculated. Their stored category is a storage default, not an assessment. */
  accountsNotAssessed: number;
  arrNotAssessed: number;
  arrInAtRiskAccounts: number;
  openRisks: number;
  criticalRisks: number;
  openEscalations: number;
  openActions: number;
  unassignedActions: number;
  overdueActions: number;
  accountsWithoutOwner: number;
  renewalsNext90Days: number;
  arrRenewingNext90Days: number;
  renewalsMissingDate: number;
  recentChanges: PortfolioChange[];
  needsAttention: AttentionItem[];
  openDataQualityIssues: number;
}

const HEALTH_ORDER: HealthCategory[] = ["CRITICAL", "AT_RISK", "WATCH", "STABLE", "STRONG"];

export async function getPortfolioSummary(organizationId: string, now = new Date()): Promise<PortfolioSummary> {
  const ninetyDaysOut = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const [accounts, risks, escalations, actions, renewals, snapshots, dataQualityIssues] = await Promise.all([
    prisma.customerAccount.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        arr: true,
        healthCategory: true,
        healthCalculatedAt: true,
        ownerId: true,
        renewalDate: true,
      },
    }),
    prisma.riskSignal.findMany({
      where: { organizationId, status: { in: [...OPEN_RISK_STATUSES] } },
      select: { id: true, severity: true, customerAccountId: true, title: true, currentState: true },
    }),
    prisma.escalation.findMany({
      where: { organizationId, status: { in: OPEN_ESCALATION_STATUSES } },
      select: { id: true, customerAccountId: true, title: true, severity: true },
    }),
    prisma.recommendedAction.findMany({
      where: { organizationId, status: { in: [...OPEN_ACTION_STATUSES] } },
      select: { id: true, ownerId: true, dueDate: true },
    }),
    prisma.renewal.findMany({
      where: { organizationId, status: { notIn: [...CLOSED_RENEWAL_STATUSES] } },
      select: { id: true, periodEnd: true, arr: true },
    }),
    prisma.healthScoreSnapshot.findMany({
      where: { organizationId, previousScore: { not: null } },
      orderBy: { calculatedAt: "desc" },
      take: 50,
    }),
    prisma.dataQualityIssue.count({ where: { organizationId, status: { not: "RESOLVED" } } }),
  ]);

  const accountsById = new Map(accounts.map((a) => [a.id, a]));

  // Only accounts that have actually been scored appear in the distribution.
  // An unscored account carries the schema's default category, and counting
  // that as "Stable" would report health nobody has calculated.
  const assessed = accounts.filter((a) => a.healthCalculatedAt !== null);
  const notAssessed = accounts.filter((a) => a.healthCalculatedAt === null);

  const healthDistribution: HealthDistributionEntry[] = HEALTH_ORDER.map((category) => {
    const inCategory = assessed.filter((a) => a.healthCategory === category);
    return {
      category,
      accounts: inCategory.length,
      arr: inCategory.reduce((sum, a) => sum + a.arr, 0),
    };
  });

  const renewingSoon = renewals.filter((r) => r.periodEnd <= ninetyDaysOut);

  // One row per account, most recently changed first, so the same account
  // does not fill the list with every recalculation it has ever had.
  const seenAccounts = new Set<string>();
  const recentChanges: PortfolioChange[] = [];
  for (const snapshot of snapshots) {
    if (seenAccounts.has(snapshot.customerAccountId)) continue;
    const account = accountsById.get(snapshot.customerAccountId);
    if (!account || snapshot.previousScore === null) continue;
    if (snapshot.previousScore === snapshot.overallScore) continue;
    seenAccounts.add(snapshot.customerAccountId);
    recentChanges.push({
      accountId: account.id,
      accountName: account.name,
      previousScore: snapshot.previousScore,
      currentScore: snapshot.overallScore,
      delta: Math.round(snapshot.overallScore - snapshot.previousScore),
      changeReason: snapshot.changeReason,
      calculatedAt: snapshot.calculatedAt,
    });
    if (recentChanges.length >= 8) break;
  }

  return {
    accountCount: accounts.length,
    totalArr: accounts.reduce((sum, a) => sum + a.arr, 0),
    accountsMissingArr: accounts.filter((a) => a.arr === 0).length,
    healthDistribution,
    accountsNotAssessed: notAssessed.length,
    arrNotAssessed: notAssessed.reduce((sum, a) => sum + a.arr, 0),
    arrInAtRiskAccounts: assessed
      .filter((a) => a.healthCategory === "AT_RISK" || a.healthCategory === "CRITICAL")
      .reduce((sum, a) => sum + a.arr, 0),
    openRisks: risks.length,
    criticalRisks: risks.filter((r) => r.severity === "CRITICAL").length,
    openEscalations: escalations.length,
    openActions: actions.length,
    unassignedActions: actions.filter((a) => a.ownerId === null).length,
    overdueActions: actions.filter((a) => a.dueDate !== null && a.dueDate < now).length,
    accountsWithoutOwner: accounts.filter((a) => a.ownerId === null).length,
    renewalsNext90Days: renewingSoon.length,
    arrRenewingNext90Days: renewingSoon.reduce((sum, r) => sum + r.arr, 0),
    renewalsMissingDate: accounts.filter((a) => a.renewalDate === null).length,
    recentChanges,
    needsAttention: buildAttentionList(accounts, risks, escalations),
    openDataQualityIssues: dataQualityIssues,
  };
}

/**
 * Accounts ranked by what is actually wrong, most exposed revenue first.
 * An account appears only when there is a concrete reason to name it.
 */
function buildAttentionList(
  accounts: { id: string; name: string; arr: number; healthCategory: HealthCategory }[],
  risks: { customerAccountId: string; severity: string; title: string }[],
  escalations: { customerAccountId: string; severity: string; title: string }[]
): AttentionItem[] {
  const items: AttentionItem[] = [];

  for (const account of accounts) {
    const accountRisks = risks.filter((r) => r.customerAccountId === account.id);
    const accountEscalations = escalations.filter((e) => e.customerAccountId === account.id);
    if (accountRisks.length === 0 && accountEscalations.length === 0) continue;

    const severe = accountRisks.filter((r) => r.severity === "CRITICAL" || r.severity === "HIGH");
    const reasons: string[] = [];
    if (accountEscalations.length > 0) {
      reasons.push(`${accountEscalations.length} open escalation${accountEscalations.length === 1 ? "" : "s"}`);
    }
    if (severe.length > 0) {
      reasons.push(`${severe.length} high or critical risk${severe.length === 1 ? "" : "s"}`);
    } else if (accountRisks.length > 0) {
      reasons.push(`${accountRisks.length} open risk${accountRisks.length === 1 ? "" : "s"}`);
    }

    // Risk titles are stored with the account name prefixed. The account is
    // already named beside the headline, so strip it rather than saying it twice.
    const rawHeadline = accountEscalations[0]?.title ?? severe[0]?.title ?? accountRisks[0].title;
    const headline = rawHeadline.startsWith(`${account.name}: `)
      ? rawHeadline.slice(account.name.length + 2)
      : rawHeadline;

    items.push({
      accountId: account.id,
      accountName: account.name,
      headline,
      detail: reasons.join(" and "),
      arr: account.arr,
    });
  }

  return items
    .sort((a, b) => b.arr - a.arr)
    .slice(0, 10);
}

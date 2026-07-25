import "server-only";
import { prisma } from "@/lib/prisma";
import { assertCan } from "@/lib/auth/permissions";
import { recordAuditEvent } from "@/lib/services/audit-service";
import { trackOnboardingEvent } from "@/lib/services/onboarding-service";
import { getFirstInsights } from "@/lib/services/first-insight-service";
import { getPortfolioSummary, OPEN_RISK_STATUSES, OPEN_ACTION_STATUSES } from "@/lib/services/portfolio-summary-service";
import { getDataQualitySummary } from "@/lib/services/data-quality-service";
import { getDataFreshness } from "@/lib/services/data-freshness-service";
import { listRuleAvailability } from "@/lib/services/risk-engine";
import { OPEN_ESCALATION_STATUSES } from "@/lib/services/escalation-constants";
import type { Role } from "@prisma/client";

export class ExecutiveBriefError extends Error {}

interface SectionInput {
  key: string;
  title: string;
  content: string;
}

/**
 * Assembles a brief entirely from facts already on file — counts, sums,
 * and the rule-based insights from first-insight-service.ts. No AI
 * involved (no AI service layer exists yet); every sentence here traces
 * back to a real query, and every limitation is stated rather than
 * papered over. This is what PRODUCT.md calls "protect customer trust" —
 * a brief with three accounts and no renewal dates says so plainly
 * instead of performing confidence it doesn't have.
 */
export async function generatePreviewBrief(params: {
  organizationId: string;
  actingUserId: string;
  actingRole: Role;
  periodLabel?: string;
}) {
  assertCan(params.actingRole, "manage_executive_brief");

  const sections = await buildBriefSections(params.organizationId);

  const brief = await prisma.executiveBrief.create({
    data: {
      organizationId: params.organizationId,
      periodLabel: params.periodLabel ?? "Preview",
      status: "DRAFT",
      sections: { create: sections.map((s, i) => ({ ...s, order: i })) },
    },
    include: { sections: { orderBy: { order: "asc" } } },
  });

  await recordAuditEvent({
    organizationId: params.organizationId,
    actorUserId: params.actingUserId,
    eventType: "executive_brief_generated",
    targetType: "ExecutiveBrief",
    targetId: brief.id,
  });
  await trackOnboardingEvent({
    organizationId: params.organizationId,
    userId: params.actingUserId,
    eventType: "executive_brief_previewed",
  });

  return brief;
}

function money(amount: number, currency: string): string {
  return `${currency} ${Math.round(amount).toLocaleString()}`;
}

function plural(count: number, singular: string, pluralForm?: string): string {
  return `${count} ${count === 1 ? singular : (pluralForm ?? `${singular}s`)}`;
}

/**
 * Builds every section of the brief from records that exist. A section that
 * has nothing to report says so and says why — an executive reading this must
 * never mistake "we have no data" for "there is no problem".
 */
export async function buildBriefSections(organizationId: string, now = new Date()): Promise<SectionInput[]> {
  const [summary, quality, freshness, ruleAvailability, insights, accounts, risks, renewals, escalations, actions] =
    await Promise.all([
      getPortfolioSummary(organizationId, now),
      getDataQualitySummary(organizationId),
      getDataFreshness(organizationId, now),
      listRuleAvailability(organizationId),
      getFirstInsights(organizationId),
      prisma.customerAccount.findMany({
        where: { organizationId },
        select: { id: true, name: true, arr: true, currency: true, healthCategory: true },
      }),
      prisma.riskSignal.findMany({
        where: { organizationId, status: { in: [...OPEN_RISK_STATUSES] } },
        include: { customerAccount: { select: { name: true } } },
      }),
      prisma.renewal.findMany({
        where: { organizationId, status: { notIn: ["RENEWED", "CHURNED"] } },
        include: { customerAccount: { select: { name: true } } },
        orderBy: { periodEnd: "asc" },
      }),
      prisma.escalation.findMany({
        where: { organizationId, status: { in: OPEN_ESCALATION_STATUSES } },
        include: { customerAccount: { select: { name: true } } },
        orderBy: { openedAt: "asc" },
      }),
      prisma.recommendedAction.findMany({
        where: { organizationId, status: { in: [...OPEN_ACTION_STATUSES] } },
        include: { customerAccount: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

  const currency = accounts[0]?.currency ?? "USD";
  const sections: SectionInput[] = [];

  if (summary.accountCount === 0) {
    return [
      {
        key: "no_data",
        title: "Nothing to report yet",
        content:
          "No customer accounts have been imported. This brief will report on real accounts, revenue, risk, and renewals as soon as data is loaded. Nothing above is estimated or assumed.",
      },
    ];
  }

  sections.push({
    key: "executive_summary",
    title: "Executive summary",
    content: `${plural(summary.accountCount, "customer account")} on file, representing ${money(summary.totalArr, currency)} in recurring revenue. ${money(summary.arrInAtRiskAccounts, currency)} sits in accounts categorized At Risk or Critical. ${plural(summary.openRisks, "open risk signal")} and ${plural(summary.openEscalations, "open escalation")} are being tracked. Data readiness is ${quality.state.toLowerCase()}.`,
  });

  sections.push({
    key: "what_changed",
    title: "What changed",
    content:
      summary.recentChanges.length === 0
        ? "No health score movement has been recorded. A comparison needs at least two calculations for the same account, so this section fills in once health has been recalculated after a subsequent import."
        : summary.recentChanges
            .map(
              (change) =>
                `${change.accountName}: ${change.previousScore} to ${change.currentScore} (${change.delta > 0 ? "+" : ""}${change.delta}). ${change.changeReason ?? ""}`.trim()
            )
            .join(" "),
  });

  sections.push({
    key: "portfolio_health",
    title: "Portfolio health",
    content: `${summary.healthDistribution
      .map(
        (entry) =>
          `${entry.category.replace(/_/g, " ")}: ${plural(entry.accounts, "account")}, ${money(entry.arr, currency)}`
      )
      .join(". ")}.${
      summary.accountsNotAssessed > 0
        ? ` ${plural(summary.accountsNotAssessed, "account")} carrying ${money(summary.arrNotAssessed, currency)} have never had a health score calculated and are excluded from the figures above.`
        : ""
    }`,
  });

  const revenueAtRiskAccounts = accounts.filter(
    (account) => account.healthCategory === "AT_RISK" || account.healthCategory === "CRITICAL"
  );
  sections.push({
    key: "revenue_at_risk",
    title: "Revenue at risk",
    content:
      revenueAtRiskAccounts.length === 0
        ? `No account is currently categorized At Risk or Critical. That reflects the ${ruleAvailability.filter((rule) => rule.available).length} risk rules the imported data can evaluate, not a guarantee that no risk exists.`
        : `${money(summary.arrInAtRiskAccounts, currency)} across ${plural(revenueAtRiskAccounts.length, "account")}: ${revenueAtRiskAccounts
            .slice(0, 8)
            .map((account) => `${account.name} (${money(account.arr, currency)})`)
            .join(", ")}.`,
  });

  sections.push({
    key: "accounts_needing_attention",
    title: "Accounts needing attention",
    content:
      summary.needsAttention.length === 0
        ? "No account has an open risk or escalation."
        : summary.needsAttention
            .map((item) => `${item.accountName}: ${item.headline} (${item.detail}).`)
            .join(" "),
  });

  const upcoming = renewals.filter((renewal) => renewal.periodEnd <= new Date(now.getTime() + 90 * 86400000));
  sections.push({
    key: "upcoming_renewals",
    title: "Upcoming renewals",
    content:
      upcoming.length === 0
        ? summary.renewalsMissingDate === summary.accountCount
          ? "No account has a renewal date on file, so renewal visibility is not available. Importing renewal data is the single highest-value gap to close."
          : "No renewal falls within the next 90 days."
        : `${plural(upcoming.length, "renewal")} worth ${money(summary.arrRenewingNext90Days, currency)} close within 90 days: ${upcoming
            .slice(0, 8)
            .map(
              (renewal) =>
                `${renewal.customerAccount.name} on ${renewal.periodEnd.toISOString().slice(0, 10)} (${renewal.forecastCategory.replace(/_/g, " ").toLowerCase()})`
            )
            .join(", ")}.`,
  });

  sections.push({
    key: "renewal_forecast",
    title: "Renewal forecast",
    content:
      renewals.length === 0
        ? "No open renewal records exist, so there is no forecast to report."
        : `Forecast categories are assigned by rule from data on file, not predicted by a model. ${Object.entries(
            renewals.reduce<Record<string, number>>((counts, renewal) => {
              counts[renewal.forecastCategory] = (counts[renewal.forecastCategory] ?? 0) + 1;
              return counts;
            }, {})
          )
            .map(([category, count]) => `${category.replace(/_/g, " ").toLowerCase()}: ${count}`)
            .join(", ")}.`,
  });

  sections.push({
    key: "escalations",
    title: "Escalations",
    content:
      escalations.length === 0
        ? "No open escalations. Escalations are recorded by people; Ground Control never opens one on its own, so an empty section means none were entered."
        : escalations
            .map(
              (escalation) =>
                `${escalation.customerAccount.name}: ${escalation.title} (${escalation.severity.toLowerCase()}, ${escalation.status.replace(/_/g, " ").toLowerCase()}, opened ${escalation.openedAt.toISOString().slice(0, 10)}).`
            )
            .join(" "),
  });

  const risksByCategory = risks.reduce<Record<string, number>>((counts, risk) => {
    counts[risk.category] = (counts[risk.category] ?? 0) + 1;
    return counts;
  }, {});
  sections.push({
    key: "risk_themes",
    title: "Risk themes",
    content:
      risks.length === 0
        ? "No open risk signals."
        : `${Object.entries(risksByCategory)
            .sort((a, b) => b[1] - a[1])
            .map(([category, count]) => `${category.replace(/_/g, " ")}: ${count}`)
            .join(". ")}.`,
  });

  sections.push({
    key: "open_work",
    title: "Open work and ownership",
    content: `${plural(summary.openActions, "open action")}, of which ${summary.unassignedActions} have no owner and ${summary.overdueActions} are past their due date. ${plural(summary.accountsWithoutOwner, "account")} ${summary.accountsWithoutOwner === 1 ? "has" : "have"} no assigned owner.`,
  });

  sections.push({
    key: "recommended_actions",
    title: "Recommended actions",
    content:
      actions.length > 0
        ? actions.map((action) => `${action.customerAccount.name}: ${action.title}`).join(" ")
        : insights.length > 0
          ? insights.map((insight) => `${insight.title}: ${insight.recommendedAction}`).join(" ")
          : "No recommended actions. Run a risk evaluation and generate suggestions to populate this section.",
  });

  sections.push({
    key: "data_readiness",
    title: "Data readiness",
    content: `${quality.state}. ${quality.explanation}${quality.reasons.length > 0 ? ` ${quality.reasons.join(" ")}` : ""}`,
  });

  sections.push({
    key: "data_freshness",
    title: "Data freshness",
    content: freshness
      .map((category) => `${category.label}: ${category.state.toLowerCase()}. ${category.explanation}`)
      .join(" "),
  });

  const unavailableRules = ruleAvailability.filter((rule) => !rule.available);
  sections.push({
    key: "assessment_limits",
    title: "What this assessment cannot see",
    content:
      unavailableRules.length === 0
        ? "Every risk rule in the current catalog has the data it needs."
        : `${plural(unavailableRules.length, "risk rule")} cannot run with the data on file: ${unavailableRules
            .map((rule) => `${rule.label} (${rule.unavailableReason})`)
            .join("; ")}.`,
  });

  sections.push({
    key: "method",
    title: "How this brief was produced",
    content:
      "Every statement above is a count, a sum, or a rule applied to records already imported into Ground Control. No model produced any sentence in this brief, no figure is estimated, and no gap has been filled with an assumption. Where information is missing, the section says so.",
  });

  return sections;
}

export async function getLatestBrief(organizationId: string) {
  return prisma.executiveBrief.findFirst({
    where: { organizationId },
    orderBy: { generatedAt: "desc" },
    include: { sections: { orderBy: { order: "asc" } } },
  });
}

export async function approveBrief(params: { organizationId: string; briefId: string; actingUserId: string; actingRole: Role }) {
  assertCan(params.actingRole, "manage_executive_brief");

  const brief = await prisma.executiveBrief.findFirst({ where: { id: params.briefId, organizationId: params.organizationId } });
  if (!brief) throw new ExecutiveBriefError("Executive Brief not found.");

  const updated = await prisma.executiveBrief.update({
    where: { id: brief.id },
    data: { status: "APPROVED", approvedAt: new Date(), approvedById: params.actingUserId },
  });

  await recordAuditEvent({
    organizationId: params.organizationId,
    actorUserId: params.actingUserId,
    eventType: "executive_brief_approved",
    targetType: "ExecutiveBrief",
    targetId: brief.id,
  });

  return updated;
}

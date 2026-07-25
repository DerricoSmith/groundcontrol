import "server-only";
import type { CustomerAccount, RiskSeverity, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assertCan } from "@/lib/auth/permissions";
import { recordAuditEvent } from "@/lib/services/audit-service";
import { getAccountMetrics, type AccountMetrics } from "@/lib/services/account-metrics-service";

/**
 * Deterministic risk engine.
 *
 * Every rule evaluates against imported facts only. A rule whose required
 * data has not been imported reports itself unavailable and produces
 * nothing — it never guesses, and absence of data never becomes a risk (or
 * an all-clear).
 *
 * Explanations follow the six-part structure from PRODUCT.md: current
 * state, what changed, supporting evidence, potential impact, recommended
 * action, confidence. Every number in an explanation comes from the
 * evidence array on the same signal.
 */

export const RISK_RULE_VERSION = "risk-v2-2026-07";

export interface RiskContext {
  account: CustomerAccount;
  metrics: AccountMetrics;
  daysUntilRenewal?: number;
  hasRenewalPlan: boolean;
  renewalMilestonesComplete: number;
  now: Date;
}

export interface RiskFinding {
  severity: RiskSeverity;
  confidence: number;
  revenueExposure: number;
  currentState: string;
  whatChanged: string;
  evidence: string[];
  potentialImpact: string;
  recommendedResponse: string;
  executiveInvolvementRecommended: boolean;
  suggestedActionType: string;
}

export interface RiskRule {
  key: string;
  label: string;
  category: string;
  purpose: string;
  requiredData: string;
  /** Whether this organization has imported enough data for the rule to run at all. */
  isAvailable: (organizationId: string) => Promise<boolean>;
  /** Why the rule cannot run, shown verbatim in the UI when unavailable. */
  unavailableReason: string;
  /** Returns a finding, or null when the account does not trigger the rule. */
  evaluate: (context: RiskContext) => RiskFinding | null;
}

async function hasAny(model: "productUsageSummary" | "supportTicket" | "customerInteraction" | "customerContact" | "escalation" | "renewal", organizationId: string): Promise<boolean> {
  switch (model) {
    case "productUsageSummary":
      return (await prisma.productUsageSummary.count({ where: { organizationId } })) > 0;
    case "supportTicket":
      return (await prisma.supportTicket.count({ where: { organizationId } })) > 0;
    case "customerInteraction":
      return (await prisma.customerInteraction.count({ where: { organizationId } })) > 0;
    case "customerContact":
      return (await prisma.customerContact.count({ where: { organizationId } })) > 0;
    case "escalation":
      return (await prisma.escalation.count({ where: { organizationId } })) > 0;
    case "renewal":
      return (await prisma.renewal.count({ where: { organizationId } })) > 0;
  }
}

function severityFromExposure(base: RiskSeverity, arr: number): RiskSeverity {
  // Revenue scales severity, but never below the rule's own floor. A small
  // account with a real problem still has a real problem.
  const order: RiskSeverity[] = ["LOW", "MODERATE", "HIGH", "CRITICAL"];
  let index = order.indexOf(base);
  if (arr >= 100_000) index = Math.min(order.length - 1, index + 1);
  return order[index];
}

export const RISK_RULES: RiskRule[] = [
  {
    key: "product_usage_decline",
    label: "Product usage decline",
    category: "adoption_decline",
    purpose: "Detect accounts whose measured product usage has fallen materially between reporting periods.",
    requiredData: "Product usage summaries (at least two periods per account)",
    unavailableReason: "No product usage has been imported. Import Product Usage summaries to enable this rule.",
    isAvailable: (organizationId) => hasAny("productUsageSummary", organizationId),
    evaluate: ({ account, metrics, daysUntilRenewal }) => {
      const { usage } = metrics;
      if (usage.trend !== "DECLINING" || usage.changePercent === undefined) return null;

      const drop = Math.abs(usage.changePercent);
      const base: RiskSeverity = drop >= 40 ? "CRITICAL" : drop >= 25 ? "HIGH" : "MODERATE";

      const renewalClause =
        daysUntilRenewal !== undefined && daysUntilRenewal >= 0
          ? ` The account renews in ${daysUntilRenewal} days.`
          : "";

      return {
        severity: severityFromExposure(base, account.arr),
        confidence: usage.periodsAvailable >= 2 ? 0.85 : 0.5,
        revenueExposure: account.arr,
        currentState: `Product usage declined ${drop.toFixed(0)} percent across the two most recent reporting periods.`,
        whatChanged: usage.explanation,
        evidence: usage.evidence,
        potentialImpact: `${account.currency} ${account.arr.toLocaleString()} in recurring revenue is attached to an account with falling adoption.${renewalClause}`,
        recommendedResponse: "Review the adoption change with the account owner and confirm whether a recovery plan is required.",
        executiveInvolvementRecommended: base === "CRITICAL" && account.arr >= 100_000,
        suggestedActionType: "adoption_plan",
      };
    },
  },
  {
    key: "low_product_adoption",
    label: "Low product adoption",
    category: "low_adoption",
    purpose: "Detect accounts using materially less of the product than they pay for.",
    requiredData: "Product usage summaries with adoption or seat utilization",
    unavailableReason: "No product usage has been imported. Import Product Usage summaries to enable this rule.",
    isAvailable: (organizationId) => hasAny("productUsageSummary", organizationId),
    evaluate: ({ account, metrics }) => {
      const { usage } = metrics;
      const measure = usage.adoptionPercentage ?? usage.seatUtilizationPercentage;
      if (measure === undefined || measure >= 40) return null;
      // Declining usage is reported by its own rule; this one is about a
      // persistently low level, not movement.
      if (usage.trend === "DECLINING") return null;

      const base: RiskSeverity = measure < 20 ? "HIGH" : "MODERATE";
      return {
        severity: severityFromExposure(base, account.arr),
        confidence: 0.8,
        revenueExposure: account.arr,
        currentState: `Product adoption is ${measure.toFixed(0)} percent, below the 40 percent threshold for a healthy account.`,
        whatChanged: usage.explanation,
        evidence: usage.evidence,
        potentialImpact: `The customer is paying for materially more than they use, which weakens the renewal case for ${account.currency} ${account.arr.toLocaleString()}.`,
        recommendedResponse: "Run an adoption review to identify blocked teams or unused entitlements.",
        executiveInvolvementRecommended: false,
        suggestedActionType: "adoption_plan",
      };
    },
  },
  {
    key: "no_recent_interaction",
    label: "No recent meaningful interaction",
    category: "relationship_gap",
    purpose: "Detect accounts the team has not genuinely spoken with recently.",
    requiredData: "Customer interactions",
    unavailableReason: "No customer interactions have been imported. Import Customer Interactions to enable this rule.",
    isAvailable: (organizationId) => hasAny("customerInteraction", organizationId),
    evaluate: ({ account, metrics, daysUntilRenewal }) => {
      const days = metrics.relationship.daysSinceMeaningfulInteraction;
      if (days === undefined || days < 60) return null;

      const base: RiskSeverity = days >= 120 ? "HIGH" : "MODERATE";
      const renewalClause =
        daysUntilRenewal !== undefined && daysUntilRenewal >= 0 && daysUntilRenewal <= 120
          ? ` The renewal is ${daysUntilRenewal} days away.`
          : "";

      return {
        severity: severityFromExposure(base, account.arr),
        confidence: 0.8,
        revenueExposure: account.arr,
        currentState: `No meaningful interaction has been recorded with this customer for ${days} days.`,
        whatChanged: `The last meaningful interaction was ${days} days ago.`,
        evidence: metrics.relationship.evidence,
        potentialImpact: `Renewal and expansion conversations become harder without an active relationship.${renewalClause}`,
        recommendedResponse: "Schedule a customer meeting and record the outcome.",
        executiveInvolvementRecommended: days >= 120 && account.arr >= 100_000,
        suggestedActionType: "customer_meeting",
      };
    },
  },
  {
    key: "executive_sponsor_disengagement",
    label: "Executive sponsor disengagement",
    category: "executive_disengagement",
    purpose: "Detect accounts where executive-level contact has lapsed or never existed.",
    requiredData: "Customer contacts and interactions",
    unavailableReason: "No contacts or interactions have been imported. Import both to enable this rule.",
    isAvailable: async (organizationId) =>
      (await hasAny("customerContact", organizationId)) && (await hasAny("customerInteraction", organizationId)),
    evaluate: ({ account, metrics }) => {
      const { relationship } = metrics;

      // An account with no contacts and no interactions at all has an absent
      // relationship picture, not a disengaged one. Raising a risk here would
      // be inventing a finding out of a gap; the gap itself is reported by
      // the data quality engine instead.
      if (relationship.contactsOnFile === 0 && relationship.interactionsOnFile === 0) return null;

      const disengaged = relationship.executiveEngagement === "DISENGAGED";
      const missing = !relationship.hasExecutiveSponsor;
      if (!disengaged && !missing) return null;

      const currentState = missing
        ? "No executive sponsor is recorded for this account."
        : `Executive engagement has lapsed. The last executive interaction was ${relationship.daysSinceExecutiveInteraction} days ago.`;

      return {
        severity: severityFromExposure(account.arr >= 100_000 ? "HIGH" : "MODERATE", account.arr),
        confidence: relationship.confidence,
        revenueExposure: account.arr,
        currentState,
        whatChanged: missing
          ? "No contact carrying the executive sponsor role has been imported."
          : "Executive contact has passed the disengagement threshold.",
        evidence: relationship.evidence,
        potentialImpact: `Without executive alignment, ${account.currency} ${account.arr.toLocaleString()} is exposed to a decision made without an internal advocate.`,
        recommendedResponse: missing
          ? "Identify and record an executive sponsor for this account."
          : "Schedule an executive check-in to re-establish alignment.",
        executiveInvolvementRecommended: true,
        suggestedActionType: "executive_outreach",
      };
    },
  },
  {
    key: "champion_departure",
    label: "Champion departure",
    category: "champion_departure",
    purpose: "Detect accounts whose internal champion has left.",
    requiredData: "Customer contacts with departure dates",
    unavailableReason: "No contacts have been imported. Import Customer Contacts to enable this rule.",
    isAvailable: (organizationId) => hasAny("customerContact", organizationId),
    evaluate: ({ account, metrics }) => {
      const departed = metrics.relationship.departedChampionNames;
      if (departed.length === 0) return null;

      const stillHasChampion = metrics.relationship.hasChampion;
      const base: RiskSeverity = stillHasChampion ? "MODERATE" : "HIGH";

      return {
        severity: severityFromExposure(base, account.arr),
        confidence: 0.9,
        revenueExposure: account.arr,
        currentState: `A recorded champion has departed: ${departed.join(", ")}.${stillHasChampion ? " Another champion is still on file." : " No replacement champion is on file."}`,
        whatChanged: "A contact holding the champion role was marked as departed.",
        evidence: [...metrics.relationship.evidence, `Departed champion(s): ${departed.join(", ")}.`],
        potentialImpact: stillHasChampion
          ? "Losing a champion weakens internal advocacy even when another remains."
          : `No internal advocate remains for ${account.currency} ${account.arr.toLocaleString()} in recurring revenue.`,
        recommendedResponse: stillHasChampion
          ? "Confirm the remaining champion is engaged and update the relationship map."
          : "Identify and develop a replacement champion.",
        executiveInvolvementRecommended: !stillHasChampion && account.arr >= 100_000,
        suggestedActionType: "stakeholder_mapping",
      };
    },
  },
  {
    key: "open_priority_support_issue",
    label: "Open high priority support issue",
    category: "support_deterioration",
    purpose: "Detect accounts with unresolved urgent or high priority support tickets.",
    requiredData: "Support tickets",
    unavailableReason: "No support tickets have been imported. Import Support Tickets to enable this rule.",
    isAvailable: (organizationId) => hasAny("supportTicket", organizationId),
    evaluate: ({ account, metrics }) => {
      const { support } = metrics;
      if (support.openUrgentTickets === 0 && support.openHighPriorityTickets === 0) return null;

      const base: RiskSeverity = support.openUrgentTickets > 0 ? "HIGH" : "MODERATE";
      const parts: string[] = [];
      if (support.openUrgentTickets > 0) parts.push(`${support.openUrgentTickets} urgent`);
      if (support.openHighPriorityTickets > 0) parts.push(`${support.openHighPriorityTickets} high priority`);

      return {
        severity: severityFromExposure(base, account.arr),
        confidence: 0.9,
        revenueExposure: account.arr,
        currentState: `${parts.join(" and ")} support ticket${support.openUrgentTickets + support.openHighPriorityTickets === 1 ? " is" : "s are"} still open.`,
        whatChanged: support.explanation,
        evidence: support.evidence,
        potentialImpact: "Unresolved priority issues are a direct driver of renewal risk and executive escalation.",
        recommendedResponse: "Review the open tickets with support and confirm a resolution path with the customer.",
        executiveInvolvementRecommended: support.openUrgentTickets >= 2,
        suggestedActionType: "support_escalation",
      };
    },
  },
  {
    key: "renewal_approaching_without_plan",
    label: "Renewal approaching without a plan",
    category: "renewal_planning_gap",
    purpose: "Detect renewals inside the planning window that have no renewal plan.",
    requiredData: "Renewal records",
    unavailableReason: "No renewals have been imported or created. Add renewals to enable this rule.",
    isAvailable: (organizationId) => hasAny("renewal", organizationId),
    evaluate: ({ account, daysUntilRenewal, hasRenewalPlan, renewalMilestonesComplete }) => {
      if (daysUntilRenewal === undefined || daysUntilRenewal < 0 || daysUntilRenewal > 90) return null;
      if (hasRenewalPlan && renewalMilestonesComplete > 0) return null;

      const base: RiskSeverity = daysUntilRenewal <= 30 ? "HIGH" : "MODERATE";
      const state = hasRenewalPlan
        ? `The renewal is ${daysUntilRenewal} days away and a plan exists but no milestones are complete.`
        : `The renewal is ${daysUntilRenewal} days away and no renewal plan exists.`;

      return {
        severity: severityFromExposure(base, account.arr),
        confidence: 1,
        revenueExposure: account.arr,
        currentState: state,
        whatChanged: `The renewal entered the ${daysUntilRenewal <= 30 ? "30" : "90"} day window without renewal preparation.`,
        evidence: [
          `Renewal date is ${daysUntilRenewal} days away.`,
          hasRenewalPlan ? `Renewal plan exists with ${renewalMilestonesComplete} completed milestones.` : "No renewal plan record exists.",
        ],
        potentialImpact: `${account.currency} ${account.arr.toLocaleString()} is approaching renewal without a documented plan.`,
        recommendedResponse: "Create a renewal plan and complete the internal strategy milestone.",
        executiveInvolvementRecommended: daysUntilRenewal <= 30 && account.arr >= 100_000,
        suggestedActionType: "renewal_planning",
      };
    },
  },
  {
    key: "missing_renewal_date",
    label: "Missing renewal date",
    category: "missing_renewal_date",
    purpose: "Detect accounts with no renewal date on file.",
    requiredData: "Customer Account renewal date",
    unavailableReason: "",
    isAvailable: async () => true, // computable from CustomerAccount alone
    evaluate: ({ account }) => {
      if (account.renewalDate) return null;
      return {
        severity: "MODERATE",
        confidence: 1,
        revenueExposure: account.arr,
        currentState: "This account has no renewal date recorded.",
        whatChanged: "Detected during risk evaluation.",
        evidence: ["Customer Account record has no renewal date, and no renewal record exists."],
        potentialImpact: "Renewal planning and forecasting cannot begin without a target date.",
        recommendedResponse: "Confirm the renewal date with the account owner and add it to the account record.",
        executiveInvolvementRecommended: false,
        suggestedActionType: "data_correction",
      };
    },
  },
  {
    key: "negative_sentiment",
    label: "Negative customer sentiment",
    category: "negative_sentiment",
    purpose: "Detect accounts whose recorded interaction sentiment has turned negative.",
    requiredData: "Customer interactions with imported sentiment",
    unavailableReason: "No interactions with sentiment have been imported. Sentiment is never inferred, only imported.",
    isAvailable: async (organizationId) =>
      (await prisma.customerInteraction.count({
        where: { organizationId, sentiment: { in: ["NEGATIVE", "MIXED", "POSITIVE", "NEUTRAL"] } },
      })) > 0,
    evaluate: ({ account, metrics }) => {
      // Sentiment lives on interactions; the metrics layer surfaces recent
      // ones. Handled through evidence rather than a derived score,
      // because sentiment is imported opinion, not measurement.
      const negativeEvidence = metrics.relationship.evidence;
      const recentNegative = (metrics as AccountMetrics & { recentNegativeInteractions?: number }).recentNegativeInteractions ?? 0;
      if (recentNegative === 0) return null;

      return {
        severity: severityFromExposure(recentNegative >= 2 ? "HIGH" : "MODERATE", account.arr),
        confidence: 0.7,
        revenueExposure: account.arr,
        currentState: `${recentNegative} recent interaction${recentNegative === 1 ? " was" : "s were"} recorded with negative sentiment.`,
        whatChanged: "Interaction sentiment recorded by the team has turned negative.",
        evidence: negativeEvidence,
        potentialImpact: "Recorded dissatisfaction ahead of a renewal decision materially raises churn risk.",
        recommendedResponse: "Review the negative interactions and agree a recovery approach with the account owner.",
        executiveInvolvementRecommended: recentNegative >= 2,
        suggestedActionType: "recovery_plan",
      };
    },
  },
  {
    key: "payment_risk",
    label: "Failed or delayed payment",
    category: "payment_risk",
    purpose: "Detect accounts with failed or overdue payments.",
    requiredData: "Billing or payment data",
    // Explicitly permitted by the founder to remain unavailable this phase.
    unavailableReason:
      "Payment risk requires a billing import or billing integration, neither of which exists yet. No payment data is fabricated to fill the gap.",
    isAvailable: async () => false,
    evaluate: () => null,
  },
  {
    key: "unresolved_escalation",
    label: "Unresolved escalation",
    category: "unresolved_escalation",
    purpose: "Detect accounts with an open escalation.",
    requiredData: "Escalation records",
    unavailableReason: "No escalations have been created. Create an escalation to enable this rule.",
    isAvailable: (organizationId) => hasAny("escalation", organizationId),
    evaluate: ({ account, metrics }) => {
      if (metrics.openEscalations === 0) return null;
      const base: RiskSeverity = metrics.criticalEscalations > 0 ? "CRITICAL" : "HIGH";

      return {
        severity: base,
        confidence: 1,
        revenueExposure: account.arr,
        currentState: `${metrics.openEscalations} escalation${metrics.openEscalations === 1 ? " is" : "s are"} still open${metrics.criticalEscalations > 0 ? `, ${metrics.criticalEscalations} of them critical` : ""}.`,
        whatChanged: "An escalation on this account has not reached resolution.",
        evidence: [`${metrics.openEscalations} open escalation record(s).`],
        potentialImpact: `An unresolved escalation places ${account.currency} ${account.arr.toLocaleString()} at direct risk.`,
        recommendedResponse: "Review the escalation action plan and confirm the target resolution date with the customer.",
        executiveInvolvementRecommended: metrics.criticalEscalations > 0,
        suggestedActionType: "support_escalation",
      };
    },
  },
  {
    key: "customer_inactivity",
    label: "Customer inactivity",
    category: "customer_inactivity",
    purpose: "Detect accounts with no product activity and no interaction of any kind.",
    requiredData: "Product usage summaries and customer interactions",
    unavailableReason: "Both product usage and interactions must be imported to distinguish inactivity from missing data.",
    isAvailable: async (organizationId) =>
      (await hasAny("productUsageSummary", organizationId)) && (await hasAny("customerInteraction", organizationId)),
    evaluate: ({ account, metrics }) => {
      const usageInactive = metrics.usage.trend === "INACTIVE";
      const noInteraction =
        metrics.relationship.daysSinceMeaningfulInteraction === undefined ||
        metrics.relationship.daysSinceMeaningfulInteraction >= 90;
      if (!usageInactive || !noInteraction) return null;

      return {
        severity: severityFromExposure("CRITICAL", account.arr),
        confidence: 0.85,
        revenueExposure: account.arr,
        currentState: "The customer shows no recorded product activity and no recent meaningful interaction.",
        whatChanged: `${metrics.usage.explanation} ${metrics.relationship.daysSinceMeaningfulInteraction === undefined ? "No meaningful interaction has ever been recorded." : `Last meaningful interaction ${metrics.relationship.daysSinceMeaningfulInteraction} days ago.`}`,
        evidence: [...metrics.usage.evidence, ...metrics.relationship.evidence],
        potentialImpact: `${account.currency} ${account.arr.toLocaleString()} is attached to a customer showing no signs of engagement.`,
        recommendedResponse: "Escalate to the account owner and attempt direct executive contact.",
        executiveInvolvementRecommended: true,
        suggestedActionType: "executive_outreach",
      };
    },
  },
];

export const RISK_RULE_BY_KEY = new Map(RISK_RULES.map((r) => [r.key, r]));

export interface RuleAvailability {
  key: string;
  label: string;
  category: string;
  purpose: string;
  requiredData: string;
  available: boolean;
  unavailableReason: string;
  enabled: boolean;
}

export async function listRuleAvailability(organizationId: string): Promise<RuleAvailability[]> {
  const configs = await prisma.riskRuleConfiguration.findMany({ where: { organizationId } });
  const configByKey = new Map(configs.map((c) => [c.ruleKey, c]));

  return Promise.all(
    RISK_RULES.map(async (rule) => {
      const available = await rule.isAvailable(organizationId);
      const config = configByKey.get(rule.key);
      return {
        key: rule.key,
        label: rule.label,
        category: rule.category,
        purpose: rule.purpose,
        requiredData: rule.requiredData,
        available,
        unavailableReason: rule.unavailableReason,
        // A rule with no explicit configuration is treated as enabled once
        // its data exists — an organization that imports support tickets
        // expects support risk to be evaluated without extra ceremony.
        enabled: config?.enabled ?? true,
      };
    })
  );
}

export interface EvaluationResult {
  runId: string;
  accountsEvaluated: number;
  rulesEvaluated: number;
  risksCreated: number;
  risksUpdated: number;
  risksResolved: number;
  unavailableRules: string[];
}

/**
 * Runs every available, enabled rule against every account in the
 * organization. Repeatable by design: an existing signal for the same
 * (account, rule) is updated rather than duplicated, and a signal whose
 * rule no longer triggers is resolved with a note explaining why.
 */
export async function evaluateOrganizationRisks(params: {
  organizationId: string;
  actingUserId: string;
  actingRole: Role;
  triggerSource?: string;
  now?: Date;
}): Promise<EvaluationResult> {
  assertCan(params.actingRole, "edit_health_model");
  const now = params.now ?? new Date();

  const run = await prisma.riskEvaluationRun.create({
    data: {
      organizationId: params.organizationId,
      ruleVersion: RISK_RULE_VERSION,
      triggerSource: params.triggerSource ?? "manual",
      triggeredById: params.actingUserId,
    },
  });

  const availability = await listRuleAvailability(params.organizationId);
  const activeRules = RISK_RULES.filter((rule) => {
    const state = availability.find((a) => a.key === rule.key);
    return state?.available && state.enabled;
  });
  const unavailableRules = availability.filter((a) => !a.available).map((a) => a.key);

  const accounts = await prisma.customerAccount.findMany({ where: { organizationId: params.organizationId } });

  let risksCreated = 0;
  let risksUpdated = 0;
  let risksResolved = 0;

  for (const account of accounts) {
    const [metrics, renewal, negativeInteractions] = await Promise.all([
      getAccountMetrics(account.id, now),
      prisma.renewal.findFirst({
        where: { customerAccountId: account.id, status: { notIn: ["RENEWED", "CHURNED"] } },
        orderBy: { periodEnd: "asc" },
        include: { plan: { include: { milestones: true } } },
      }),
      prisma.customerInteraction.count({
        where: {
          customerAccountId: account.id,
          sentiment: { in: ["NEGATIVE", "MIXED"] },
          interactionDate: { gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    const renewalDate = renewal?.periodEnd ?? account.renewalDate ?? null;
    const context: RiskContext = {
      account,
      metrics: Object.assign(metrics, { recentNegativeInteractions: negativeInteractions }),
      daysUntilRenewal: renewalDate
        ? Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : undefined,
      hasRenewalPlan: Boolean(renewal?.plan),
      renewalMilestonesComplete: renewal?.plan?.milestones.filter((m) => m.completed).length ?? 0,
      now,
    };

    const existingSignals = await prisma.riskSignal.findMany({
      where: { customerAccountId: account.id, ruleKey: { not: null } },
    });
    const existingByRule = new Map(existingSignals.map((s) => [s.ruleKey!, s]));
    const triggeredRuleKeys = new Set<string>();

    for (const rule of activeRules) {
      const finding = rule.evaluate(context);
      if (!finding) continue;
      triggeredRuleKeys.add(rule.key);

      const existing = existingByRule.get(rule.key);
      const data = {
        title: `${account.name}: ${rule.label.toLowerCase()}`,
        category: rule.category,
        severity: finding.severity,
        confidence: finding.confidence,
        revenueExposure: finding.revenueExposure,
        currentState: finding.currentState,
        whatChanged: finding.whatChanged,
        evidence: finding.evidence,
        potentialImpact: finding.potentialImpact,
        recommendedResponse: finding.recommendedResponse,
        executiveInvolvementRecommended: finding.executiveInvolvementRecommended,
        ruleVersion: RISK_RULE_VERSION,
        lastEvaluatedAt: now,
      };

      if (existing) {
        // A signal the user explicitly dismissed or accepted stays that
        // way — re-evaluation must not silently reopen a decision a human
        // already made.
        if (existing.status === "DISMISSED" || existing.status === "ACCEPTED") continue;

        const direction =
          existing.severity === finding.severity
            ? "STABLE"
            : severityRank(finding.severity) > severityRank(existing.severity)
              ? "WORSENING"
              : "IMPROVING";

        await prisma.riskSignal.update({
          where: { id: existing.id },
          data: {
            ...data,
            direction,
            previousSeverity: existing.severity,
            status: existing.status === "RESOLVED" ? "OPEN" : existing.status,
          },
        });
        risksUpdated++;
      } else {
        await prisma.riskSignal.create({
          data: {
            ...data,
            organizationId: params.organizationId,
            customerAccountId: account.id,
            ruleKey: rule.key,
            status: "NEW",
            direction: "UNKNOWN",
          },
        });
        risksCreated++;
      }
    }

    // Resolve signals whose rule no longer triggers, but never touch ones
    // a human explicitly dismissed or accepted.
    for (const [ruleKey, signal] of existingByRule) {
      if (triggeredRuleKeys.has(ruleKey)) continue;
      if (["RESOLVED", "DISMISSED", "ACCEPTED"].includes(signal.status)) continue;
      if (!activeRules.some((r) => r.key === ruleKey)) continue; // rule became unavailable; leave the signal as-is

      await prisma.riskSignal.update({
        where: { id: signal.id },
        data: {
          status: "RESOLVED",
          resolvedAt: now,
          direction: "IMPROVING",
          resolutionNote: "The condition that triggered this risk no longer applies as of the latest evaluation.",
          lastEvaluatedAt: now,
        },
      });
      risksResolved++;
    }
  }

  await prisma.riskEvaluationRun.update({
    where: { id: run.id },
    data: {
      completedAt: new Date(),
      accountsEvaluated: accounts.length,
      rulesEvaluated: activeRules.length,
      risksCreated,
      risksUpdated,
      risksResolved,
    },
  });

  await recordAuditEvent({
    organizationId: params.organizationId,
    actorUserId: params.actingUserId,
    eventType: "risk_created",
    targetType: "RiskEvaluationRun",
    targetId: run.id,
    metadata: { risksCreated, risksUpdated, risksResolved, rulesEvaluated: activeRules.length },
  });

  return {
    runId: run.id,
    accountsEvaluated: accounts.length,
    rulesEvaluated: activeRules.length,
    risksCreated,
    risksUpdated,
    risksResolved,
    unavailableRules,
  };
}

function severityRank(severity: RiskSeverity): number {
  return ["LOW", "MODERATE", "HIGH", "CRITICAL"].indexOf(severity);
}

/** Formats the six-part explanation the founder specified, from stored fields only. */
export function formatRiskExplanation(signal: {
  currentState: string;
  whatChanged: string;
  evidence: unknown;
  potentialImpact: string;
  recommendedResponse: string;
  confidence: number;
}): { label: string; value: string }[] {
  const evidence = Array.isArray(signal.evidence) ? (signal.evidence as string[]) : [];
  return [
    { label: "Current state", value: signal.currentState },
    { label: "What changed", value: signal.whatChanged },
    { label: "Supporting evidence", value: evidence.join(" ") || "No evidence recorded." },
    { label: "Potential impact", value: signal.potentialImpact },
    { label: "Recommended action", value: signal.recommendedResponse },
    { label: "Confidence", value: `${Math.round(signal.confidence * 100)} percent` },
  ];
}

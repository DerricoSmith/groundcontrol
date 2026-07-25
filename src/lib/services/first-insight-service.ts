import "server-only";
import { prisma } from "@/lib/prisma";

export interface FirstInsight {
  type: string;
  customerAccountId?: string;
  customerAccountName?: string;
  title: string;
  currentState: string;
  evidence: string[];
  potentialImpact: string;
  recommendedAction: string;
  confidence: number;
  basis: "rule_based";
}

/**
 * Deterministic, rule-based insights computed only from facts actually on
 * file — no AI, no fabricated risk or health content. With only
 * CustomerAccount data imported (no usage/support/interaction data yet),
 * the honest set of computable insights is small; this returns what's
 * genuinely derivable and nothing more. See PRODUCT.md's explanation
 * format (current state / what changed / evidence / impact / action /
 * confidence) — followed here even outside the RiskSignal model.
 */
export async function getFirstInsights(organizationId: string): Promise<FirstInsight[]> {
  const accounts = await prisma.customerAccount.findMany({ where: { organizationId } });
  if (accounts.length === 0) return [];

  const insights: FirstInsight[] = [];

  const byRevenue = [...accounts].filter((a) => a.arr > 0).sort((a, b) => b.arr - a.arr);
  if (byRevenue.length > 0) {
    const top = byRevenue[0];
    insights.push({
      type: "largest_revenue_exposure",
      customerAccountId: top.id,
      customerAccountName: top.name,
      title: `${top.name} is your largest account by recurring revenue`,
      currentState: `${top.name} represents ${top.currency} ${top.arr.toLocaleString()} in annual recurring revenue.`,
      evidence: [`Customer Account record: arr = ${top.arr} ${top.currency}`],
      potentialImpact: "This account has the largest single revenue impact in your portfolio if it churns or contracts.",
      recommendedAction: "Confirm ownership and renewal timing are current for this account.",
      confidence: 1,
      basis: "rule_based",
    });
  }

  const incompleteness = accounts.map((a) => {
    const missing = [a.arr === 0, !a.renewalDate, !a.ownerId, !a.segment].filter(Boolean).length;
    return { account: a, missing };
  });
  const mostIncomplete = incompleteness.sort((a, b) => b.missing - a.missing)[0];
  if (mostIncomplete && mostIncomplete.missing > 0) {
    const missingFields = [
      mostIncomplete.account.arr === 0 ? "recurring revenue" : null,
      !mostIncomplete.account.renewalDate ? "renewal date" : null,
      !mostIncomplete.account.ownerId ? "an owner" : null,
      !mostIncomplete.account.segment ? "a segment" : null,
    ].filter((v): v is string => v !== null);

    insights.push({
      type: "incomplete_data",
      customerAccountId: mostIncomplete.account.id,
      customerAccountName: mostIncomplete.account.name,
      title: `${mostIncomplete.account.name} has the most missing information`,
      currentState: `${mostIncomplete.account.name} is missing ${missingFields.join(", ")}.`,
      evidence: [`Customer Account record has ${mostIncomplete.missing} of 4 tracked fields unset.`],
      potentialImpact: "Ground Control can't reliably assess this account's health or renewal risk until this information is added.",
      recommendedAction: `Add ${missingFields[0]} for this account, either manually or in a follow-up import.`,
      confidence: 1,
      basis: "rule_based",
    });
  }

  const missingRenewalCount = accounts.filter((a) => !a.renewalDate).length;
  if (missingRenewalCount > 0) {
    insights.push({
      type: "renewal_visibility_gap",
      title: `${missingRenewalCount} of ${accounts.length} accounts have no renewal date`,
      currentState: `${missingRenewalCount} account${missingRenewalCount === 1 ? " has" : "s have"} no renewal date on file.`,
      evidence: [`${missingRenewalCount} Customer Account records with renewalDate = null.`],
      potentialImpact: "Renewal Center and forecasting will be limited for these accounts until dates are added.",
      recommendedAction: "Add renewal dates for these accounts when available.",
      confidence: 1,
      basis: "rule_based",
    });
  }

  return insights;
}

export type DataReadinessLabel = "Ready" | "Usable" | "Limited" | "Needs Attention";

export interface DataReadiness {
  label: DataReadinessLabel;
  accountsLoaded: number;
  withOwner: number;
  withRevenue: number;
  withRenewalDate: number;
  averageConfidence: number;
  explanation: string;
}

/** Same four-label vocabulary as setup-checklist readiness (onboarding-service.ts), applied here to imported customer data specifically rather than configuration completeness. */
export async function calculateDataReadiness(organizationId: string): Promise<DataReadiness> {
  const accounts = await prisma.customerAccount.findMany({ where: { organizationId } });

  if (accounts.length === 0) {
    return {
      label: "Needs Attention",
      accountsLoaded: 0,
      withOwner: 0,
      withRevenue: 0,
      withRenewalDate: 0,
      averageConfidence: 0,
      explanation: "No customer accounts have been imported yet.",
    };
  }

  const withOwner = accounts.filter((a) => a.ownerId).length;
  const withRevenue = accounts.filter((a) => a.arr > 0).length;
  const withRenewalDate = accounts.filter((a) => a.renewalDate).length;
  const averageConfidence = accounts.reduce((s, a) => s + a.dataConfidence, 0) / accounts.length;

  let label: DataReadinessLabel;
  let explanation: string;
  if (withRenewalDate === accounts.length && withRevenue === accounts.length) {
    label = "Ready";
    explanation = `Your customer list is ready. All ${accounts.length} accounts have revenue and renewal dates on file.`;
  } else if (withRenewalDate >= accounts.length * 0.5) {
    label = "Usable";
    explanation = `Your customer list is usable. Renewal visibility is limited because ${accounts.length - withRenewalDate} of ${accounts.length} accounts do not have a renewal date.`;
  } else if (accounts.length > 0 && withRenewalDate > 0) {
    label = "Limited";
    explanation = `Your customer list is limited. Only ${withRenewalDate} of ${accounts.length} accounts have a renewal date, and ${accounts.length - withRevenue} have no recurring revenue on file.`;
  } else {
    label = "Limited";
    explanation = `${accounts.length} account${accounts.length === 1 ? "" : "s"} loaded, but none have a renewal date yet. Renewal Center and forecasting will not be usable until dates are added.`;
  }

  return { label, accountsLoaded: accounts.length, withOwner, withRevenue, withRenewalDate, averageConfidence, explanation };
}

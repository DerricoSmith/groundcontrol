import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { DEMO_ORGANIZATION_SLUG } from "@/lib/demo/demo-config";
import { getPortfolioSummary, OPEN_RISK_STATUSES, OPEN_ACTION_STATUSES } from "@/lib/services/portfolio-summary-service";
import { calculateAccountHealth } from "@/lib/services/health-calculation-service";
import { getAccountMetrics } from "@/lib/services/account-metrics-service";
import { OPEN_ESCALATION_STATUSES } from "@/lib/services/escalation-constants";

/**
 * The public demo's only route to the database.
 *
 * Everything here is read-only by construction: there is no write path in this
 * module, and no caller passes an organization id. The demo organization is
 * resolved from a constant slug and additionally required to carry isDemo,
 * so a public visitor cannot reach a real customer's data even if a route
 * parameter is tampered with.
 *
 * This is the "server rendered read-only demonstration routes" option from
 * DECISIONS.md. It was chosen over a guest role or a cloned session because it
 * needs no authentication surface at all, which is the smallest thing that can
 * go wrong.
 */

export class DemoUnavailableError extends Error {}

/** Cached per request so one page render resolves the organization once. */
export const getDemoOrganization = cache(async () => {
  const organization = await prisma.organization.findUnique({
    where: { slug: DEMO_ORGANIZATION_SLUG },
    select: { id: true, name: true, isDemo: true },
  });

  if (!organization) {
    throw new DemoUnavailableError("The demonstration environment has not been seeded yet.");
  }
  if (!organization.isDemo) {
    // Refusing rather than rendering: an organization occupying the demo slug
    // without the demo flag is a misconfiguration, not something to show.
    throw new DemoUnavailableError("The demonstration organization is not marked as demo data.");
  }

  return organization;
});

export async function getDemoPortfolio() {
  const organization = await getDemoOrganization();
  const summary = await getPortfolioSummary(organization.id);
  return { organization, summary };
}

export async function getDemoAccounts() {
  const organization = await getDemoOrganization();
  const accounts = await prisma.customerAccount.findMany({
    where: { organizationId: organization.id },
    include: {
      owner: { select: { name: true } },
      riskSignals: { where: { status: { in: [...OPEN_RISK_STATUSES] } }, select: { id: true, severity: true } },
    },
    orderBy: { arr: "desc" },
  });
  return { organization, accounts };
}

export async function getDemoAccount(externalId: string) {
  const organization = await getDemoOrganization();

  // Looked up by the seed's stable external id within the demo organization,
  // never by a raw database id from the URL.
  const account = await prisma.customerAccount.findFirst({
    where: { organizationId: organization.id, externalId },
    include: {
      owner: { select: { name: true } },
      riskSignals: { where: { status: { in: [...OPEN_RISK_STATUSES] } }, orderBy: { severity: "asc" } },
      recommendedActions: { where: { status: { in: [...OPEN_ACTION_STATUSES] } } },
      contacts: { where: { isActive: true }, orderBy: { name: "asc" } },
      renewals: { orderBy: { periodEnd: "asc" } },
      escalations: { where: { status: { in: OPEN_ESCALATION_STATUSES } } },
      usageSummaries: { orderBy: { periodEnd: "desc" }, take: 4 },
      supportTickets: { orderBy: { createdDate: "desc" }, take: 6 },
      interactions: { orderBy: { interactionDate: "desc" }, take: 6 },
      dataQualityIssues: { where: { status: { not: "RESOLVED" } } },
    },
  });

  if (!account) return null;

  const [health, metrics] = await Promise.all([
    calculateAccountHealth({ customerAccountId: account.id }),
    getAccountMetrics(account.id),
  ]);

  return { organization, account, health, metrics };
}

export async function getDemoActions() {
  const organization = await getDemoOrganization();
  const actions = await prisma.recommendedAction.findMany({
    where: { organizationId: organization.id, status: { in: [...OPEN_ACTION_STATUSES, "SUGGESTED"] } },
    include: {
      customerAccount: { select: { name: true, externalId: true, arr: true } },
      riskSignal: { select: { title: true, severity: true, currentState: true, evidence: true } },
    },
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    take: 40,
  });
  return { organization, actions };
}

export async function getDemoRenewals() {
  const organization = await getDemoOrganization();
  const renewals = await prisma.renewal.findMany({
    where: { organizationId: organization.id, status: { notIn: ["RENEWED", "CHURNED"] } },
    include: {
      customerAccount: { select: { name: true, externalId: true, healthCategory: true, healthCalculatedAt: true } },
      plan: { include: { milestones: { orderBy: { order: "asc" } } } },
    },
    orderBy: { periodEnd: "asc" },
  });
  return { organization, renewals };
}

export async function getDemoBrief() {
  const organization = await getDemoOrganization();
  const brief = await prisma.executiveBrief.findFirst({
    where: { organizationId: organization.id },
    orderBy: { generatedAt: "desc" },
    include: { sections: { orderBy: { order: "asc" } } },
  });
  return { organization, brief };
}

export async function getDemoRisks() {
  const organization = await getDemoOrganization();
  const risks = await prisma.riskSignal.findMany({
    where: { organizationId: organization.id, status: { in: [...OPEN_RISK_STATUSES] } },
    include: { customerAccount: { select: { name: true, externalId: true, arr: true, currency: true } } },
    orderBy: [{ severity: "asc" }, { detectedAt: "desc" }],
  });
  return { organization, risks };
}

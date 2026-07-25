import { testDb } from "./test-db";
import type { Role } from "@prisma/client";

export interface SeededOrg {
  organizationId: string;
  organizationSlug: string;
  ownerId: string;
  ownerEmail: string;
  customerAccountId: string;
  renewalId: string;
  healthScoreId: string;
  riskSignalId: string;
  recommendedActionId: string;
  dataSourceId: string;
  importJobId: string;
  auditEventId: string;
}

/**
 * Builds one fully-populated organization — one of every tenant-owned model
 * this schema currently has — so tenant-isolation tests can assert that
 * every single one of them is invisible from a different organization's
 * scoped queries, not just CustomerAccount.
 */
async function seedOrg(label: "Alpha" | "Beta"): Promise<SeededOrg> {
  const ownerEmail = `owner-${label.toLowerCase()}@test.groundcontrol.local`;

  const owner = await testDb.user.create({
    data: {
      name: `${label} Owner`,
      email: ownerEmail,
      passwordHash: "not-a-real-hash-test-fixture-only",
    },
  });

  const organization = await testDb.organization.create({
    data: {
      name: `Organization ${label}`,
      slug: `organization-${label.toLowerCase()}`,
      memberships: { create: { userId: owner.id, role: "OWNER" as Role } },
    },
  });

  const dataSource = await testDb.dataSource.create({
    data: { organizationId: organization.id, label: `${label} manual entry`, kind: "manual" },
  });

  const account = await testDb.customerAccount.create({
    data: {
      organizationId: organization.id,
      name: `${label} Flagship Customer`,
      arr: 120000,
      healthCategory: "WATCH",
      dataSourceId: dataSource.id,
    },
  });

  const renewal = await testDb.renewal.create({
    data: {
      organizationId: organization.id,
      customerAccountId: account.id,
      periodStart: new Date("2026-01-01"),
      periodEnd: new Date("2026-12-31"),
      arr: 120000,
      forecastCategory: "AT_RISK",
      forecastConfidence: 0.6,
    },
  });

  const healthScore = await testDb.healthScore.create({
    data: {
      organizationId: organization.id,
      customerAccountId: account.id,
      overallScore: 62,
      category: "WATCH",
      calculationVersion: "v1",
      dataConfidence: 0.7,
      components: {
        create: [
          { type: "PRODUCT_ADOPTION", score: 55, weight: 0.3, confidence: 0.7, explanation: `${label} adoption is down.` },
        ],
      },
    },
  });

  const riskSignal = await testDb.riskSignal.create({
    data: {
      organizationId: organization.id,
      customerAccountId: account.id,
      title: `${label} usage decline`,
      category: "adoption_decline",
      severity: "HIGH",
      confidence: 0.75,
      revenueExposure: 120000,
      currentState: `${label} usage has dropped 30% over 60 days.`,
      whatChanged: "Weekly active seats fell from 40 to 28.",
      evidence: [`${label} product usage summary, last 60 days`],
      potentialImpact: "Renewal at risk if trend continues.",
      recommendedResponse: "Schedule an executive check-in within two weeks.",
    },
  });

  const action = await testDb.recommendedAction.create({
    data: {
      organizationId: organization.id,
      customerAccountId: account.id,
      riskSignalId: riskSignal.id,
      title: `Schedule executive check-in for ${label}`,
      actionType: "executive_outreach",
      reason: "Usage decline risk detected.",
      evidence: [`${label} usage decline risk signal`],
      status: "ASSIGNED",
    },
  });

  const importJob = await testDb.importJob.create({
    data: {
      organizationId: organization.id,
      createdById: owner.id,
      entityType: "customer_account",
      fileName: `${label.toLowerCase()}-accounts.csv`,
      status: "committed",
      totalRows: 1,
      successRows: 1,
    },
  });

  const auditEvent = await testDb.auditEvent.create({
    data: {
      organizationId: organization.id,
      actorUserId: owner.id,
      eventType: "organization_created",
      targetType: "Organization",
      targetId: organization.id,
      metadata: { name: organization.name },
    },
  });

  return {
    organizationId: organization.id,
    organizationSlug: organization.slug,
    ownerId: owner.id,
    ownerEmail,
    customerAccountId: account.id,
    renewalId: renewal.id,
    healthScoreId: healthScore.id,
    riskSignalId: riskSignal.id,
    recommendedActionId: action.id,
    dataSourceId: dataSource.id,
    importJobId: importJob.id,
    auditEventId: auditEvent.id,
  };
}

export async function seedTwoOrganizations(): Promise<{ alpha: SeededOrg; beta: SeededOrg }> {
  const alpha = await seedOrg("Alpha");
  const beta = await seedOrg("Beta");
  return { alpha, beta };
}

import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { testDb, resetTestDatabase, disconnectTestDatabase } from "../helpers/test-db";
import { getPortfolioSummary } from "@/lib/services/portfolio-summary-service";
import { buildBriefSections } from "@/lib/services/executive-brief-service";

const NOW = new Date("2026-07-01T00:00:00Z");

describe("portfolio summary and executive brief", () => {
  let orgId: string;
  let otherOrgId: string;
  let ownerId: string;

  beforeAll(async () => {
    await resetTestDatabase();
  });
  afterEach(async () => {
    await resetTestDatabase();
  });
  afterAll(async () => {
    await disconnectTestDatabase();
  });

  async function seedOrganization() {
    const owner = await testDb.user.create({ data: { name: "Owner", email: `o-${Math.random()}@pf.local`, passwordHash: "x" } });
    const org = await testDb.organization.create({
      data: { name: "Portfolio Co", slug: `pf-${Math.random()}`, memberships: { create: { userId: owner.id, role: "OWNER" } } },
    });
    const other = await testDb.organization.create({ data: { name: "Other", slug: `oth-${Math.random()}` } });
    orgId = org.id;
    otherOrgId = other.id;
    ownerId = owner.id;
  }

  it("reports an empty portfolio without inventing anything", async () => {
    await seedOrganization();
    const summary = await getPortfolioSummary(orgId, NOW);

    expect(summary.accountCount).toBe(0);
    expect(summary.totalArr).toBe(0);
    expect(summary.needsAttention).toHaveLength(0);
    expect(summary.recentChanges).toHaveLength(0);

    const sections = await buildBriefSections(orgId, NOW);
    expect(sections).toHaveLength(1);
    expect(sections[0].key).toBe("no_data");
    expect(sections[0].content).toContain("No customer accounts have been imported");
  });

  it("counts accounts, revenue, and gaps from records that exist", async () => {
    await seedOrganization();
    const scored = new Date("2026-06-30");
    await testDb.customerAccount.createMany({
      data: [
        { organizationId: orgId, name: "Alpha", arr: 100000, healthCategory: "AT_RISK", healthCalculatedAt: scored, ownerId, renewalDate: new Date("2026-08-01") },
        { organizationId: orgId, name: "Beta", arr: 50000, healthCategory: "STRONG", healthCalculatedAt: scored },
        { organizationId: orgId, name: "Gamma", arr: 0, healthCategory: "STABLE", healthCalculatedAt: scored },
      ],
    });

    const summary = await getPortfolioSummary(orgId, NOW);
    expect(summary.accountCount).toBe(3);
    expect(summary.totalArr).toBe(150000);
    expect(summary.accountsMissingArr).toBe(1);
    expect(summary.arrInAtRiskAccounts).toBe(100000);
    expect(summary.accountsWithoutOwner).toBe(2);
    expect(summary.renewalsMissingDate).toBe(2);

    const atRisk = summary.healthDistribution.find((entry) => entry.category === "AT_RISK")!;
    expect(atRisk.accounts).toBe(1);
    expect(atRisk.arr).toBe(100000);
  });

  it("never reports an unscored account as healthy", async () => {
    await seedOrganization();
    // healthCategory defaults to STABLE in storage; nothing has been calculated.
    await testDb.customerAccount.create({ data: { organizationId: orgId, name: "Unscored", arr: 80000 } });

    const summary = await getPortfolioSummary(orgId, NOW);
    expect(summary.accountsNotAssessed).toBe(1);
    expect(summary.arrNotAssessed).toBe(80000);

    const stable = summary.healthDistribution.find((entry) => entry.category === "STABLE")!;
    expect(stable.accounts).toBe(0);
    expect(stable.arr).toBe(0);

    const sections = await buildBriefSections(orgId, NOW);
    const health = sections.find((section) => section.key === "portfolio_health")!;
    expect(health.content).toContain("never had a health score calculated");
  });

  it("does not call data quality Ready when it has never been evaluated", async () => {
    await seedOrganization();
    await testDb.customerAccount.create({ data: { organizationId: orgId, name: "Alpha", arr: 1000 } });

    const sections = await buildBriefSections(orgId, NOW);
    const readiness = sections.find((section) => section.key === "data_readiness")!;
    expect(readiness.content).toContain("Not Evaluated");
    expect(readiness.content).toContain("never been checked");
  });

  it("never counts another organization's records", async () => {
    await seedOrganization();
    await testDb.customerAccount.create({ data: { organizationId: otherOrgId, name: "Foreign", arr: 999999 } });

    const summary = await getPortfolioSummary(orgId, NOW);
    expect(summary.accountCount).toBe(0);
    expect(summary.totalArr).toBe(0);
  });

  it("lists an account needing attention only when it has a real risk or escalation", async () => {
    await seedOrganization();
    const quiet = await testDb.customerAccount.create({ data: { organizationId: orgId, name: "Quiet", arr: 10000 } });
    const loud = await testDb.customerAccount.create({ data: { organizationId: orgId, name: "Loud", arr: 200000 } });

    await testDb.riskSignal.create({
      data: {
        organizationId: orgId,
        customerAccountId: loud.id,
        ruleKey: "product_usage_decline",
        title: "Usage falling",
        category: "adoption_decline",
        severity: "CRITICAL",
        status: "OPEN",
        whatChanged: "Weekly active users fell.",
        currentState: "Usage is down 40 percent.",
        potentialImpact: "The renewal is exposed.",
        recommendedResponse: "Run an adoption review.",
        evidence: ["Period A: 50", "Period B: 30"],
      },
    });

    const summary = await getPortfolioSummary(orgId, NOW);
    expect(summary.needsAttention).toHaveLength(1);
    expect(summary.needsAttention[0].accountName).toBe("Loud");
    expect(summary.needsAttention[0].detail).toContain("high or critical risk");
    expect(summary.needsAttention.some((item) => item.accountId === quiet.id)).toBe(false);
    expect(summary.openRisks).toBe(1);
    expect(summary.criticalRisks).toBe(1);
  });

  it("reports score movement once, per account, from stored snapshots", async () => {
    await seedOrganization();
    const account = await testDb.customerAccount.create({ data: { organizationId: orgId, name: "Moved", arr: 1000 } });

    await testDb.healthScoreSnapshot.create({
      data: {
        organizationId: orgId,
        customerAccountId: account.id,
        overallScore: 60,
        category: "WATCH",
        previousScore: 75,
        previousCategory: "STABLE",
        changeReason: "Product adoption fell.",
        calculationVersion: "test",
        components: [],
        calculatedAt: new Date("2026-06-01"),
      },
    });
    await testDb.healthScoreSnapshot.create({
      data: {
        organizationId: orgId,
        customerAccountId: account.id,
        overallScore: 55,
        category: "WATCH",
        previousScore: 60,
        previousCategory: "WATCH",
        changeReason: "Support experience deteriorated.",
        calculationVersion: "test",
        components: [],
        calculatedAt: new Date("2026-06-20"),
      },
    });

    const summary = await getPortfolioSummary(orgId, NOW);
    expect(summary.recentChanges).toHaveLength(1);
    expect(summary.recentChanges[0].delta).toBe(-5);
    expect(summary.recentChanges[0].changeReason).toBe("Support experience deteriorated.");
  });

  describe("brief sections", () => {
    it("states what it cannot see rather than staying silent", async () => {
      await seedOrganization();
      await testDb.customerAccount.create({ data: { organizationId: orgId, name: "Alpha", arr: 100000 } });

      const sections = await buildBriefSections(orgId, NOW);
      const keys = sections.map((section) => section.key);

      expect(keys).toContain("executive_summary");
      expect(keys).toContain("what_changed");
      expect(keys).toContain("revenue_at_risk");
      expect(keys).toContain("upcoming_renewals");
      expect(keys).toContain("data_readiness");
      expect(keys).toContain("data_freshness");
      expect(keys).toContain("assessment_limits");
      expect(keys).toContain("method");

      const limits = sections.find((section) => section.key === "assessment_limits")!;
      expect(limits.content).toContain("cannot run with the data on file");

      const method = sections.find((section) => section.key === "method")!;
      expect(method.content).toContain("No model produced any sentence");
    });

    it("does not describe an absent renewal date as no upcoming renewals", async () => {
      await seedOrganization();
      await testDb.customerAccount.create({ data: { organizationId: orgId, name: "Alpha", arr: 100000 } });

      const sections = await buildBriefSections(orgId, NOW);
      const renewals = sections.find((section) => section.key === "upcoming_renewals")!;
      expect(renewals.content).toContain("No account has a renewal date on file");
    });

    it("says there is no prior period rather than reporting zero change", async () => {
      await seedOrganization();
      await testDb.customerAccount.create({ data: { organizationId: orgId, name: "Alpha", arr: 100000 } });

      const sections = await buildBriefSections(orgId, NOW);
      const changed = sections.find((section) => section.key === "what_changed")!;
      expect(changed.content).toContain("No health score movement has been recorded");
    });

    it("never mentions another organization's account", async () => {
      await seedOrganization();
      await testDb.customerAccount.create({ data: { organizationId: orgId, name: "Alpha", arr: 100000 } });
      await testDb.customerAccount.create({ data: { organizationId: otherOrgId, name: "SecretCorp", arr: 100000 } });

      const sections = await buildBriefSections(orgId, NOW);
      const combined = sections.map((section) => section.content).join(" ");
      expect(combined).not.toContain("SecretCorp");
    });
  });
});

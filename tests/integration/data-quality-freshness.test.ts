import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { testDb, resetTestDatabase, disconnectTestDatabase } from "../helpers/test-db";
import {
  detectDataQualityIssues,
  getDataQualitySummary,
  resolveDataQualityIssue,
  DATA_QUALITY_CATEGORIES,
} from "@/lib/services/data-quality-service";
import { getDataFreshness } from "@/lib/services/data-freshness-service";

const NOW = new Date("2026-07-01T00:00:00Z");

describe("data quality engine", () => {
  let orgId: string;
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

  async function seedOrg() {
    const owner = await testDb.user.create({ data: { name: "Owner", email: `o-${Math.random()}@dq.local`, passwordHash: "x" } });
    const org = await testDb.organization.create({
      data: { name: "DQ Co", slug: `dq-${Math.random()}`, memberships: { create: { userId: owner.id, role: "OWNER" } } },
    });
    orgId = org.id;
    ownerId = owner.id;
  }

  const detect = () =>
    detectDataQualityIssues({ organizationId: orgId, actingUserId: ownerId, actingRole: "OWNER", now: NOW });

  it("persists issues rather than only summarizing them", async () => {
    await seedOrg();
    await testDb.customerAccount.create({ data: { organizationId: orgId, name: "Incomplete Co", arr: 0 } });

    const result = await detect();
    expect(result.detected).toBeGreaterThan(0);

    const stored = await testDb.dataQualityIssue.findMany({ where: { organizationId: orgId } });
    expect(stored.length).toBeGreaterThan(0);
    expect(stored.every((i) => i.explanation.length > 0 && i.suggestedResolution.length > 0)).toBe(true);
  });

  it("detects a missing owner, missing revenue, and missing renewal date", async () => {
    await seedOrg();
    await testDb.customerAccount.create({ data: { organizationId: orgId, name: "Bare Co", arr: 0 } });
    await detect();

    const categories = (await testDb.dataQualityIssue.findMany({ where: { organizationId: orgId } })).map((i) => i.category);
    expect(categories).toContain(DATA_QUALITY_CATEGORIES.MISSING_ACCOUNT_OWNER);
    expect(categories).toContain(DATA_QUALITY_CATEGORIES.MISSING_RECURRING_REVENUE);
    expect(categories).toContain(DATA_QUALITY_CATEGORIES.MISSING_RENEWAL_DATE);
  });

  it("detects duplicate account names", async () => {
    await seedOrg();
    await testDb.customerAccount.create({ data: { organizationId: orgId, name: "Same Name", arr: 1000, renewalDate: NOW } });
    await testDb.customerAccount.create({ data: { organizationId: orgId, name: "same name", arr: 2000, renewalDate: NOW } });

    await detect();
    const duplicates = await testDb.dataQualityIssue.findMany({
      where: { organizationId: orgId, category: DATA_QUALITY_CATEGORIES.DUPLICATE_CUSTOMER_ACCOUNT },
    });
    expect(duplicates).toHaveLength(2); // one per affected account
  });

  it("does not flag missing product usage before any usage has been imported anywhere", async () => {
    await seedOrg();
    await testDb.customerAccount.create({ data: { organizationId: orgId, name: "No Usage Co", arr: 1000, renewalDate: NOW } });

    await detect();
    const issues = await testDb.dataQualityIssue.findMany({
      where: { organizationId: orgId, category: DATA_QUALITY_CATEGORIES.MISSING_PRODUCT_USAGE },
    });
    // Flagging every account for a feature the org hasn't adopted would be noise.
    expect(issues).toHaveLength(0);
  });

  it("flags an account missing usage once other accounts have it", async () => {
    await seedOrg();
    const withUsage = await testDb.customerAccount.create({ data: { organizationId: orgId, name: "Has Usage", arr: 1000, renewalDate: NOW } });
    await testDb.customerAccount.create({ data: { organizationId: orgId, name: "No Usage", arr: 1000, renewalDate: NOW } });
    await testDb.productUsageSummary.create({
      data: {
        organizationId: orgId,
        customerAccountId: withUsage.id,
        periodStart: new Date("2026-06-01"),
        periodEnd: new Date("2026-06-30"),
        activeUsers: 10,
      },
    });

    await detect();
    const issues = await testDb.dataQualityIssue.findMany({
      where: { organizationId: orgId, category: DATA_QUALITY_CATEGORIES.MISSING_PRODUCT_USAGE },
    });
    expect(issues).toHaveLength(1);
  });

  it("is re-runnable and auto-resolves issues that no longer apply", async () => {
    await seedOrg();
    const account = await testDb.customerAccount.create({ data: { organizationId: orgId, name: "Fixable Co", arr: 0 } });
    await detect();

    const before = await testDb.dataQualityIssue.count({
      where: { organizationId: orgId, category: DATA_QUALITY_CATEGORIES.MISSING_RECURRING_REVENUE, status: "OPEN" },
    });
    expect(before).toBe(1);

    await testDb.customerAccount.update({ where: { id: account.id }, data: { arr: 50000 } });
    const second = await detect();
    expect(second.resolved).toBeGreaterThan(0);

    const issue = await testDb.dataQualityIssue.findFirstOrThrow({
      where: { organizationId: orgId, category: DATA_QUALITY_CATEGORIES.MISSING_RECURRING_REVENUE },
    });
    expect(issue.status).toBe("RESOLVED");
  });

  it("does not duplicate an issue across repeated detections", async () => {
    await seedOrg();
    await testDb.customerAccount.create({ data: { organizationId: orgId, name: "Stable Co", arr: 0 } });
    await detect();
    await detect();

    const issues = await testDb.dataQualityIssue.findMany({
      where: { organizationId: orgId, category: DATA_QUALITY_CATEGORIES.MISSING_RECURRING_REVENUE },
    });
    expect(issues).toHaveLength(1);
  });

  it("keeps a dismissed issue dismissed across re-detection", async () => {
    await seedOrg();
    await testDb.customerAccount.create({ data: { organizationId: orgId, name: "Dismissed Co", arr: 0 } });
    await detect();

    const issue = await testDb.dataQualityIssue.findFirstOrThrow({
      where: { organizationId: orgId, category: DATA_QUALITY_CATEGORIES.MISSING_RECURRING_REVENUE },
    });
    await resolveDataQualityIssue({
      organizationId: orgId,
      issueId: issue.id,
      actingUserId: ownerId,
      actingRole: "OWNER",
      dismiss: true,
      dismissalReason: "This account is a free pilot.",
    });

    await detect();
    const after = await testDb.dataQualityIssue.findUniqueOrThrow({ where: { id: issue.id } });
    expect(after.status).toBe("DISMISSED");
  });

  it("requires a reason to dismiss", async () => {
    await seedOrg();
    await testDb.customerAccount.create({ data: { organizationId: orgId, name: "Needs Reason Co", arr: 0 } });
    await detect();
    const issue = await testDb.dataQualityIssue.findFirstOrThrow({ where: { organizationId: orgId } });

    await expect(
      resolveDataQualityIssue({ organizationId: orgId, issueId: issue.id, actingUserId: ownerId, actingRole: "OWNER", dismiss: true })
    ).rejects.toThrow(/requires a reason/);
  });

  it("a viewer cannot run detection", async () => {
    await seedOrg();
    await expect(
      detectDataQualityIssues({ organizationId: orgId, actingUserId: ownerId, actingRole: "VIEWER", now: NOW })
    ).rejects.toThrow(/not permitted/);
  });

  it("keeps detection organization-scoped", async () => {
    await seedOrg();
    await testDb.customerAccount.create({ data: { organizationId: orgId, name: "Ours", arr: 0 } });
    const otherOwner = await testDb.user.create({ data: { name: "Other", email: "other@dq.local", passwordHash: "x" } });
    const otherOrg = await testDb.organization.create({
      data: { name: "Other", slug: "other-dq", memberships: { create: { userId: otherOwner.id, role: "OWNER" } } },
    });
    await testDb.customerAccount.create({ data: { organizationId: otherOrg.id, name: "Theirs", arr: 0 } });

    await detect();
    expect(await testDb.dataQualityIssue.count({ where: { organizationId: otherOrg.id } })).toBe(0);
  });

  describe("summary state", () => {
    it("reports Needs Attention with no accounts", async () => {
      await seedOrg();
      const summary = await getDataQualitySummary(orgId);
      expect(summary.state).toBe("Needs Attention");
      expect(summary.explanation).toMatch(/No customer accounts/);
    });

    it("reports Ready when a complete account has no open issues", async () => {
      await seedOrg();
      const owner = await testDb.user.findFirstOrThrow({ where: { id: ownerId } });
      await testDb.customerAccount.create({
        data: { organizationId: orgId, name: "Complete Co", arr: 50000, renewalDate: new Date("2027-01-01"), ownerId: owner.id },
      });
      await detect();

      const summary = await getDataQualitySummary(orgId);
      expect(summary.state).toBe("Ready");
      expect(summary.openIssues).toBe(0);
    });

    it("always explains the state with reasons rather than a bare percentage", async () => {
      await seedOrg();
      await testDb.customerAccount.create({ data: { organizationId: orgId, name: "Messy Co", arr: 0 } });
      await detect();

      const summary = await getDataQualitySummary(orgId);
      expect(summary.explanation.length).toBeGreaterThan(0);
      expect(summary.reasons.length).toBeGreaterThan(0);
    });
  });
});

describe("data freshness", () => {
  let orgId: string;

  beforeAll(async () => {
    await resetTestDatabase();
  });
  afterEach(async () => {
    await resetTestDatabase();
  });
  afterAll(async () => {
    await disconnectTestDatabase();
  });

  async function seedOrg() {
    const owner = await testDb.user.create({ data: { name: "Owner", email: `o-${Math.random()}@fresh.local`, passwordHash: "x" } });
    const org = await testDb.organization.create({
      data: { name: "Fresh Co", slug: `fresh-${Math.random()}`, memberships: { create: { userId: owner.id, role: "OWNER" } } },
    });
    orgId = org.id;
  }

  it("reports MISSING, never CURRENT, for a category that was never imported", async () => {
    await seedOrg();
    const freshness = await getDataFreshness(orgId, NOW);

    const usage = freshness.find((f) => f.category === "product_usage");
    expect(usage?.state).toBe("MISSING");
    expect(usage?.explanation).toMatch(/not the same as having none/);
    expect(freshness.every((f) => f.state !== "CURRENT")).toBe(true);
  });

  it("reports CURRENT for recent data within the expectation", async () => {
    await seedOrg();
    const account = await testDb.customerAccount.create({ data: { organizationId: orgId, name: "A", arr: 1 } });
    await testDb.productUsageSummary.create({
      data: {
        organizationId: orgId,
        customerAccountId: account.id,
        periodStart: new Date("2026-06-01"),
        periodEnd: new Date("2026-06-25"), // 6 days before NOW, expectation is 30
        activeUsers: 5,
      },
    });

    const freshness = await getDataFreshness(orgId, NOW);
    expect(freshness.find((f) => f.category === "product_usage")?.state).toBe("CURRENT");
  });

  it("reports STALE well beyond the expectation", async () => {
    await seedOrg();
    const account = await testDb.customerAccount.create({ data: { organizationId: orgId, name: "A", arr: 1 } });
    await testDb.productUsageSummary.create({
      data: {
        organizationId: orgId,
        customerAccountId: account.id,
        periodStart: new Date("2026-01-01"),
        periodEnd: new Date("2026-01-31"), // ~150 days before NOW
        activeUsers: 5,
      },
    });

    const freshness = await getDataFreshness(orgId, NOW);
    expect(freshness.find((f) => f.category === "product_usage")?.state).toBe("STALE");
  });

  it("honors an organization's overridden expectation", async () => {
    await seedOrg();
    const account = await testDb.customerAccount.create({ data: { organizationId: orgId, name: "A", arr: 1 } });
    await testDb.productUsageSummary.create({
      data: {
        organizationId: orgId,
        customerAccountId: account.id,
        periodStart: new Date("2026-05-01"),
        periodEnd: new Date("2026-05-20"), // 42 days old — CURRENT at 30 days? no. AGING.
        activeUsers: 5,
      },
    });
    await testDb.dataFreshnessExpectation.create({
      data: { organizationId: orgId, category: "product_usage", expectedMaxAgeDays: 60 },
    });

    const freshness = await getDataFreshness(orgId, NOW);
    const usage = freshness.find((f) => f.category === "product_usage");
    expect(usage?.expectedMaxAgeDays).toBe(60);
    expect(usage?.state).toBe("CURRENT");
  });
});

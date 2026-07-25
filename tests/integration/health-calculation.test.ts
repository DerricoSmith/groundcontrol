import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { testDb, resetTestDatabase, disconnectTestDatabase } from "../helpers/test-db";
import {
  calculateAccountHealth,
  recalculateAndStoreHealth,
  categorize,
  DEFAULT_THRESHOLDS,
} from "@/lib/services/health-calculation-service";

const NOW = new Date("2026-07-01T00:00:00Z");

describe("health calculation", () => {
  let orgId: string;
  let accountId: string;

  beforeAll(async () => {
    await resetTestDatabase();
  });
  afterEach(async () => {
    await resetTestDatabase();
  });
  afterAll(async () => {
    await disconnectTestDatabase();
  });

  async function seedAccount(fields: Record<string, unknown> = {}) {
    const owner = await testDb.user.create({ data: { name: "Owner", email: `o-${Math.random()}@health.local`, passwordHash: "x" } });
    const org = await testDb.organization.create({
      data: { name: "Health Co", slug: `health-${Math.random()}`, memberships: { create: { userId: owner.id, role: "OWNER" } } },
    });
    const account = await testDb.customerAccount.create({
      data: { organizationId: org.id, name: "Test Account", arr: 50000, ...fields },
    });
    orgId = org.id;
    accountId = account.id;
  }

  it("is deterministic — identical inputs produce an identical score", async () => {
    await seedAccount({ renewalDate: new Date("2026-12-01") });
    const first = await calculateAccountHealth({ customerAccountId: accountId, now: NOW });
    const second = await calculateAccountHealth({ customerAccountId: accountId, now: NOW });
    expect(first.overallScore).toBe(second.overallScore);
    expect(first.category).toBe(second.category);
  });

  it("reports zero confidence and does NOT mark an empty account Critical", async () => {
    await seedAccount(); // nothing imported at all
    const result = await calculateAccountHealth({ customerAccountId: accountId, now: NOW });

    expect(result.dataConfidence).toBe(0);
    // The founder's rule: missing data lowers confidence, it must not push
    // the account to Critical.
    expect(result.category).not.toBe("CRITICAL");
    expect(result.limitations.length).toBeGreaterThan(0);
  });

  it("never claims an account is healthy purely because data is missing", async () => {
    await seedAccount();
    const result = await calculateAccountHealth({ customerAccountId: accountId, now: NOW });
    // With no evidence, it cannot reach the top band either.
    expect(result.category).not.toBe("STRONG");
    expect(result.dataConfidence).toBe(0);
  });

  it("every component carries its own evidence and confidence", async () => {
    await seedAccount({ renewalDate: new Date("2026-12-01") });
    const result = await calculateAccountHealth({ customerAccountId: accountId, now: NOW });

    expect(result.components).toHaveLength(5);
    for (const component of result.components) {
      expect(typeof component.confidence).toBe("number");
      expect(component.explanation.length).toBeGreaterThan(0);
      expect(Array.isArray(component.evidence)).toBe(true);
    }
  });

  it("business outcomes reports zero confidence rather than inventing evidence", async () => {
    await seedAccount({ renewalDate: new Date("2026-12-01") });
    const result = await calculateAccountHealth({ customerAccountId: accountId, now: NOW });

    const outcomes = result.components.find((c) => c.type === "BUSINESS_OUTCOMES")!;
    expect(outcomes.confidence).toBe(0);
    expect(outcomes.evidence).toHaveLength(0);
    expect(outcomes.explanation).toMatch(/cannot be assessed/);
    // Zero-confidence components are excluded from the weighted average.
    expect(outcomes.weight).toBe(0);
  });

  it("declining usage lowers the product adoption component and raises its confidence", async () => {
    await seedAccount({ renewalDate: new Date("2026-12-01") });
    for (const [start, end, users] of [["2026-05-01", "2026-05-31", 50], ["2026-06-01", "2026-06-30", 25]] as const) {
      await testDb.productUsageSummary.create({
        data: {
          organizationId: orgId,
          customerAccountId: accountId,
          periodStart: new Date(start),
          periodEnd: new Date(end),
          activeUsers: users,
          adoptionPercentage: users,
          lastActiveAt: new Date(end),
        },
      });
    }

    const result = await calculateAccountHealth({ customerAccountId: accountId, now: NOW });
    const adoption = result.components.find((c) => c.type === "PRODUCT_ADOPTION")!;

    expect(adoption.confidence).toBeGreaterThan(0);
    expect(adoption.score).toBeLessThan(50);
    expect(result.dataConfidence).toBeGreaterThan(0);
  });

  it("an open urgent ticket lowers the support component", async () => {
    await seedAccount({ renewalDate: new Date("2026-12-01") });
    await testDb.supportTicket.create({
      data: {
        organizationId: orgId,
        customerAccountId: accountId,
        externalTicketId: "T-1",
        createdDate: new Date("2026-06-20"),
        status: "OPEN",
        priority: "URGENT",
      },
    });

    const result = await calculateAccountHealth({ customerAccountId: accountId, now: NOW });
    const support = result.components.find((c) => c.type === "SUPPORT_EXPERIENCE")!;
    expect(support.score).toBeLessThan(70);
    expect(support.confidence).toBeGreaterThan(0);
  });

  it("an open critical escalation lowers support further than a plain ticket", async () => {
    await seedAccount({ renewalDate: new Date("2026-12-01") });
    await testDb.escalation.create({
      data: {
        organizationId: orgId,
        customerAccountId: accountId,
        title: "Outage",
        category: "PRODUCT",
        severity: "CRITICAL",
        status: "INVESTIGATING",
        description: "Sustained outage.",
      },
    });

    const result = await calculateAccountHealth({ customerAccountId: accountId, now: NOW });
    const support = result.components.find((c) => c.type === "SUPPORT_EXPERIENCE")!;
    expect(support.explanation).toMatch(/escalation/i);
    expect(support.score).toBeLessThan(60);
  });

  it("redistributes weight so accounts with partial data are not dragged to a fabricated middle", async () => {
    await seedAccount({ renewalDate: new Date("2026-12-01") });
    await testDb.productUsageSummary.create({
      data: {
        organizationId: orgId,
        customerAccountId: accountId,
        periodStart: new Date("2026-06-01"),
        periodEnd: new Date("2026-06-30"),
        adoptionPercentage: 95,
        lastActiveAt: new Date("2026-06-29"),
      },
    });

    const result = await calculateAccountHealth({ customerAccountId: accountId, now: NOW });
    const contributing = result.components.filter((c) => c.weight > 0);
    const totalWeight = contributing.reduce((s, c) => s + c.weight, 0);

    // Contributing weights are renormalized to sum to 1.
    expect(totalWeight).toBeCloseTo(1, 5);
    expect(result.components.filter((c) => c.confidence === 0).every((c) => c.weight === 0)).toBe(true);
  });

  it("rejects an invalid weight set instead of silently scoring with it", async () => {
    await seedAccount();
    await expect(
      calculateAccountHealth({
        customerAccountId: accountId,
        weights: {
          PRODUCT_ADOPTION: 0.5,
          CUSTOMER_RELATIONSHIP: 0.5,
          SUPPORT_EXPERIENCE: 0.5,
          COMMERCIAL_POSITION: 0.5,
          BUSINESS_OUTCOMES: 0.5,
        },
        now: NOW,
      })
    ).rejects.toThrow(/invalid weights/);
  });

  it("stores a snapshot with the previous value and a change reason", async () => {
    await seedAccount({ renewalDate: new Date("2026-12-01") });

    await recalculateAndStoreHealth({ organizationId: orgId, customerAccountId: accountId, now: NOW });
    const first = await testDb.healthScoreSnapshot.findFirstOrThrow({ where: { customerAccountId: accountId } });
    expect(first.previousScore).toBeNull();
    expect(first.changeReason).toMatch(/First health calculation/);

    // Change the inputs so the second calculation genuinely differs.
    await testDb.supportTicket.create({
      data: {
        organizationId: orgId,
        customerAccountId: accountId,
        externalTicketId: "T-9",
        createdDate: new Date("2026-06-20"),
        status: "OPEN",
        priority: "URGENT",
      },
    });
    await recalculateAndStoreHealth({ organizationId: orgId, customerAccountId: accountId, now: NOW });

    const snapshots = await testDb.healthScoreSnapshot.findMany({
      where: { customerAccountId: accountId },
      orderBy: { calculatedAt: "asc" },
    });
    expect(snapshots).toHaveLength(2);
    expect(snapshots[1].previousScore).toBe(snapshots[0].overallScore);
    expect(snapshots[1].changeReason).toBeTruthy();
  });

  it("keeps the denormalized account fields aligned with the stored snapshot", async () => {
    await seedAccount({ renewalDate: new Date("2026-12-01") });
    const calculation = await recalculateAndStoreHealth({ organizationId: orgId, customerAccountId: accountId, now: NOW });

    const account = await testDb.customerAccount.findUniqueOrThrow({ where: { id: accountId } });
    expect(account.healthCategory).toBe(calculation.category);
    expect(account.dataConfidence).toBe(calculation.dataConfidence);
  });

  describe("categorize", () => {
    it("maps scores to the documented bands", () => {
      expect(categorize(85)).toBe("STRONG");
      expect(categorize(70)).toBe("STABLE");
      expect(categorize(55)).toBe("WATCH");
      expect(categorize(40)).toBe("AT_RISK");
      expect(categorize(20)).toBe("CRITICAL");
    });

    it("uses the exact threshold boundaries", () => {
      expect(categorize(DEFAULT_THRESHOLDS.STRONG)).toBe("STRONG");
      expect(categorize(DEFAULT_THRESHOLDS.STABLE)).toBe("STABLE");
      expect(categorize(DEFAULT_THRESHOLDS.WATCH)).toBe("WATCH");
      expect(categorize(DEFAULT_THRESHOLDS.AT_RISK)).toBe("AT_RISK");
      expect(categorize(DEFAULT_THRESHOLDS.AT_RISK - 0.01)).toBe("CRITICAL");
    });
  });
});

import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { testDb, resetTestDatabase, disconnectTestDatabase } from "../helpers/test-db";
import { getUsageMetrics, getSupportMetrics, getRelationshipMetrics } from "@/lib/services/account-metrics-service";

const NOW = new Date("2026-07-01T00:00:00Z");

describe("account metrics", () => {
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

  async function seedAccount() {
    const owner = await testDb.user.create({ data: { name: "Owner", email: `o-${Math.random()}@metrics.local`, passwordHash: "x" } });
    const org = await testDb.organization.create({
      data: { name: "Metrics Co", slug: `metrics-${Math.random()}`, memberships: { create: { userId: owner.id, role: "OWNER" } } },
    });
    const account = await testDb.customerAccount.create({ data: { organizationId: org.id, name: "Test Account", arr: 50000 } });
    orgId = org.id;
    accountId = account.id;
  }

  async function addUsage(periodStart: string, periodEnd: string, fields: Record<string, unknown> = {}) {
    return testDb.productUsageSummary.create({
      data: {
        organizationId: orgId,
        customerAccountId: accountId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        ...fields,
      },
    });
  }

  describe("usage trend — every state is reachable and explained", () => {
    it("INSUFFICIENT_DATA when no usage exists", async () => {
      await seedAccount();
      const metrics = await getUsageMetrics(accountId, NOW);
      expect(metrics.trend).toBe("INSUFFICIENT_DATA");
      expect(metrics.explanation).toMatch(/No product usage/);
    });

    it("INSUFFICIENT_DATA when only one period exists", async () => {
      await seedAccount();
      await addUsage("2026-06-01", "2026-06-30", { activeUsers: 40, lastActiveAt: new Date("2026-06-29") });
      const metrics = await getUsageMetrics(accountId, NOW);
      expect(metrics.trend).toBe("INSUFFICIENT_DATA");
      expect(metrics.periodsAvailable).toBe(1);
    });

    it("DECLINING when active users fall more than the material threshold", async () => {
      await seedAccount();
      await addUsage("2026-05-01", "2026-05-31", { activeUsers: 50, lastActiveAt: new Date("2026-05-30") });
      await addUsage("2026-06-01", "2026-06-30", { activeUsers: 30, lastActiveAt: new Date("2026-06-29") });

      const metrics = await getUsageMetrics(accountId, NOW);
      expect(metrics.trend).toBe("DECLINING");
      expect(metrics.changePercent).toBeCloseTo(-40, 0);
      expect(metrics.evidence.join(" ")).toMatch(/50 to 30/);
    });

    it("INCREASING when active users rise materially", async () => {
      await seedAccount();
      await addUsage("2026-05-01", "2026-05-31", { activeUsers: 30, lastActiveAt: new Date("2026-05-30") });
      await addUsage("2026-06-01", "2026-06-30", { activeUsers: 45, lastActiveAt: new Date("2026-06-29") });

      const metrics = await getUsageMetrics(accountId, NOW);
      expect(metrics.trend).toBe("INCREASING");
    });

    it("STABLE when movement is below the material threshold", async () => {
      await seedAccount();
      await addUsage("2026-05-01", "2026-05-31", { activeUsers: 50, lastActiveAt: new Date("2026-05-30") });
      await addUsage("2026-06-01", "2026-06-30", { activeUsers: 52, lastActiveAt: new Date("2026-06-29") });

      const metrics = await getUsageMetrics(accountId, NOW);
      expect(metrics.trend).toBe("STABLE");
    });

    it("INACTIVE when the last recorded activity is older than the inactivity threshold", async () => {
      await seedAccount();
      await addUsage("2026-03-01", "2026-03-31", { activeUsers: 50, lastActiveAt: new Date("2026-03-15") });
      await addUsage("2026-04-01", "2026-04-30", { activeUsers: 48, lastActiveAt: new Date("2026-04-01") });

      const metrics = await getUsageMetrics(accountId, NOW);
      expect(metrics.trend).toBe("INACTIVE");
      expect(metrics.explanation).toMatch(/No recorded product activity/);
    });

    it("falls back to adoption percentage when active users are absent", async () => {
      await seedAccount();
      await addUsage("2026-05-01", "2026-05-31", { adoptionPercentage: 80, lastActiveAt: new Date("2026-05-30") });
      await addUsage("2026-06-01", "2026-06-30", { adoptionPercentage: 50, lastActiveAt: new Date("2026-06-29") });

      const metrics = await getUsageMetrics(accountId, NOW);
      expect(metrics.trend).toBe("DECLINING");
      expect(metrics.evidence.join(" ")).toMatch(/adoption percentage/);
    });
  });

  describe("support trend", () => {
    async function addTicket(id: string, fields: Record<string, unknown>) {
      return testDb.supportTicket.create({
        data: {
          organizationId: orgId,
          customerAccountId: accountId,
          externalTicketId: id,
          createdDate: new Date("2026-06-20"),
          ...fields,
        },
      });
    }

    it("INSUFFICIENT_DATA when no tickets exist", async () => {
      await seedAccount();
      const metrics = await getSupportMetrics(accountId, NOW);
      expect(metrics.trend).toBe("INSUFFICIENT_DATA");
    });

    it("CRITICAL whenever an urgent ticket is still open, regardless of volume", async () => {
      await seedAccount();
      await addTicket("T-1", { status: "OPEN", priority: "URGENT" });

      const metrics = await getSupportMetrics(accountId, NOW);
      expect(metrics.trend).toBe("CRITICAL");
      expect(metrics.openUrgentTickets).toBe(1);
    });

    it("DETERIORATING when recent ticket volume rises sharply", async () => {
      await seedAccount();
      await addTicket("T-old", { createdDate: new Date("2026-05-20"), status: "CLOSED", priority: "LOW" });
      for (let i = 0; i < 4; i++) {
        await addTicket(`T-new-${i}`, { createdDate: new Date("2026-06-25"), status: "CLOSED", priority: "NORMAL" });
      }

      const metrics = await getSupportMetrics(accountId, NOW);
      expect(metrics.trend).toBe("DETERIORATING");
    });

    it("IMPROVING when recent ticket volume falls sharply", async () => {
      await seedAccount();
      for (let i = 0; i < 4; i++) {
        await addTicket(`T-old-${i}`, { createdDate: new Date("2026-05-20"), status: "CLOSED", priority: "LOW" });
      }
      await addTicket("T-new", { createdDate: new Date("2026-06-25"), status: "CLOSED", priority: "LOW" });

      const metrics = await getSupportMetrics(accountId, NOW);
      expect(metrics.trend).toBe("IMPROVING");
    });

    it("counts open high priority tickets and reopened tickets", async () => {
      await seedAccount();
      await addTicket("T-high", { status: "OPEN", priority: "HIGH" });
      await addTicket("T-reopened", { status: "CLOSED", priority: "LOW", reopenCount: 2 });

      const metrics = await getSupportMetrics(accountId, NOW);
      expect(metrics.openHighPriorityTickets).toBe(1);
      expect(metrics.reopenedTickets).toBe(1);
    });

    it("averages resolution time and satisfaction only over tickets that have them", async () => {
      await seedAccount();
      await addTicket("T-a", { status: "CLOSED", priority: "LOW", resolutionMinutes: 100, satisfactionScore: 4 });
      await addTicket("T-b", { status: "CLOSED", priority: "LOW", resolutionMinutes: 300 });

      const metrics = await getSupportMetrics(accountId, NOW);
      expect(metrics.averageResolutionMinutes).toBe(200);
      expect(metrics.averageSatisfaction).toBe(4);
    });
  });

  describe("relationship metrics", () => {
    it("reports zero confidence and no engagement when nothing is imported", async () => {
      await seedAccount();
      const metrics = await getRelationshipMetrics(accountId, NOW);

      expect(metrics.confidence).toBe(0);
      expect(metrics.executiveEngagement).toBe("NONE_RECORDED");
      expect(metrics.hasExecutiveSponsor).toBe(false);
      expect(metrics.daysSinceMeaningfulInteraction).toBeUndefined();
    });

    it("excludes internal reviews from meaningful interaction", async () => {
      await seedAccount();
      await testDb.customerInteraction.create({
        data: {
          organizationId: orgId,
          customerAccountId: accountId,
          interactionDate: new Date("2026-06-30"),
          type: "INTERNAL_REVIEW",
        },
      });

      const metrics = await getRelationshipMetrics(accountId, NOW);
      // An internal review must not reset the "we haven't spoken" clock.
      expect(metrics.daysSinceMeaningfulInteraction).toBeUndefined();
    });

    it("counts a customer meeting as meaningful and measures recency", async () => {
      await seedAccount();
      await testDb.customerInteraction.create({
        data: {
          organizationId: orgId,
          customerAccountId: accountId,
          interactionDate: new Date("2026-06-21"),
          type: "CUSTOMER_MEETING",
        },
      });

      const metrics = await getRelationshipMetrics(accountId, NOW);
      expect(metrics.daysSinceMeaningfulInteraction).toBe(10);
      expect(metrics.meaningfulInteractionsLast90Days).toBe(1);
    });

    it("detects executive sponsor and champion roles, and departed champions", async () => {
      await seedAccount();
      await testDb.customerContact.create({
        data: { organizationId: orgId, customerAccountId: accountId, name: "Exec", roles: ["EXECUTIVE_SPONSOR"] },
      });
      await testDb.customerContact.create({
        data: {
          organizationId: orgId,
          customerAccountId: accountId,
          name: "Former Champ",
          roles: ["CHAMPION"],
          departedAt: new Date("2026-06-01"),
          isActive: false,
        },
      });

      const metrics = await getRelationshipMetrics(accountId, NOW);
      expect(metrics.hasExecutiveSponsor).toBe(true);
      expect(metrics.hasChampion).toBe(false); // the only champion departed
      expect(metrics.departedChampionNames).toEqual(["Former Champ"]);
    });

    it("marks executive engagement DISENGAGED past the threshold", async () => {
      await seedAccount();
      await testDb.customerInteraction.create({
        data: {
          organizationId: orgId,
          customerAccountId: accountId,
          interactionDate: new Date("2025-11-01"), // ~240 days before NOW
          type: "EXECUTIVE_MEETING",
        },
      });

      const metrics = await getRelationshipMetrics(accountId, NOW);
      expect(metrics.executiveEngagement).toBe("DISENGAGED");
    });
  });
});

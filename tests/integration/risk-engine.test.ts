import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { testDb, resetTestDatabase, disconnectTestDatabase } from "../helpers/test-db";
import { evaluateOrganizationRisks, listRuleAvailability, formatRiskExplanation } from "@/lib/services/risk-engine";

const NOW = new Date("2026-07-01T00:00:00Z");

describe("risk engine", () => {
  let orgId: string;
  let ownerId: string;
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

  async function seed(accountFields: Record<string, unknown> = {}) {
    const owner = await testDb.user.create({ data: { name: "Owner", email: `o-${Math.random()}@risk.local`, passwordHash: "x" } });
    const org = await testDb.organization.create({
      data: { name: "Risk Co", slug: `risk-${Math.random()}`, memberships: { create: { userId: owner.id, role: "OWNER" } } },
    });
    const account = await testDb.customerAccount.create({
      data: { organizationId: org.id, name: "Test Account", arr: 120000, renewalDate: new Date("2027-01-01"), ...accountFields },
    });
    orgId = org.id;
    ownerId = owner.id;
    accountId = account.id;
  }

  const run = () =>
    evaluateOrganizationRisks({ organizationId: orgId, actingUserId: ownerId, actingRole: "OWNER", now: NOW });

  it("records an evaluation run with real counts", async () => {
    await seed({ renewalDate: null });
    const result = await run();

    expect(result.accountsEvaluated).toBe(1);
    expect(result.risksCreated).toBeGreaterThan(0);

    const stored = await testDb.riskEvaluationRun.findUniqueOrThrow({ where: { id: result.runId } });
    expect(stored.completedAt).not.toBeNull();
    expect(stored.accountsEvaluated).toBe(1);
    expect(stored.ruleVersion).toBeTruthy();
  });

  it("creates no risks from absent data — an empty account only triggers data-independent rules", async () => {
    await seed(); // has a renewal date, no usage/support/interaction data
    const result = await run();

    const signals = await testDb.riskSignal.findMany({ where: { organizationId: orgId } });
    // Nothing should fire: the account has a renewal date and there is no
    // usage, support, interaction, escalation, or contact data to judge.
    expect(signals).toHaveLength(0);
    expect(result.risksCreated).toBe(0);
  });

  it("fires product_usage_decline with evidence when usage falls", async () => {
    await seed();
    for (const [start, end, users] of [["2026-05-01", "2026-05-31", 50], ["2026-06-01", "2026-06-30", 30]] as const) {
      await testDb.productUsageSummary.create({
        data: {
          organizationId: orgId,
          customerAccountId: accountId,
          periodStart: new Date(start),
          periodEnd: new Date(end),
          activeUsers: users,
          lastActiveAt: new Date(end),
        },
      });
    }

    await run();
    const signal = await testDb.riskSignal.findFirstOrThrow({
      where: { organizationId: orgId, ruleKey: "product_usage_decline" },
    });

    expect(signal.currentState).toMatch(/declined 40 percent/);
    expect(signal.revenueExposure).toBe(120000);
    expect((signal.evidence as string[]).join(" ")).toMatch(/50 to 30/);
    // Severity is escalated by the account's revenue.
    expect(["HIGH", "CRITICAL"]).toContain(signal.severity);
  });

  it("fires open_priority_support_issue for an open urgent ticket", async () => {
    await seed();
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

    await run();
    const signal = await testDb.riskSignal.findFirstOrThrow({
      where: { organizationId: orgId, ruleKey: "open_priority_support_issue" },
    });
    expect(signal.currentState).toMatch(/urgent/);
    expect(signal.severity).toBe("CRITICAL"); // HIGH base escalated by $120k revenue
  });

  it("fires champion_departure and names the departed champion", async () => {
    await seed();
    await testDb.customerContact.create({
      data: {
        organizationId: orgId,
        customerAccountId: accountId,
        name: "Alex Chen",
        roles: ["CHAMPION"],
        departedAt: new Date("2026-06-01"),
        isActive: false,
      },
    });

    await run();
    const signal = await testDb.riskSignal.findFirstOrThrow({
      where: { organizationId: orgId, ruleKey: "champion_departure" },
    });
    expect(signal.currentState).toMatch(/Alex Chen/);
  });

  it("fires unresolved_escalation and marks it critical for a critical escalation", async () => {
    await seed();
    await testDb.escalation.create({
      data: {
        organizationId: orgId,
        customerAccountId: accountId,
        title: "Data loss incident",
        category: "PRODUCT",
        severity: "CRITICAL",
        status: "INVESTIGATING",
        description: "Customer reported data loss.",
      },
    });

    await run();
    const signal = await testDb.riskSignal.findFirstOrThrow({
      where: { organizationId: orgId, ruleKey: "unresolved_escalation" },
    });
    expect(signal.severity).toBe("CRITICAL");
    expect(signal.executiveInvolvementRecommended).toBe(true);
  });

  it("fires renewal_approaching_without_plan inside the 90 day window", async () => {
    await seed({ renewalDate: new Date("2026-08-15") }); // 45 days from NOW
    await testDb.renewal.create({
      data: {
        organizationId: orgId,
        customerAccountId: accountId,
        periodStart: new Date("2025-08-15"),
        periodEnd: new Date("2026-08-15"),
        arr: 120000,
      },
    });

    await run();
    const signal = await testDb.riskSignal.findFirstOrThrow({
      where: { organizationId: orgId, ruleKey: "renewal_approaching_without_plan" },
    });
    expect(signal.currentState).toMatch(/45 days away/);
    expect(signal.currentState).toMatch(/no renewal plan exists/);
  });

  it("is repeatable — a second run updates rather than duplicates", async () => {
    await seed({ renewalDate: null });

    const first = await run();
    expect(first.risksCreated).toBe(1);

    const second = await run();
    expect(second.risksCreated).toBe(0);
    expect(second.risksUpdated).toBe(1);

    const signals = await testDb.riskSignal.findMany({ where: { organizationId: orgId } });
    expect(signals).toHaveLength(1);
  });

  it("resolves a signal when its condition stops applying", async () => {
    await seed({ renewalDate: null });
    await run();

    await testDb.customerAccount.update({ where: { id: accountId }, data: { renewalDate: new Date("2027-06-01") } });
    const second = await run();

    expect(second.risksResolved).toBe(1);
    const signal = await testDb.riskSignal.findFirstOrThrow({ where: { organizationId: orgId, ruleKey: "missing_renewal_date" } });
    expect(signal.status).toBe("RESOLVED");
    expect(signal.resolutionNote).toMatch(/no longer applies/);
  });

  it("never reopens a risk a human dismissed", async () => {
    await seed({ renewalDate: null });
    await run();

    const signal = await testDb.riskSignal.findFirstOrThrow({ where: { organizationId: orgId } });
    await testDb.riskSignal.update({
      where: { id: signal.id },
      data: { status: "DISMISSED", dismissalReason: "Renewal handled outside Ground Control." },
    });

    await run();
    const after = await testDb.riskSignal.findUniqueOrThrow({ where: { id: signal.id } });
    expect(after.status).toBe("DISMISSED");
  });

  it("tracks direction when severity worsens between runs", async () => {
    await seed();
    await testDb.supportTicket.create({
      data: {
        organizationId: orgId,
        customerAccountId: accountId,
        externalTicketId: "T-high",
        createdDate: new Date("2026-06-20"),
        status: "OPEN",
        priority: "HIGH",
      },
    });
    await run();

    // Escalate to urgent, which raises the rule's base severity.
    await testDb.supportTicket.updateMany({ where: { organizationId: orgId }, data: { priority: "URGENT" } });
    await run();

    const signal = await testDb.riskSignal.findFirstOrThrow({
      where: { organizationId: orgId, ruleKey: "open_priority_support_issue" },
    });
    expect(signal.direction).toBe("WORSENING");
    expect(signal.previousSeverity).toBeTruthy();
  });

  it("keeps evaluation organization-scoped", async () => {
    await seed({ renewalDate: null });
    const otherOwner = await testDb.user.create({ data: { name: "Other", email: "other@risk.local", passwordHash: "x" } });
    const otherOrg = await testDb.organization.create({
      data: { name: "Other", slug: "other-risk-eval", memberships: { create: { userId: otherOwner.id, role: "OWNER" } } },
    });
    await testDb.customerAccount.create({ data: { organizationId: otherOrg.id, name: "Their Account", arr: 9999 } });

    await run();

    expect(await testDb.riskSignal.count({ where: { organizationId: otherOrg.id } })).toBe(0);
  });

  it("a viewer cannot run an evaluation", async () => {
    await seed();
    await expect(
      evaluateOrganizationRisks({ organizationId: orgId, actingUserId: ownerId, actingRole: "VIEWER", now: NOW })
    ).rejects.toThrow(/not permitted/);
  });

  it("reports which rules were unavailable", async () => {
    await seed();
    const result = await run();
    expect(result.unavailableRules).toContain("payment_risk");
    expect(result.unavailableRules).toContain("product_usage_decline");
  });

  it("rule availability turns on once the required data is imported", async () => {
    await seed();
    const before = await listRuleAvailability(orgId);
    expect(before.find((r) => r.key === "product_usage_decline")?.available).toBe(false);

    await testDb.productUsageSummary.create({
      data: {
        organizationId: orgId,
        customerAccountId: accountId,
        periodStart: new Date("2026-06-01"),
        periodEnd: new Date("2026-06-30"),
        activeUsers: 10,
      },
    });

    const after = await listRuleAvailability(orgId);
    expect(after.find((r) => r.key === "product_usage_decline")?.available).toBe(true);
  });

  it("does not raise executive disengagement for an account with no relationship data at all", async () => {
    await seed();

    // Another account supplies the org-wide contact and interaction data that
    // makes the rule available, so the rule genuinely runs for both accounts.
    const other = await testDb.customerAccount.create({
      data: { organizationId: orgId, name: "Has Data", arr: 50000, renewalDate: new Date("2027-01-01") },
    });
    await testDb.customerContact.create({
      data: { organizationId: orgId, customerAccountId: other.id, name: "Sam Executive", roles: ["EXECUTIVE_SPONSOR"] },
    });
    await testDb.customerInteraction.create({
      data: {
        organizationId: orgId,
        customerAccountId: other.id,
        interactionDate: new Date("2026-06-20"),
        type: "EXECUTIVE_MEETING",
        executiveParticipated: true,
      },
    });

    await run();

    const availability = await listRuleAvailability(orgId);
    expect(availability.find((r) => r.key === "executive_sponsor_disengagement")?.available).toBe(true);

    // The bare account has zero contacts and zero interactions: absence, not
    // disengagement. It must not carry this risk.
    const signals = await testDb.riskSignal.findMany({
      where: { customerAccountId: accountId, ruleKey: "executive_sponsor_disengagement" },
    });
    expect(signals).toHaveLength(0);
  });

  it("formats the six-part explanation from stored fields only", async () => {
    await seed({ renewalDate: null });
    await run();
    const signal = await testDb.riskSignal.findFirstOrThrow({ where: { organizationId: orgId } });

    const parts = formatRiskExplanation(signal);
    expect(parts.map((p) => p.label)).toEqual([
      "Current state",
      "What changed",
      "Supporting evidence",
      "Potential impact",
      "Recommended action",
      "Confidence",
    ]);
    expect(parts.every((p) => p.value.length > 0)).toBe(true);
  });
});

import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { testDb, resetTestDatabase, disconnectTestDatabase } from "../helpers/test-db";
import { activateRiskRule, listRiskRuleStatus, RiskRuleError } from "@/lib/services/risk-rule-service";
import { RISK_RULES } from "@/lib/services/risk-engine";

describe("risk-rule-service (onboarding wrapper over the risk engine)", () => {
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
    const owner = await testDb.user.create({ data: { name: "Owner", email: "owner@risk-test.local", passwordHash: "x" } });
    const org = await testDb.organization.create({
      data: { name: "Risk Test Co", slug: "risk-test-co", memberships: { create: { userId: owner.id, role: "OWNER" } } },
    });
    orgId = org.id;
    ownerId = owner.id;
  }

  it("reports every catalog rule, with only data-independent rules available on an empty organization", async () => {
    await seedOrg();
    const statuses = await listRiskRuleStatus(orgId);

    expect(statuses).toHaveLength(RISK_RULES.length);
    const available = statuses.filter((s) => s.available).map((s) => s.key);
    // missing_renewal_date needs nothing beyond the account itself.
    expect(available).toEqual(["missing_renewal_date"]);
  });

  it("every unavailable rule explains what data is missing", async () => {
    await seedOrg();
    const statuses = await listRiskRuleStatus(orgId);

    for (const status of statuses.filter((s) => !s.available)) {
      expect(status.unavailableReason.length).toBeGreaterThan(0);
      expect(status.requiredData.length).toBeGreaterThan(0);
    }
  });

  it("payment risk stays unavailable and says why, rather than inventing payment data", async () => {
    await seedOrg();
    const statuses = await listRiskRuleStatus(orgId);
    const payment = statuses.find((s) => s.key === "payment_risk");

    expect(payment?.available).toBe(false);
    expect(payment?.unavailableReason).toMatch(/billing/i);
  });

  it("activating an unavailable rule is rejected with the reason", async () => {
    await seedOrg();
    await expect(
      activateRiskRule({ organizationId: orgId, ruleKey: "product_usage_decline", actingUserId: ownerId, actingRole: "OWNER" })
    ).rejects.toThrow(/cannot be activated yet/);
  });

  it("activating an unknown rule key throws", async () => {
    await seedOrg();
    await expect(
      activateRiskRule({ organizationId: orgId, ruleKey: "not_a_real_rule", actingUserId: ownerId, actingRole: "OWNER" })
    ).rejects.toThrow(RiskRuleError);
  });

  it("a viewer cannot activate a risk rule", async () => {
    await seedOrg();
    await expect(
      activateRiskRule({ organizationId: orgId, ruleKey: "missing_renewal_date", actingUserId: ownerId, actingRole: "VIEWER" })
    ).rejects.toThrow(/not permitted/);
  });

  it("activating missing_renewal_date creates a real signal for each account without a renewal date", async () => {
    await seedOrg();
    await testDb.customerAccount.create({ data: { organizationId: orgId, name: "No Date Co", arr: 1000 } });
    await testDb.customerAccount.create({
      data: { organizationId: orgId, name: "Has Date Co", arr: 2000, renewalDate: new Date("2027-12-01") },
    });

    const result = await activateRiskRule({
      organizationId: orgId,
      ruleKey: "missing_renewal_date",
      actingUserId: ownerId,
      actingRole: "OWNER",
    });
    expect(result.signalsCreated).toBe(1);

    const signals = await testDb.riskSignal.findMany({ where: { organizationId: orgId, ruleKey: "missing_renewal_date" } });
    expect(signals).toHaveLength(1);

    const account = await testDb.customerAccount.findFirstOrThrow({ where: { organizationId: orgId, name: "No Date Co" } });
    expect(signals[0].customerAccountId).toBe(account.id);
  });

  it("is repeatable — activating twice does not duplicate signals", async () => {
    await seedOrg();
    await testDb.customerAccount.create({ data: { organizationId: orgId, name: "No Date Co", arr: 1000 } });

    await activateRiskRule({ organizationId: orgId, ruleKey: "missing_renewal_date", actingUserId: ownerId, actingRole: "OWNER" });
    const second = await activateRiskRule({ organizationId: orgId, ruleKey: "missing_renewal_date", actingUserId: ownerId, actingRole: "OWNER" });

    expect(second.signalsCreated).toBe(0);
    const signals = await testDb.riskSignal.findMany({ where: { organizationId: orgId, ruleKey: "missing_renewal_date" } });
    expect(signals).toHaveLength(1);
  });

  it("records the activated rule on the organization's setup profile and configuration", async () => {
    await seedOrg();
    await activateRiskRule({ organizationId: orgId, ruleKey: "missing_renewal_date", actingUserId: ownerId, actingRole: "OWNER" });

    const statuses = await listRiskRuleStatus(orgId);
    expect(statuses.find((s) => s.key === "missing_renewal_date")?.activated).toBe(true);

    const config = await testDb.riskRuleConfiguration.findFirst({ where: { organizationId: orgId, ruleKey: "missing_renewal_date" } });
    expect(config?.enabled).toBe(true);
  });

  it("a second organization's accounts are never touched by another org's evaluation", async () => {
    await seedOrg();
    const otherOwner = await testDb.user.create({ data: { name: "Other", email: "other@risk-test.local", passwordHash: "x" } });
    const otherOrg = await testDb.organization.create({
      data: { name: "Other Risk Org", slug: "other-risk-org", memberships: { create: { userId: otherOwner.id, role: "OWNER" } } },
    });
    await testDb.customerAccount.create({ data: { organizationId: otherOrg.id, name: "Other Org Account", arr: 500 } });
    await testDb.customerAccount.create({ data: { organizationId: orgId, name: "Our Account", arr: 500 } });

    await activateRiskRule({ organizationId: orgId, ruleKey: "missing_renewal_date", actingUserId: ownerId, actingRole: "OWNER" });

    const otherOrgSignals = await testDb.riskSignal.findMany({ where: { organizationId: otherOrg.id } });
    expect(otherOrgSignals).toHaveLength(0);
  });
});

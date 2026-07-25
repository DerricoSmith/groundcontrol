import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { testDb, resetTestDatabase, disconnectTestDatabase } from "../helpers/test-db";
import { generateSuggestedActions, changeActionStatus, assignAction, addActionComment, ActionError } from "@/lib/services/action-service";
import {
  createEscalation,
  updateEscalationStatus,
  assignEscalation,
  setCustomerCommunicationState,
  getEscalationSummary,
  EscalationError,
} from "@/lib/services/escalation-service";

describe("actions and escalations", () => {
  let orgId: string;
  let otherOrgId: string;
  let ownerId: string;
  let outsiderId: string;
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

  async function seed() {
    const owner = await testDb.user.create({ data: { name: "Owner", email: `o-${Math.random()}@act.local`, passwordHash: "x" } });
    const outsider = await testDb.user.create({ data: { name: "Outsider", email: `x-${Math.random()}@act.local`, passwordHash: "x" } });
    const org = await testDb.organization.create({
      data: { name: "Act Co", slug: `act-${Math.random()}`, memberships: { create: { userId: owner.id, role: "OWNER" } } },
    });
    const other = await testDb.organization.create({
      data: { name: "Other Co", slug: `other-${Math.random()}`, memberships: { create: { userId: outsider.id, role: "OWNER" } } },
    });
    const account = await testDb.customerAccount.create({
      data: { organizationId: org.id, name: "Northwind", arr: 90000 },
    });
    orgId = org.id;
    otherOrgId = other.id;
    ownerId = owner.id;
    outsiderId = outsider.id;
    accountId = account.id;
  }

  async function seedRisk(ruleKey: string) {
    return testDb.riskSignal.create({
      data: {
        organizationId: orgId,
        customerAccountId: accountId,
        ruleKey,
        title: "Usage falling",
        category: "adoption_decline",
        severity: "HIGH",
        status: "OPEN",
        whatChanged: "Weekly active users fell from 50 to 33 between the last two periods.",
        currentState: "Weekly active users fell 34 percent over two periods.",
        potentialImpact: "Adoption at this level puts the renewal conversation on weaker ground.",
        recommendedResponse: "Run an adoption review with the account team.",
        evidence: ["Period A: 50 weekly active users", "Period B: 33 weekly active users"],
      },
    });
  }

  describe("suggested actions", () => {
    it("creates one action per open risk and does not duplicate on a second run", async () => {
      await seed();
      await seedRisk("product_usage_decline");

      const first = await generateSuggestedActions({ organizationId: orgId, actingUserId: ownerId, actingRole: "OWNER" });
      expect(first.created).toBe(1);

      const second = await generateSuggestedActions({ organizationId: orgId, actingUserId: ownerId, actingRole: "OWNER" });
      expect(second.created).toBe(0);

      const actions = await testDb.recommendedAction.findMany({ where: { organizationId: orgId } });
      expect(actions).toHaveLength(1);
      expect(actions[0].status).toBe("SUGGESTED");
      expect(actions[0].actionType).toBe("adoption_plan");
      // The action must carry the risk's evidence, not a restatement of it.
      expect(actions[0].evidence).toEqual([
        "Period A: 50 weekly active users",
        "Period B: 33 weekly active users",
      ]);
    });

    it("creates nothing when there are no open risks", async () => {
      await seed();
      const result = await generateSuggestedActions({ organizationId: orgId, actingUserId: ownerId, actingRole: "OWNER" });
      expect(result.created).toBe(0);
    });

    it("ignores risks a person already dismissed", async () => {
      await seed();
      const risk = await seedRisk("product_usage_decline");
      await testDb.riskSignal.update({ where: { id: risk.id }, data: { status: "DISMISSED" } });

      const result = await generateSuggestedActions({ organizationId: orgId, actingUserId: ownerId, actingRole: "OWNER" });
      expect(result.created).toBe(0);
    });

    it("refuses a role that cannot manage actions", async () => {
      await seed();
      await seedRisk("product_usage_decline");
      await expect(
        generateSuggestedActions({ organizationId: orgId, actingUserId: ownerId, actingRole: "VIEWER" })
      ).rejects.toThrow();
    });
  });

  describe("action status and assignment", () => {
    async function seedAction() {
      await seed();
      await seedRisk("product_usage_decline");
      await generateSuggestedActions({ organizationId: orgId, actingUserId: ownerId, actingRole: "OWNER" });
      return testDb.recommendedAction.findFirstOrThrow({ where: { organizationId: orgId } });
    }

    it("requires a reason to block an action", async () => {
      const action = await seedAction();
      await expect(
        changeActionStatus({ organizationId: orgId, actionId: action.id, toStatus: "BLOCKED", actingUserId: ownerId, actingRole: "OWNER" })
      ).rejects.toBeInstanceOf(ActionError);

      const blocked = await changeActionStatus({
        organizationId: orgId,
        actionId: action.id,
        toStatus: "BLOCKED",
        note: "Waiting on the customer to schedule.",
        actingUserId: ownerId,
        actingRole: "OWNER",
      });
      expect(blocked.blockedReason).toBe("Waiting on the customer to schedule.");
    });

    it("records every status change with who made it", async () => {
      const action = await seedAction();
      await changeActionStatus({
        organizationId: orgId,
        actionId: action.id,
        toStatus: "COMPLETED",
        note: "Adoption review held.",
        actingUserId: ownerId,
        actingRole: "OWNER",
      });

      const changes = await testDb.actionStatusChange.findMany({ where: { actionId: action.id } });
      expect(changes).toHaveLength(1);
      expect(changes[0].fromStatus).toBe("SUGGESTED");
      expect(changes[0].toStatus).toBe("COMPLETED");
      expect(changes[0].changedById).toBe(ownerId);

      const audit = await testDb.auditEvent.findMany({ where: { organizationId: orgId, eventType: "action_completed" } });
      expect(audit).toHaveLength(1);
    });

    it("refuses to assign a user from another organization", async () => {
      const action = await seedAction();
      await expect(
        assignAction({ organizationId: orgId, actionId: action.id, ownerId: outsiderId, actingUserId: ownerId, actingRole: "OWNER" })
      ).rejects.toBeInstanceOf(ActionError);
    });

    it("turns a suggested action into open work when it is assigned", async () => {
      const action = await seedAction();
      const assigned = await assignAction({
        organizationId: orgId,
        actionId: action.id,
        ownerId,
        actingUserId: ownerId,
        actingRole: "OWNER",
      });
      expect(assigned.ownerId).toBe(ownerId);
      expect(assigned.status).toBe("OPEN");
    });

    it("cannot reach an action belonging to another organization", async () => {
      const action = await seedAction();
      await expect(
        changeActionStatus({ organizationId: otherOrgId, actionId: action.id, toStatus: "COMPLETED", actingUserId: outsiderId, actingRole: "OWNER" })
      ).rejects.toBeInstanceOf(ActionError);
    });

    it("rejects an empty comment", async () => {
      const action = await seedAction();
      await expect(
        addActionComment({ organizationId: orgId, actionId: action.id, body: "   ", actingUserId: ownerId, actingRole: "OWNER" })
      ).rejects.toBeInstanceOf(ActionError);
    });
  });

  describe("escalations", () => {
    const base = () => ({
      organizationId: orgId,
      customerAccountId: accountId,
      title: "Data export broken since the June release",
      category: "PRODUCT" as const,
      severity: "HIGH" as const,
      description: "Scheduled exports have failed for three weeks and the customer's board reporting depends on them.",
      actingUserId: ownerId,
      actingRole: "OWNER" as const,
    });

    it("records the account's ARR as exposure and starts with no customer communication", async () => {
      await seed();
      const escalation = await createEscalation(base());
      expect(escalation.revenueExposure).toBe(90000);
      expect(escalation.customerCommunicationState).toBe("none");
      expect(escalation.status).toBe("NEW");

      const audit = await testDb.auditEvent.findMany({ where: { organizationId: orgId, eventType: "escalation_opened" } });
      expect(audit).toHaveLength(1);
    });

    it("requires a description", async () => {
      await seed();
      await expect(createEscalation({ ...base(), description: "  " })).rejects.toBeInstanceOf(EscalationError);
    });

    it("refuses an account from another organization", async () => {
      await seed();
      const foreign = await testDb.customerAccount.create({ data: { organizationId: otherOrgId, name: "Foreign", arr: 10 } });
      await expect(createEscalation({ ...base(), customerAccountId: foreign.id })).rejects.toBeInstanceOf(EscalationError);
    });

    it("requires a resolution summary before closing", async () => {
      await seed();
      const escalation = await createEscalation(base());
      await expect(
        updateEscalationStatus({ organizationId: orgId, escalationId: escalation.id, status: "RESOLVED", actingUserId: ownerId, actingRole: "OWNER" })
      ).rejects.toBeInstanceOf(EscalationError);

      const resolved = await updateEscalationStatus({
        organizationId: orgId,
        escalationId: escalation.id,
        status: "RESOLVED",
        resolutionSummary: "Export pipeline fixed and backfilled.",
        actingUserId: ownerId,
        actingRole: "OWNER",
      });
      expect(resolved.resolvedAt).not.toBeNull();
      expect(resolved.resolutionSummary).toBe("Export pipeline fixed and backfilled.");
    });

    it("refuses an owner who is not a member", async () => {
      await seed();
      const escalation = await createEscalation(base());
      await expect(
        assignEscalation({ organizationId: orgId, escalationId: escalation.id, ownerId: outsiderId, actingUserId: ownerId, actingRole: "OWNER" })
      ).rejects.toBeInstanceOf(EscalationError);
    });

    it("rejects an unrecognized customer communication state", async () => {
      await seed();
      const escalation = await createEscalation(base());
      await expect(
        setCustomerCommunicationState({ organizationId: orgId, escalationId: escalation.id, state: "sent_email", actingUserId: ownerId, actingRole: "OWNER" })
      ).rejects.toBeInstanceOf(EscalationError);
    });

    it("summarizes only open escalations and scopes to the organization", async () => {
      await seed();
      const open = await createEscalation({ ...base(), severity: "CRITICAL" });
      const closed = await createEscalation({ ...base(), title: "Older issue" });
      await updateEscalationStatus({
        organizationId: orgId,
        escalationId: closed.id,
        status: "CLOSED",
        resolutionSummary: "Handled.",
        actingUserId: ownerId,
        actingRole: "OWNER",
      });

      const summary = await getEscalationSummary(orgId);
      expect(summary.openCount).toBe(1);
      expect(summary.criticalCount).toBe(1);
      expect(summary.unownedCount).toBe(1);
      expect(summary.revenueExposure).toBe(90000);
      expect(open.id).toBeTruthy();

      const otherSummary = await getEscalationSummary(otherOrgId);
      expect(otherSummary.openCount).toBe(0);
      expect(otherSummary.revenueExposure).toBe(0);
    });
  });
});

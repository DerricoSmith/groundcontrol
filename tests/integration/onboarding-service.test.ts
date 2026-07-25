import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { testDb, resetTestDatabase, disconnectTestDatabase } from "../helpers/test-db";
import {
  OnboardingError,
  calculateSetupReadiness,
  completeOnboarding,
  completeStep,
  determineFirstValueMoment,
  getSetupChecklist,
  reopenOnboarding,
  resetDemoOnboarding,
  resolveChecklistItem,
  returnToStep,
  selectOnboardingPath,
  setOnboardingGoals,
  skipStep,
  startOrResumeOnboarding,
  upsertChecklistItem,
} from "@/lib/services/onboarding-service";

describe("onboarding-service", () => {
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

  it("survives concurrent onboarding entry without violating the unique organization constraint", async () => {
    await seedOrg();

    // Onboarding entry is where concurrent requests genuinely arrive: the
    // redirect after signup, a router prefetch, and a double-clicked link can
    // all hit it at once. A check-then-create here crashed under Postgres with
    // a unique constraint violation; the upsert makes the loser a no-op.
    const results = await Promise.all(
      Array.from({ length: 5 }, () => startOrResumeOnboarding({ organizationId: orgId, actingUserId: ownerId }))
    );

    const ids = new Set(results.map((session) => session.id));
    expect(ids.size).toBe(1);

    const stored = await testDb.onboardingSession.findMany({ where: { organizationId: orgId } });
    expect(stored).toHaveLength(1);
  });

  async function seedOrg(isDemo = false) {
    const owner = await testDb.user.create({ data: { name: "Owner", email: `owner-${Math.random()}@onboarding-test.local`, passwordHash: "x" } });
    const org = await testDb.organization.create({
      data: { name: "Onboarding Test Co", slug: `onboarding-test-co-${Math.random()}`, isDemo, memberships: { create: { userId: owner.id, role: "OWNER" } } },
    });
    orgId = org.id;
    ownerId = owner.id;
    return { owner, org };
  }

  it("creates a new onboarding session on first start", async () => {
    await seedOrg();
    const session = await startOrResumeOnboarding({ organizationId: orgId, actingUserId: ownerId });
    expect(session.status).toBe("IN_PROGRESS");
    expect(session.currentStep).toBe("welcome");
    expect(session.startedAt).not.toBeNull();
  });

  it("resuming returns the same session rather than creating a second one", async () => {
    await seedOrg();
    const first = await startOrResumeOnboarding({ organizationId: orgId, actingUserId: ownerId });
    const second = await startOrResumeOnboarding({ organizationId: orgId, actingUserId: ownerId });
    expect(second.id).toBe(first.id);

    const events = await testDb.onboardingEvent.findMany({ where: { organizationId: orgId } });
    expect(events.map((e) => e.eventType)).toEqual(expect.arrayContaining(["onboarding_started", "onboarding_resumed"]));
  });

  it("onboarding sessions are organization-scoped — a second org gets its own independent session", async () => {
    await seedOrg();
    const sessionA = await startOrResumeOnboarding({ organizationId: orgId, actingUserId: ownerId });
    await completeStep({ organizationId: orgId, stepKey: "welcome", actingUserId: ownerId, actingRole: "OWNER" });

    const { owner: ownerB, org: orgB } = await (async () => {
      const owner = await testDb.user.create({ data: { name: "Owner B", email: "ownerb@onboarding-test.local", passwordHash: "x" } });
      const org = await testDb.organization.create({ data: { name: "Org B", slug: "org-b-onboarding", memberships: { create: { userId: owner.id, role: "OWNER" } } } });
      return { owner, org };
    })();

    const sessionB = await startOrResumeOnboarding({ organizationId: orgB.id, actingUserId: ownerB.id });
    expect(sessionB.id).not.toBe(sessionA.id);
    expect((sessionB.completedSteps as string[]).length).toBe(0); // orgA's completed step never leaks into orgB
  });

  it("persists completed steps across reads", async () => {
    await seedOrg();
    await startOrResumeOnboarding({ organizationId: orgId, actingUserId: ownerId });
    await completeStep({ organizationId: orgId, stepKey: "welcome", actingUserId: ownerId, actingRole: "OWNER" });

    const reloaded = await testDb.onboardingSession.findUnique({ where: { organizationId: orgId } });
    expect(reloaded?.completedSteps).toEqual(["welcome"]);
    expect(reloaded?.currentStep).toBe("organization_profile");
  });

  it("a required step cannot be skipped", async () => {
    await seedOrg();
    await startOrResumeOnboarding({ organizationId: orgId, actingUserId: ownerId });
    await expect(
      skipStep({ organizationId: orgId, stepKey: "welcome", actingUserId: ownerId, actingRole: "OWNER" })
    ).rejects.toThrow(/required and cannot be skipped/);
  });

  it("an optional step can be skipped", async () => {
    await seedOrg();
    await startOrResumeOnboarding({ organizationId: orgId, actingUserId: ownerId });
    const session = await skipStep({ organizationId: orgId, stepKey: "renewal_data", actingUserId: ownerId, actingRole: "OWNER" });
    expect(session.skippedSteps).toEqual(["renewal_data"]);
  });

  it("a role not permitted for a step cannot complete it", async () => {
    await seedOrg();
    await startOrResumeOnboarding({ organizationId: orgId, actingUserId: ownerId });
    await expect(
      completeStep({ organizationId: orgId, stepKey: "organization_profile", actingUserId: ownerId, actingRole: "VIEWER" })
    ).rejects.toThrow(/cannot complete/);
  });

  it("a Signal & State consultant can complete owner-gated steps (assisted setup)", async () => {
    await seedOrg();
    await startOrResumeOnboarding({ organizationId: orgId, actingUserId: ownerId });
    const session = await completeStep({
      organizationId: orgId,
      stepKey: "organization_profile",
      actingUserId: ownerId,
      actingRole: "SIGNAL_STATE_CONSULTANT",
    });
    expect(session.completedSteps).toContain("organization_profile");
  });

  it("cannot return to a step further ahead than progress allows", async () => {
    await seedOrg();
    await startOrResumeOnboarding({ organizationId: orgId, actingUserId: ownerId });
    await expect(returnToStep({ organizationId: orgId, stepKey: "review_and_activate" })).rejects.toThrow(/skip ahead/);
  });

  it("can return to an already-completed step", async () => {
    await seedOrg();
    await startOrResumeOnboarding({ organizationId: orgId, actingUserId: ownerId });
    await completeStep({ organizationId: orgId, stepKey: "welcome", actingUserId: ownerId, actingRole: "OWNER" });
    const session = await returnToStep({ organizationId: orgId, stepKey: "welcome" });
    expect(session.currentStep).toBe("welcome");
  });

  it("selecting a path is restricted to owners/administrators/consultants", async () => {
    await seedOrg();
    await startOrResumeOnboarding({ organizationId: orgId, actingUserId: ownerId });
    await expect(
      selectOnboardingPath({ organizationId: orgId, path: "QUICK_START", actingUserId: ownerId, actingRole: "VIEWER" })
    ).rejects.toThrow(/not permitted/);

    const session = await selectOnboardingPath({ organizationId: orgId, path: "QUICK_START", actingUserId: ownerId, actingRole: "OWNER" });
    expect(session.path).toBe("QUICK_START");
  });

  it("rejects an unknown goal", async () => {
    await seedOrg();
    await startOrResumeOnboarding({ organizationId: orgId, actingUserId: ownerId });
    await expect(
      // @ts-expect-error intentionally invalid for the test
      setOnboardingGoals({ organizationId: orgId, goals: ["not_a_real_goal"], actingUserId: ownerId })
    ).rejects.toThrow(/Unknown goal/);
  });

  it("cannot complete onboarding while required steps remain", async () => {
    await seedOrg();
    await startOrResumeOnboarding({ organizationId: orgId, actingUserId: ownerId });
    await expect(
      completeOnboarding({ organizationId: orgId, actingUserId: ownerId, actingRole: "OWNER" })
    ).rejects.toThrow(/required steps still missing/);
  });

  it("completes onboarding once all required steps are done, and it is audited", async () => {
    await seedOrg();
    await startOrResumeOnboarding({ organizationId: orgId, actingUserId: ownerId });
    for (const key of ["welcome", "organization_profile", "choose_data_path", "import_customer_accounts", "data_readiness", "health_model", "review_and_activate"]) {
      await completeStep({ organizationId: orgId, stepKey: key, actingUserId: ownerId, actingRole: "OWNER" });
    }

    const session = await completeOnboarding({ organizationId: orgId, actingUserId: ownerId, actingRole: "OWNER" });
    expect(session.status).toBe("COMPLETED");
    expect(session.completedAt).not.toBeNull();

    const auditEvents = await testDb.auditEvent.findMany({ where: { organizationId: orgId, targetType: "OnboardingSession" } });
    expect(auditEvents).toHaveLength(1);
  });

  it("a viewer cannot complete onboarding even if all steps are done", async () => {
    await seedOrg();
    await startOrResumeOnboarding({ organizationId: orgId, actingUserId: ownerId });
    for (const key of ["welcome", "organization_profile", "choose_data_path", "import_customer_accounts", "data_readiness", "health_model", "review_and_activate"]) {
      await completeStep({ organizationId: orgId, stepKey: key, actingUserId: ownerId, actingRole: "OWNER" });
    }
    await expect(
      completeOnboarding({ organizationId: orgId, actingUserId: ownerId, actingRole: "VIEWER" })
    ).rejects.toThrow(/not permitted/);
  });

  it("reopening requires onboarding to already be completed", async () => {
    await seedOrg();
    await startOrResumeOnboarding({ organizationId: orgId, actingUserId: ownerId });
    await expect(
      reopenOnboarding({ organizationId: orgId, actingUserId: ownerId, actingRole: "OWNER" })
    ).rejects.toThrow(/not completed yet/);
  });

  it("reopens a completed onboarding session", async () => {
    await seedOrg();
    await startOrResumeOnboarding({ organizationId: orgId, actingUserId: ownerId });
    for (const key of ["welcome", "organization_profile", "choose_data_path", "import_customer_accounts", "data_readiness", "health_model", "review_and_activate"]) {
      await completeStep({ organizationId: orgId, stepKey: key, actingUserId: ownerId, actingRole: "OWNER" });
    }
    await completeOnboarding({ organizationId: orgId, actingUserId: ownerId, actingRole: "OWNER" });

    const reopened = await reopenOnboarding({ organizationId: orgId, actingUserId: ownerId, actingRole: "OWNER" });
    expect(reopened.status).toBe("REOPENED");
    expect(reopened.reopenedAt).not.toBeNull();
  });

  it("cannot reset onboarding for a non-demo organization", async () => {
    await seedOrg(false);
    await startOrResumeOnboarding({ organizationId: orgId, actingUserId: ownerId });
    await expect(resetDemoOnboarding(orgId)).rejects.toThrow(/Only demo organizations/);
  });

  it("resets onboarding for a demo organization", async () => {
    await seedOrg(true);
    await startOrResumeOnboarding({ organizationId: orgId, actingUserId: ownerId });
    await completeStep({ organizationId: orgId, stepKey: "welcome", actingUserId: ownerId, actingRole: "OWNER" });

    await resetDemoOnboarding(orgId);

    const session = await testDb.onboardingSession.findUnique({ where: { organizationId: orgId } });
    expect(session).toBeNull();
  });

  it("checklist items can be created and resolved, and drive setup readiness", async () => {
    await seedOrg();
    await upsertChecklistItem({ organizationId: orgId, key: "import_customer_accounts", label: "Import accounts", description: "d", required: true });
    await upsertChecklistItem({ organizationId: orgId, key: "activate_health_model", label: "Activate health model", description: "d", required: true });

    let readiness = await calculateSetupReadiness(orgId);
    expect(readiness.label).toBe("Limited");

    await resolveChecklistItem({ organizationId: orgId, key: "import_customer_accounts", actingUserId: ownerId });
    readiness = await calculateSetupReadiness(orgId);
    expect(readiness.label).toBe("Usable");
    expect(readiness.completedRequired).toBe(1);

    await resolveChecklistItem({ organizationId: orgId, key: "activate_health_model", actingUserId: ownerId });
    readiness = await calculateSetupReadiness(orgId);
    expect(readiness.label).toBe("Ready");

    const items = await getSetupChecklist(orgId);
    expect(items.every((i) => i.status === "COMPLETED")).toBe(true);
  });

  it("resolving an unknown checklist item throws", async () => {
    await seedOrg();
    await expect(
      resolveChecklistItem({ organizationId: orgId, key: "does_not_exist", actingUserId: ownerId })
    ).rejects.toThrow(OnboardingError);
  });

  it("determines the first value moment based on whether any customer account exists", async () => {
    await seedOrg();
    let moment = await determineFirstValueMoment(orgId);
    expect(moment.reached).toBe(false);

    await testDb.customerAccount.create({ data: { organizationId: orgId, name: "First Account", arr: 1000 } });
    moment = await determineFirstValueMoment(orgId);
    expect(moment.reached).toBe(true);
  });

  it("onboarding events never store sensitive metadata keys", async () => {
    await seedOrg();
    await startOrResumeOnboarding({ organizationId: orgId, actingUserId: ownerId });
    await setOnboardingGoals({ organizationId: orgId, goals: ["increase_product_adoption"], actingUserId: ownerId });

    // trackOnboardingEvent is exercised indirectly above; verify no stored event ever contains a sensitive key.
    const events = await testDb.onboardingEvent.findMany({ where: { organizationId: orgId } });
    for (const event of events) {
      const metadata = event.metadata as Record<string, unknown> | null;
      if (!metadata) continue;
      expect(metadata).not.toHaveProperty("email");
      expect(metadata).not.toHaveProperty("name");
      expect(metadata).not.toHaveProperty("revenue");
    }
  });
});

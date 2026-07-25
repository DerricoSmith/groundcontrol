import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { testDb, resetTestDatabase, disconnectTestDatabase } from "../helpers/test-db";
import { createOrganizationForNewUser } from "@/lib/services/organization-service";

describe("organization-service", () => {
  beforeAll(async () => {
    await resetTestDatabase();
  });

  afterEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  async function makeUser(email: string) {
    return testDb.user.create({
      data: { name: "Test User", email, passwordHash: "not-a-real-hash" },
    });
  }

  it("creates an organization with the founding user as OWNER", async () => {
    const user = await makeUser("owner@test.groundcontrol.local");

    const org = await createOrganizationForNewUser({ userId: user.id, organizationName: "Acme Software" });

    const membership = await testDb.membership.findUnique({
      where: { userId_organizationId: { userId: user.id, organizationId: org.id } },
    });
    expect(membership?.role).toBe("OWNER");
  });

  it("generates a unique, url-safe slug from the organization name", async () => {
    const user = await makeUser("slug1@test.groundcontrol.local");
    const org = await createOrganizationForNewUser({ userId: user.id, organizationName: "Acme Software Co." });
    expect(org.slug).toBe("acme-software-co");
  });

  it("appends a numeric suffix when the slug is already taken", async () => {
    const userA = await makeUser("slug2a@test.groundcontrol.local");
    const userB = await makeUser("slug2b@test.groundcontrol.local");

    const orgA = await createOrganizationForNewUser({ userId: userA.id, organizationName: "Northwind Analytics" });
    const orgB = await createOrganizationForNewUser({ userId: userB.id, organizationName: "Northwind Analytics" });

    expect(orgA.slug).toBe("northwind-analytics");
    expect(orgB.slug).toBe("northwind-analytics-2");
    expect(orgA.slug).not.toBe(orgB.slug);
  });

  it("records an organization_created audit event", async () => {
    const user = await makeUser("audit@test.groundcontrol.local");
    const org = await createOrganizationForNewUser({ userId: user.id, organizationName: "Audit Test Co" });

    const events = await testDb.auditEvent.findMany({ where: { organizationId: org.id } });
    expect(events).toHaveLength(1);
    expect(events[0].eventType).toBe("organization_created");
    expect(events[0].actorUserId).toBe(user.id);
  });

  it("defaults currency to USD when not specified", async () => {
    const user = await makeUser("currency@test.groundcontrol.local");
    const org = await createOrganizationForNewUser({ userId: user.id, organizationName: "Currency Test Co" });
    expect(org.currency).toBe("USD");
  });
});

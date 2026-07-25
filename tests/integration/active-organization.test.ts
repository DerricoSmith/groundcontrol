import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { testDb, resetTestDatabase, disconnectTestDatabase } from "../helpers/test-db";

const authMock = vi.fn();
vi.mock("@/auth", () => ({ auth: () => authMock() }));

const cookieGetMock = vi.fn();
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => cookieGetMock(name) }),
}));

const { getCurrentMembership, getAvailableOrganizations, ACTIVE_ORG_COOKIE } = await import("@/lib/auth/session");

describe("active organization resolution", () => {
  let userId: string;
  let orgAId: string;
  let orgBId: string;

  beforeAll(async () => {
    await resetTestDatabase();

    const user = await testDb.user.create({
      data: { name: "Multi Org User", email: "multiorg@test.groundcontrol.local", passwordHash: "x" },
    });
    userId = user.id;

    const orgA = await testDb.organization.create({
      data: { name: "First Org", slug: "first-org", memberships: { create: { userId, role: "OWNER" } } },
    });
    orgAId = orgA.id;

    // Created after orgA, so orgA is the "first membership" fallback.
    const orgB = await testDb.organization.create({
      data: { name: "Second Org", slug: "second-org", memberships: { create: { userId, role: "CS_MANAGER" } } },
    });
    orgBId = orgB.id;
  });

  afterEach(() => {
    authMock.mockReset();
    cookieGetMock.mockReset();
  });

  afterAll(async () => {
    await resetTestDatabase();
    await disconnectTestDatabase();
  });

  it("returns null when there is no session", async () => {
    authMock.mockResolvedValue(null);
    cookieGetMock.mockReturnValue(undefined);
    expect(await getCurrentMembership()).toBeNull();
  });

  it("falls back to the oldest membership when no active-org cookie is set", async () => {
    authMock.mockResolvedValue({ user: { id: userId } });
    cookieGetMock.mockReturnValue(undefined);

    const membership = await getCurrentMembership();
    expect(membership?.organizationId).toBe(orgAId);
    expect(membership?.role).toBe("OWNER");
  });

  it("honors a valid active-org cookie", async () => {
    authMock.mockResolvedValue({ user: { id: userId } });
    cookieGetMock.mockImplementation((name: string) => (name === ACTIVE_ORG_COOKIE ? { value: orgBId } : undefined));

    const membership = await getCurrentMembership();
    expect(membership?.organizationId).toBe(orgBId);
    expect(membership?.role).toBe("CS_MANAGER");
  });

  it("ignores a cookie pointing at an organization the user is not a member of and falls back safely", async () => {
    authMock.mockResolvedValue({ user: { id: userId } });
    cookieGetMock.mockImplementation((name: string) =>
      name === ACTIVE_ORG_COOKIE ? { value: "some-org-id-the-user-was-removed-from" } : undefined
    );

    const membership = await getCurrentMembership();
    expect(membership?.organizationId).toBe(orgAId); // safe fallback, never throws, never leaks the other org
  });

  it("getAvailableOrganizations lists every membership and marks exactly the active one", async () => {
    authMock.mockResolvedValue({ user: { id: userId } });
    cookieGetMock.mockImplementation((name: string) => (name === ACTIVE_ORG_COOKIE ? { value: orgBId } : undefined));

    const orgs = await getAvailableOrganizations();
    expect(orgs).toHaveLength(2);
    expect(orgs.find((o) => o.organizationId === orgBId)?.isActive).toBe(true);
    expect(orgs.find((o) => o.organizationId === orgAId)?.isActive).toBe(false);
  });
});

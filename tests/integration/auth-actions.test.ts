import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { testDb, resetTestDatabase, disconnectTestDatabase } from "../helpers/test-db";

// next-auth's signIn/signOut expect a real Next.js request context
// (cookies, headers) that doesn't exist under plain Vitest. They're mocked
// here so this test exercises auth-actions.ts's own validation and
// database logic — duplicate detection, field validation, password
// hashing, organization creation — without needing a running Next.js server.
// The real signIn/signOut wiring is covered by the manual browser
// verification recorded in LOCAL_BUILD_PROGRESS.md, not by this test.
const signInMock = vi.fn().mockResolvedValue(undefined);
const signOutMock = vi.fn().mockResolvedValue(undefined);
vi.mock("@/auth", () => ({
  signIn: (...args: unknown[]) => signInMock(...args),
  signOut: (...args: unknown[]) => signOutMock(...args),
}));

// auth-actions.ts imports `AuthError` from the "next-auth" package directly
// (not from "@/auth"). Loading the real package under plain Node/Vitest
// pulls in next-auth's edge-runtime internals, which expect a Next.js
// bundler environment. Stubbing it keeps this test focused on
// auth-actions.ts's own logic — see the note above about what this test
// does and does not cover.
class StubAuthError extends Error {}
vi.mock("next-auth", () => ({ AuthError: StubAuthError }));

const { signupAction, loginAction } = await import("@/lib/actions/auth-actions");

function formData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

describe("signupAction", () => {
  beforeAll(async () => {
    await resetTestDatabase();
  });
  afterEach(async () => {
    signInMock.mockClear();
    await resetTestDatabase();
  });
  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it("rejects a submission missing required fields", async () => {
    const result = await signupAction(
      {},
      formData({ name: "", organizationName: "Acme", email: "a@b.com", password: "password123" })
    );
    expect(result.error).toMatch(/required/i);
  });

  it("rejects an invalid email address", async () => {
    const result = await signupAction(
      {},
      formData({ name: "A", organizationName: "Acme", email: "not-an-email", password: "password123" })
    );
    expect(result.error).toMatch(/valid email/i);
  });

  it("rejects a password shorter than 8 characters", async () => {
    const result = await signupAction(
      {},
      formData({ name: "A", organizationName: "Acme", email: "a@b.com", password: "short" })
    );
    expect(result.error).toMatch(/8 characters/i);
  });

  it("rejects signup with an email that already has an account", async () => {
    await testDb.user.create({
      data: { name: "Existing", email: "dupe@test.groundcontrol.local", passwordHash: "x" },
    });

    const result = await signupAction(
      {},
      formData({
        name: "New Person",
        organizationName: "New Org",
        email: "dupe@test.groundcontrol.local",
        password: "password123",
      })
    );
    expect(result.error).toMatch(/already exists/i);
  });

  it("creates a user, hashes the password, and creates an organization on valid signup", async () => {
    const result = await signupAction(
      {},
      formData({
        name: "Priya Anand",
        organizationName: "Northwind Analytics",
        email: "priya@test.groundcontrol.local",
        password: "correct-horse-99",
      })
    );

    expect(result.error).toBeUndefined();
    expect(signInMock).toHaveBeenCalledWith("credentials", {
      email: "priya@test.groundcontrol.local",
      password: "correct-horse-99",
      redirectTo: "/mission-control",
    });

    const user = await testDb.user.findUnique({ where: { email: "priya@test.groundcontrol.local" } });
    expect(user).not.toBeNull();
    expect(user?.passwordHash).not.toBe("correct-horse-99"); // must be hashed, not stored in plaintext

    const membership = await testDb.membership.findFirst({ where: { userId: user!.id } });
    expect(membership?.role).toBe("OWNER");
  });
});

describe("loginAction", () => {
  afterEach(() => signInMock.mockClear());

  it("rejects a submission missing email or password", async () => {
    const result = await loginAction({}, formData({ email: "", password: "" }));
    expect(result.error).toMatch(/enter your email/i);
    expect(signInMock).not.toHaveBeenCalled();
  });

  it("calls signIn with normalized (lowercased, trimmed) email", async () => {
    await loginAction({}, formData({ email: "  Priya@Test.GroundControl.Local  ", password: "correct-horse-99" }));
    expect(signInMock).toHaveBeenCalledWith("credentials", {
      email: "priya@test.groundcontrol.local",
      password: "correct-horse-99",
      redirectTo: "/mission-control",
    });
  });
});

import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { testDb, resetTestDatabase, disconnectTestDatabase } from "../helpers/test-db";
import {
  acceptInvitation,
  createInvitation,
  InvitationError,
  listPendingInvitations,
  resendInvitation,
  revokeInvitation,
} from "@/lib/services/invitation-service";

describe("invitation-service", () => {
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

  async function seedOrgWithOwner() {
    const owner = await testDb.user.create({
      data: { name: "Owner", email: "owner@invite-test.local", passwordHash: "x" },
    });
    const org = await testDb.organization.create({
      data: { name: "Invite Test Co", slug: "invite-test-co", memberships: { create: { userId: owner.id, role: "OWNER" } } },
    });
    orgId = org.id;
    ownerId = owner.id;
    return { owner, org };
  }

  it("an owner can invite a user", async () => {
    await seedOrgWithOwner();

    const invitation = await createInvitation({
      organizationId: orgId,
      invitedByUserId: ownerId,
      invitedByRole: "OWNER",
      email: "New.Member@Example.com",
      role: "CS_MANAGER",
    });

    expect(invitation.status).toBe("PENDING");
    expect(invitation.email).toBe("new.member@example.com"); // normalized
    expect(invitation.token).toHaveLength(43); // 32 random bytes, base64url

    const pending = await listPendingInvitations(orgId);
    expect(pending.map((i) => i.id)).toContain(invitation.id);
  });

  it("a viewer cannot invite a user", async () => {
    await seedOrgWithOwner();
    await expect(
      createInvitation({
        organizationId: orgId,
        invitedByUserId: ownerId,
        invitedByRole: "VIEWER",
        email: "someone@example.com",
        role: "VIEWER",
      })
    ).rejects.toThrow(/not permitted/);
  });

  it("a Customer Success Manager cannot invite a user", async () => {
    await seedOrgWithOwner();
    await expect(
      createInvitation({
        organizationId: orgId,
        invitedByUserId: ownerId,
        invitedByRole: "CS_MANAGER",
        email: "someone@example.com",
        role: "VIEWER",
      })
    ).rejects.toThrow(/not permitted/);
  });

  it("accepting an invitation creates a membership with the invited role", async () => {
    await seedOrgWithOwner();
    const invitation = await createInvitation({
      organizationId: orgId,
      invitedByUserId: ownerId,
      invitedByRole: "OWNER",
      email: "accepted@example.com",
      role: "ANALYST",
    });

    const accepter = await testDb.user.create({
      data: { name: "Accepter", email: "accepted@example.com", passwordHash: "x" },
    });

    const membership = await acceptInvitation({
      token: invitation.token,
      acceptingUserId: accepter.id,
      acceptingUserEmail: accepter.email,
    });

    expect(membership.role).toBe("ANALYST");
    expect(membership.organizationId).toBe(orgId);

    const stored = await testDb.organizationInvitation.findUnique({ where: { id: invitation.id } });
    expect(stored?.status).toBe("ACCEPTED");
    expect(stored?.acceptedById).toBe(accepter.id);
  });

  it("an invitation cannot be accepted by an unintended email address", async () => {
    await seedOrgWithOwner();
    const invitation = await createInvitation({
      organizationId: orgId,
      invitedByUserId: ownerId,
      invitedByRole: "OWNER",
      email: "intended@example.com",
      role: "ANALYST",
    });

    const wrongUser = await testDb.user.create({
      data: { name: "Wrong Person", email: "wrong-person@example.com", passwordHash: "x" },
    });

    await expect(
      acceptInvitation({ token: invitation.token, acceptingUserId: wrongUser.id, acceptingUserEmail: wrongUser.email })
    ).rejects.toThrow(InvitationError);

    const stored = await testDb.organizationInvitation.findUnique({ where: { id: invitation.id } });
    expect(stored?.status).toBe("PENDING"); // unaffected by the failed attempt

    const membership = await testDb.membership.findFirst({ where: { userId: wrongUser.id } });
    expect(membership).toBeNull();
  });

  it("an invitation is single-use — accepting it twice fails the second time", async () => {
    await seedOrgWithOwner();
    const invitation = await createInvitation({
      organizationId: orgId,
      invitedByUserId: ownerId,
      invitedByRole: "OWNER",
      email: "single-use@example.com",
      role: "ANALYST",
    });
    const accepter = await testDb.user.create({
      data: { name: "Accepter", email: "single-use@example.com", passwordHash: "x" },
    });

    await acceptInvitation({ token: invitation.token, acceptingUserId: accepter.id, acceptingUserEmail: accepter.email });

    // Simulates a double-submit of the same accept action with the same token.
    await expect(
      acceptInvitation({ token: invitation.token, acceptingUserId: accepter.id, acceptingUserEmail: accepter.email })
    ).rejects.toThrow(/already/);
  });

  it("a revoked invitation cannot be accepted", async () => {
    await seedOrgWithOwner();
    const invitation = await createInvitation({
      organizationId: orgId,
      invitedByUserId: ownerId,
      invitedByRole: "OWNER",
      email: "revoked@example.com",
      role: "ANALYST",
    });

    await revokeInvitation({ organizationId: orgId, invitationId: invitation.id, actingUserId: ownerId, actingRole: "OWNER" });

    const accepter = await testDb.user.create({ data: { name: "A", email: "revoked@example.com", passwordHash: "x" } });
    await expect(
      acceptInvitation({ token: invitation.token, acceptingUserId: accepter.id, acceptingUserEmail: accepter.email })
    ).rejects.toThrow(/revoked/);
  });

  it("an expired invitation cannot be accepted", async () => {
    await seedOrgWithOwner();
    const invitation = await createInvitation({
      organizationId: orgId,
      invitedByUserId: ownerId,
      invitedByRole: "OWNER",
      email: "expired@example.com",
      role: "ANALYST",
    });
    await testDb.organizationInvitation.update({
      where: { id: invitation.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const accepter = await testDb.user.create({ data: { name: "A", email: "expired@example.com", passwordHash: "x" } });
    await expect(
      acceptInvitation({ token: invitation.token, acceptingUserId: accepter.id, acceptingUserEmail: accepter.email })
    ).rejects.toThrow(/expired/);

    const stored = await testDb.organizationInvitation.findUnique({ where: { id: invitation.id } });
    expect(stored?.status).toBe("EXPIRED");
  });

  it("resending an invitation issues a new token and invalidates the old one", async () => {
    await seedOrgWithOwner();
    const invitation = await createInvitation({
      organizationId: orgId,
      invitedByUserId: ownerId,
      invitedByRole: "OWNER",
      email: "resend@example.com",
      role: "ANALYST",
    });
    const oldToken = invitation.token;

    const resent = await resendInvitation({ organizationId: orgId, invitationId: invitation.id, actingUserId: ownerId, actingRole: "OWNER" });
    expect(resent.token).not.toBe(oldToken);

    const accepter = await testDb.user.create({ data: { name: "A", email: "resend@example.com", passwordHash: "x" } });
    await expect(
      acceptInvitation({ token: oldToken, acceptingUserId: accepter.id, acceptingUserEmail: accepter.email })
    ).rejects.toThrow(/invalid/);

    const membership = await acceptInvitation({ token: resent.token, acceptingUserId: accepter.id, acceptingUserEmail: accepter.email });
    expect(membership.organizationId).toBe(orgId);
  });

  it("creating a new invitation for the same email revokes the previous pending one", async () => {
    await seedOrgWithOwner();
    const first = await createInvitation({
      organizationId: orgId,
      invitedByUserId: ownerId,
      invitedByRole: "OWNER",
      email: "duplicate@example.com",
      role: "ANALYST",
    });
    const second = await createInvitation({
      organizationId: orgId,
      invitedByUserId: ownerId,
      invitedByRole: "OWNER",
      email: "duplicate@example.com",
      role: "CS_MANAGER",
    });

    const storedFirst = await testDb.organizationInvitation.findUnique({ where: { id: first.id } });
    expect(storedFirst?.status).toBe("REVOKED");

    const pending = await listPendingInvitations(orgId);
    expect(pending.map((i) => i.id)).toEqual([second.id]);
  });

  it("a user who already belongs to the organization cannot accept another invitation into it", async () => {
    const { owner } = await seedOrgWithOwner();
    const invitation = await createInvitation({
      organizationId: orgId,
      invitedByUserId: ownerId,
      invitedByRole: "OWNER",
      email: owner.email,
      role: "ANALYST",
    });

    await expect(
      acceptInvitation({ token: invitation.token, acceptingUserId: owner.id, acceptingUserEmail: owner.email })
    ).rejects.toThrow(/already a member/);
  });
});

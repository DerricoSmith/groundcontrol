import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { testDb, resetTestDatabase, disconnectTestDatabase } from "../helpers/test-db";
import { changeMemberRole, MembershipError, removeMember } from "@/lib/services/membership-service";

describe("membership-service", () => {
  beforeAll(async () => {
    await resetTestDatabase();
  });
  afterEach(async () => {
    await resetTestDatabase();
  });
  afterAll(async () => {
    await disconnectTestDatabase();
  });

  async function seedOrgWithOwnerAndMember(memberRole: "CS_MANAGER" | "VIEWER" | "ADMINISTRATOR" = "CS_MANAGER") {
    const owner = await testDb.user.create({ data: { name: "Owner", email: "owner@membership-test.local", passwordHash: "x" } });
    const org = await testDb.organization.create({
      data: { name: "Membership Test Co", slug: "membership-test-co", memberships: { create: { userId: owner.id, role: "OWNER" } } },
    });
    const member = await testDb.user.create({ data: { name: "Member", email: "member@membership-test.local", passwordHash: "x" } });
    const memberMembership = await testDb.membership.create({
      data: { userId: member.id, organizationId: org.id, role: memberRole },
    });
    return { owner, org, member, memberMembership };
  }

  describe("changeMemberRole", () => {
    it("an owner can change a member's role", async () => {
      const { owner, org, memberMembership } = await seedOrgWithOwnerAndMember("CS_MANAGER");

      const updated = await changeMemberRole({
        organizationId: org.id,
        membershipId: memberMembership.id,
        newRole: "ANALYST",
        actingUserId: owner.id,
        actingRole: "OWNER",
      });
      expect(updated.role).toBe("ANALYST");
    });

    it("records an audit event on role change", async () => {
      const { owner, org, memberMembership } = await seedOrgWithOwnerAndMember("CS_MANAGER");
      await changeMemberRole({ organizationId: org.id, membershipId: memberMembership.id, newRole: "VIEWER", actingUserId: owner.id, actingRole: "OWNER" });

      const events = await testDb.auditEvent.findMany({ where: { organizationId: org.id, eventType: "user_role_changed" } });
      expect(events).toHaveLength(1);
      expect(events[0].metadata).toMatchObject({ fromRole: "CS_MANAGER", toRole: "VIEWER" });
    });

    it("a viewer cannot change anyone's role", async () => {
      const { org, memberMembership } = await seedOrgWithOwnerAndMember("CS_MANAGER");
      await expect(
        changeMemberRole({ organizationId: org.id, membershipId: memberMembership.id, newRole: "VIEWER", actingUserId: "irrelevant", actingRole: "VIEWER" })
      ).rejects.toThrow(/not permitted/);
    });

    it("a user cannot grant the OWNER role — ownership cannot be changed this way", async () => {
      const { owner, org, memberMembership } = await seedOrgWithOwnerAndMember("CS_MANAGER");
      await expect(
        changeMemberRole({ organizationId: org.id, membershipId: memberMembership.id, newRole: "OWNER", actingUserId: owner.id, actingRole: "OWNER" })
      ).rejects.toThrow(MembershipError);
    });

    it("the owner's own role can never be changed through this function", async () => {
      const { owner, org } = await seedOrgWithOwnerAndMember("CS_MANAGER");
      const ownerMembership = await testDb.membership.findFirstOrThrow({ where: { organizationId: org.id, userId: owner.id } });

      await expect(
        changeMemberRole({ organizationId: org.id, membershipId: ownerMembership.id, newRole: "ADMINISTRATOR", actingUserId: owner.id, actingRole: "OWNER" })
      ).rejects.toThrow(/owner's role cannot be changed/);
    });

    it("cannot change a membership belonging to a different organization", async () => {
      const { org } = await seedOrgWithOwnerAndMember("CS_MANAGER");
      const otherOrgOwner = await testDb.user.create({ data: { name: "Other", email: "other@membership-test.local", passwordHash: "x" } });
      const otherOrg = await testDb.organization.create({
        data: { name: "Other Org", slug: "other-org", memberships: { create: { userId: otherOrgOwner.id, role: "OWNER" } } },
      });
      const otherMembership = await testDb.membership.findFirstOrThrow({ where: { organizationId: otherOrg.id } });

      await expect(
        changeMemberRole({ organizationId: org.id, membershipId: otherMembership.id, newRole: "VIEWER", actingUserId: "x", actingRole: "OWNER" })
      ).rejects.toThrow(/not found/);
    });
  });

  describe("removeMember", () => {
    it("an owner can remove a regular member, and it is audited", async () => {
      const { owner, org, member, memberMembership } = await seedOrgWithOwnerAndMember("CS_MANAGER");

      const result = await removeMember({ organizationId: org.id, membershipId: memberMembership.id, actingUserId: owner.id, actingRole: "OWNER" });
      expect(result.removedUserId).toBe(member.id);

      const remaining = await testDb.membership.findUnique({ where: { id: memberMembership.id } });
      expect(remaining).toBeNull();

      const events = await testDb.auditEvent.findMany({ where: { organizationId: org.id, eventType: "user_removed" } });
      expect(events).toHaveLength(1);
    });

    it("removal takes effect immediately — the membership row is gone", async () => {
      const { owner, org, member, memberMembership } = await seedOrgWithOwnerAndMember("VIEWER");
      await removeMember({ organizationId: org.id, membershipId: memberMembership.id, actingUserId: owner.id, actingRole: "OWNER" });

      const stillMember = await testDb.membership.findFirst({ where: { userId: member.id, organizationId: org.id } });
      expect(stillMember).toBeNull();
    });

    it("an owner cannot remove the final owner", async () => {
      const { owner, org } = await seedOrgWithOwnerAndMember("CS_MANAGER");
      const ownerMembership = await testDb.membership.findFirstOrThrow({ where: { organizationId: org.id, userId: owner.id } });

      await expect(
        removeMember({ organizationId: org.id, membershipId: ownerMembership.id, actingUserId: owner.id, actingRole: "OWNER" })
      ).rejects.toThrow(/at least one owner/);
    });

    it("an administrator cannot remove an owner, even when a second owner exists", async () => {
      const { owner, org } = await seedOrgWithOwnerAndMember("CS_MANAGER");
      const secondOwner = await testDb.user.create({ data: { name: "Second Owner", email: "second-owner@membership-test.local", passwordHash: "x" } });
      await testDb.membership.create({ data: { userId: secondOwner.id, organizationId: org.id, role: "OWNER" } });
      const ownerMembership = await testDb.membership.findFirstOrThrow({ where: { organizationId: org.id, userId: owner.id } });

      const admin = await testDb.user.create({ data: { name: "Admin", email: "admin@membership-test.local", passwordHash: "x" } });
      await testDb.membership.create({ data: { userId: admin.id, organizationId: org.id, role: "ADMINISTRATOR" } });

      await expect(
        removeMember({ organizationId: org.id, membershipId: ownerMembership.id, actingUserId: admin.id, actingRole: "ADMINISTRATOR" })
      ).rejects.toThrow(/Only an owner can remove another owner/);
    });

    it("an owner can remove a second owner when more than one owner exists", async () => {
      const { owner, org } = await seedOrgWithOwnerAndMember("CS_MANAGER");
      const secondOwner = await testDb.user.create({ data: { name: "Second Owner", email: "second-owner-2@membership-test.local", passwordHash: "x" } });
      const secondOwnerMembership = await testDb.membership.create({ data: { userId: secondOwner.id, organizationId: org.id, role: "OWNER" } });

      const result = await removeMember({ organizationId: org.id, membershipId: secondOwnerMembership.id, actingUserId: owner.id, actingRole: "OWNER" });
      expect(result.removedUserId).toBe(secondOwner.id);
    });

    it("a Customer Success Manager cannot remove members", async () => {
      const { org, memberMembership } = await seedOrgWithOwnerAndMember("VIEWER");
      await expect(
        removeMember({ organizationId: org.id, membershipId: memberMembership.id, actingUserId: "irrelevant", actingRole: "CS_MANAGER" })
      ).rejects.toThrow(/not permitted/);
    });
  });
});

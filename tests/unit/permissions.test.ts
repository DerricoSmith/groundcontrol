import { describe, expect, it } from "vitest";
import { can, assertCan } from "@/lib/auth/permissions";
import type { Role } from "@prisma/client";

const ALL_ROLES: Role[] = [
  "OWNER",
  "ADMINISTRATOR",
  "EXECUTIVE",
  "CS_LEADER",
  "CS_MANAGER",
  "ANALYST",
  "VIEWER",
  "SIGNAL_STATE_CONSULTANT",
];

describe("permission matrix", () => {
  it("every role can view the portfolio", () => {
    for (const role of ALL_ROLES) {
      expect(can(role, "view_portfolio")).toBe(true);
    }
  });

  it("a viewer cannot perform administrator-level actions", () => {
    expect(can("VIEWER", "edit_account_data")).toBe(false);
    expect(can("VIEWER", "manage_actions")).toBe(false);
    expect(can("VIEWER", "invite_members")).toBe(false);
    expect(can("VIEWER", "change_member_roles")).toBe(false);
    expect(can("VIEWER", "delete_organization")).toBe(false);
    expect(can("VIEWER", "manage_integrations")).toBe(false);
    expect(can("VIEWER", "edit_health_model")).toBe(false);
  });

  it("a Customer Success Manager cannot change organization ownership settings", () => {
    expect(can("CS_MANAGER", "change_member_roles")).toBe(false);
    expect(can("CS_MANAGER", "delete_organization")).toBe(false);
    expect(can("CS_MANAGER", "invite_members")).toBe(false);
  });

  it("a Customer Success Manager can still do frontline account work", () => {
    expect(can("CS_MANAGER", "edit_account_data")).toBe(true);
    expect(can("CS_MANAGER", "manage_actions")).toBe(true);
    expect(can("CS_MANAGER", "override_health_score")).toBe(true);
  });

  it("only the owner can delete the organization", () => {
    for (const role of ALL_ROLES) {
      expect(can(role, "delete_organization")).toBe(role === "OWNER");
    }
  });

  it("only owner and administrator can invite members or change roles", () => {
    for (const role of ALL_ROLES) {
      const expected = role === "OWNER" || role === "ADMINISTRATOR";
      expect(can(role, "invite_members")).toBe(expected);
      expect(can(role, "change_member_roles")).toBe(expected);
    }
  });

  it("only the consultant role can access the consultant workspace", () => {
    for (const role of ALL_ROLES) {
      expect(can(role, "access_consultant_workspace")).toBe(role === "SIGNAL_STATE_CONSULTANT");
    }
  });

  it("external communication approval is limited to leadership roles", () => {
    expect(can("OWNER", "approve_external_communication")).toBe(true);
    expect(can("ADMINISTRATOR", "approve_external_communication")).toBe(true);
    expect(can("EXECUTIVE", "approve_external_communication")).toBe(true);
    expect(can("CS_LEADER", "approve_external_communication")).toBe(true);
    expect(can("CS_MANAGER", "approve_external_communication")).toBe(false);
    expect(can("ANALYST", "approve_external_communication")).toBe(false);
    expect(can("VIEWER", "approve_external_communication")).toBe(false);
  });

  describe("assertCan", () => {
    it("does not throw when the role is permitted", () => {
      expect(() => assertCan("OWNER", "delete_organization")).not.toThrow();
    });

    it("throws when the role is not permitted", () => {
      expect(() => assertCan("VIEWER", "delete_organization")).toThrow(/not permitted/);
      expect(() => assertCan("ANALYST", "invite_members")).toThrow(/not permitted/);
    });
  });
});

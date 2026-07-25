import type { Role } from "@prisma/client";

/**
 * Single source of truth for the permission matrix documented in
 * SECURITY.md. UI uses this to decide what to show; every mutating service
 * function re-checks it server-side — the UI check is a convenience, never
 * the actual security boundary.
 */
export type Capability =
  | "view_portfolio"
  | "edit_account_data"
  | "manage_actions"
  | "approve_external_communication"
  | "edit_health_model"
  | "override_health_score"
  | "manage_executive_brief"
  | "invite_members"
  | "change_member_roles"
  | "manage_integrations"
  | "delete_organization"
  | "view_audit_log"
  | "access_consultant_workspace"
  | "manage_onboarding";

const MATRIX: Record<Capability, Role[]> = {
  view_portfolio: ["OWNER", "ADMINISTRATOR", "EXECUTIVE", "CS_LEADER", "CS_MANAGER", "ANALYST", "VIEWER", "SIGNAL_STATE_CONSULTANT"],
  edit_account_data: ["OWNER", "ADMINISTRATOR", "CS_LEADER", "CS_MANAGER", "SIGNAL_STATE_CONSULTANT"],
  manage_actions: ["OWNER", "ADMINISTRATOR", "CS_LEADER", "CS_MANAGER", "SIGNAL_STATE_CONSULTANT"],
  approve_external_communication: ["OWNER", "ADMINISTRATOR", "EXECUTIVE", "CS_LEADER"],
  edit_health_model: ["OWNER", "ADMINISTRATOR", "CS_LEADER", "SIGNAL_STATE_CONSULTANT"],
  override_health_score: ["OWNER", "ADMINISTRATOR", "CS_LEADER", "CS_MANAGER", "SIGNAL_STATE_CONSULTANT"],
  manage_executive_brief: ["OWNER", "ADMINISTRATOR", "EXECUTIVE", "CS_LEADER"],
  invite_members: ["OWNER", "ADMINISTRATOR"],
  change_member_roles: ["OWNER", "ADMINISTRATOR"],
  manage_integrations: ["OWNER", "ADMINISTRATOR", "SIGNAL_STATE_CONSULTANT"],
  delete_organization: ["OWNER"],
  view_audit_log: ["OWNER", "ADMINISTRATOR", "EXECUTIVE", "CS_LEADER", "SIGNAL_STATE_CONSULTANT"],
  access_consultant_workspace: ["SIGNAL_STATE_CONSULTANT"],
  manage_onboarding: ["OWNER", "ADMINISTRATOR", "SIGNAL_STATE_CONSULTANT"],
};

export function can(role: Role, capability: Capability): boolean {
  return MATRIX[capability].includes(role);
}

/** Throws if the role cannot perform the capability — for use at the top of service functions. */
export function assertCan(role: Role, capability: Capability): void {
  if (!can(role, capability)) {
    throw new Error(`Role ${role} is not permitted to ${capability}`);
  }
}

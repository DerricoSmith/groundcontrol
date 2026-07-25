"use server";

import { revalidatePath } from "next/cache";
import { getCurrentMembership } from "@/lib/auth/session";
import {
  acceptInvitation,
  createInvitation,
  InvitationError,
  resendInvitation,
  revokeInvitation,
} from "@/lib/services/invitation-service";
import type { Role } from "@prisma/client";

export interface InviteFormState {
  error?: string;
  success?: string;
  inviteLink?: string;
}

const ROLE_VALUES: Role[] = [
  "OWNER",
  "ADMINISTRATOR",
  "EXECUTIVE",
  "CS_LEADER",
  "CS_MANAGER",
  "ANALYST",
  "VIEWER",
  "SIGNAL_STATE_CONSULTANT",
];

function buildInviteLink(token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}/invite/accept?token=${token}`;
}

export async function inviteMemberAction(_prevState: InviteFormState, formData: FormData): Promise<InviteFormState> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "You must be logged in." };

  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "") as Role;

  if (!email) return { error: "Enter an email address." };
  if (!ROLE_VALUES.includes(role)) return { error: "Choose a valid role." };

  try {
    const invitation = await createInvitation({
      organizationId: membership.organizationId,
      invitedByUserId: membership.userId,
      invitedByRole: membership.role,
      email,
      role,
    });
    revalidatePath("/organization/members");
    return {
      success: `Invitation created for ${invitation.email}.`,
      inviteLink: buildInviteLink(invitation.token),
    };
  } catch (error) {
    if (error instanceof InvitationError || error instanceof Error) return { error: error.message };
    throw error;
  }
}

export async function revokeInvitationAction(invitationId: string): Promise<{ error?: string }> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "You must be logged in." };

  try {
    await revokeInvitation({
      organizationId: membership.organizationId,
      invitationId,
      actingUserId: membership.userId,
      actingRole: membership.role,
    });
    revalidatePath("/organization/members");
    return {};
  } catch (error) {
    if (error instanceof InvitationError || error instanceof Error) return { error: error.message };
    throw error;
  }
}

export async function resendInvitationAction(invitationId: string): Promise<{ error?: string; inviteLink?: string }> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "You must be logged in." };

  try {
    const invitation = await resendInvitation({
      organizationId: membership.organizationId,
      invitationId,
      actingUserId: membership.userId,
      actingRole: membership.role,
    });
    revalidatePath("/organization/members");
    return { inviteLink: buildInviteLink(invitation.token) };
  } catch (error) {
    if (error instanceof InvitationError || error instanceof Error) return { error: error.message };
    throw error;
  }
}

export interface AcceptInviteFormState {
  error?: string;
  success?: boolean;
}

export async function acceptInvitationAction(
  _prevState: AcceptInviteFormState,
  formData: FormData
): Promise<AcceptInviteFormState> {
  const membership = await getCurrentMembership();
  if (!membership) return { error: "You must be logged in with the invited email address to accept this invitation." };

  const token = String(formData.get("token") ?? "");
  if (!token) return { error: "Missing invitation token." };

  try {
    await acceptInvitation({
      token,
      acceptingUserId: membership.userId,
      acceptingUserEmail: membership.userEmail,
    });
    return { success: true };
  } catch (error) {
    if (error instanceof InvitationError || error instanceof Error) return { error: error.message };
    throw error;
  }
}

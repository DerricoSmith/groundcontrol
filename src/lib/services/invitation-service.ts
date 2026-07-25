import "server-only";
import { randomBytes } from "node:crypto";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assertCan } from "@/lib/auth/permissions";
import { recordAuditEvent } from "@/lib/services/audit-service";

const INVITATION_TTL_DAYS = 7;

function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export class InvitationError extends Error {}

export interface CreateInvitationParams {
  organizationId: string;
  invitedByUserId: string;
  invitedByRole: Role;
  email: string;
  role: Role;
}

/**
 * Creates a new pending invitation, superseding (revoking) any existing
 * pending invitation for the same email in the same organization so a
 * given inbox never has two live tokens for one org — see resendInvitation
 * for the "regenerate the same invite" path, which is preferred over this
 * when one already exists.
 */
export async function createInvitation(params: CreateInvitationParams) {
  assertCan(params.invitedByRole, "invite_members");
  const email = normalizeEmail(params.email);

  await prisma.organizationInvitation.updateMany({
    where: { organizationId: params.organizationId, email, status: "PENDING" },
    data: { status: "REVOKED", revokedAt: new Date() },
  });

  const invitation = await prisma.organizationInvitation.create({
    data: {
      organizationId: params.organizationId,
      email,
      role: params.role,
      token: generateToken(),
      invitedById: params.invitedByUserId,
      expiresAt: new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000),
    },
  });

  await recordAuditEvent({
    organizationId: params.organizationId,
    actorUserId: params.invitedByUserId,
    eventType: "user_invited",
    targetType: "OrganizationInvitation",
    targetId: invitation.id,
    metadata: { email, role: params.role },
  });

  return invitation;
}

export async function listPendingInvitations(organizationId: string) {
  return prisma.organizationInvitation.findMany({
    where: { organizationId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
}

export interface RevokeInvitationParams {
  organizationId: string;
  invitationId: string;
  actingUserId: string;
  actingRole: Role;
}

export async function revokeInvitation(params: RevokeInvitationParams) {
  assertCan(params.actingRole, "invite_members");

  const invitation = await prisma.organizationInvitation.findFirst({
    where: { id: params.invitationId, organizationId: params.organizationId },
  });
  if (!invitation) throw new InvitationError("Invitation not found.");
  if (invitation.status !== "PENDING") throw new InvitationError("Only a pending invitation can be revoked.");

  const revoked = await prisma.organizationInvitation.update({
    where: { id: invitation.id },
    data: { status: "REVOKED", revokedAt: new Date() },
  });

  await recordAuditEvent({
    organizationId: params.organizationId,
    actorUserId: params.actingUserId,
    eventType: "invitation_revoked",
    targetType: "OrganizationInvitation",
    targetId: invitation.id,
    metadata: { email: invitation.email },
  });

  return revoked;
}

export interface ResendInvitationParams {
  organizationId: string;
  invitationId: string;
  actingUserId: string;
  actingRole: Role;
}

/** Issues a fresh token and expiry for an existing pending invitation — the old token stops working immediately. */
export async function resendInvitation(params: ResendInvitationParams) {
  assertCan(params.actingRole, "invite_members");

  const invitation = await prisma.organizationInvitation.findFirst({
    where: { id: params.invitationId, organizationId: params.organizationId },
  });
  if (!invitation) throw new InvitationError("Invitation not found.");
  if (invitation.status !== "PENDING") throw new InvitationError("Only a pending invitation can be resent.");

  const updated = await prisma.organizationInvitation.update({
    where: { id: invitation.id },
    data: {
      token: generateToken(),
      expiresAt: new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000),
    },
  });

  await recordAuditEvent({
    organizationId: params.organizationId,
    actorUserId: params.actingUserId,
    eventType: "invitation_resent",
    targetType: "OrganizationInvitation",
    targetId: invitation.id,
    metadata: { email: invitation.email },
  });

  return updated;
}

export interface AcceptInvitationParams {
  token: string;
  acceptingUserId: string;
  acceptingUserEmail: string;
}

/**
 * Accepts an invitation and creates the resulting Membership. Every failure
 * mode is a distinct, explicit check — in particular, an invitation can
 * only ever be accepted by the account whose email matches the invitation
 * (case-insensitively), never merely by whoever holds the token.
 */
export async function acceptInvitation(params: AcceptInvitationParams) {
  const invitation = await prisma.organizationInvitation.findUnique({ where: { token: params.token } });
  if (!invitation) throw new InvitationError("This invitation link is invalid.");
  if (invitation.status === "REVOKED") throw new InvitationError("This invitation has been revoked.");
  if (invitation.status === "ACCEPTED") throw new InvitationError("This invitation has already been used.");
  if (invitation.status === "EXPIRED" || invitation.expiresAt < new Date()) {
    if (invitation.status === "PENDING") {
      await prisma.organizationInvitation.update({ where: { id: invitation.id }, data: { status: "EXPIRED" } });
    }
    throw new InvitationError("This invitation has expired. Ask an administrator to resend it.");
  }
  if (normalizeEmail(params.acceptingUserEmail) !== invitation.email) {
    throw new InvitationError("This invitation was sent to a different email address.");
  }

  const existingMembership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId: params.acceptingUserId, organizationId: invitation.organizationId } },
  });
  if (existingMembership) {
    throw new InvitationError("You are already a member of this organization.");
  }

  const [membership] = await prisma.$transaction([
    prisma.membership.create({
      data: { userId: params.acceptingUserId, organizationId: invitation.organizationId, role: invitation.role },
    }),
    prisma.organizationInvitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED", acceptedAt: new Date(), acceptedById: params.acceptingUserId },
    }),
  ]);

  await recordAuditEvent({
    organizationId: invitation.organizationId,
    actorUserId: params.acceptingUserId,
    eventType: "invitation_accepted",
    targetType: "OrganizationInvitation",
    targetId: invitation.id,
    metadata: { email: invitation.email, role: invitation.role },
  });

  return membership;
}

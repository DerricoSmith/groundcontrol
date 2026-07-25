"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { recordAuditEvent } from "@/lib/services/audit-service";
import { createOrganizationForNewUser } from "@/lib/services/organization-service";
import { ACTIVE_ORG_COOKIE } from "@/lib/auth/session";

export interface CreateOrganizationFormState {
  error?: string;
}

/**
 * Creates an additional organization for an already-signed-in user, who
 * becomes its OWNER — the same underlying operation as signup's initial
 * organization, just triggered from inside the app instead of the signup
 * form. Immediately switches the caller's active organization to the new
 * one.
 */
export async function createAdditionalOrganizationAction(
  _prevState: CreateOrganizationFormState,
  formData: FormData
): Promise<CreateOrganizationFormState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const organizationName = String(formData.get("organizationName") ?? "").trim();
  if (!organizationName) return { error: "Enter an organization name." };

  const organization = await createOrganizationForNewUser({ userId: session.user.id, organizationName });

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, organization.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  redirect("/mission-control");
}

/**
 * Switches the signed-in user's active organization. The target org id is
 * client-supplied (it came from a <select> in the switcher), so it is
 * re-validated against a real Membership row before the cookie is ever
 * set — this is the only thing that makes it safe to trust client input
 * here. The cookie itself is httpOnly, so no client script can set or read
 * it directly; only this server action can.
 */
export async function switchOrganizationAction(targetOrganizationId: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: targetOrganizationId } },
  });
  if (!membership) {
    return { error: "You do not have access to that organization." };
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, targetOrganizationId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  await recordAuditEvent({
    organizationId: targetOrganizationId,
    actorUserId: session.user.id,
    eventType: "organization_switched",
    targetType: "Organization",
    targetId: targetOrganizationId,
  });

  redirect("/mission-control");
}

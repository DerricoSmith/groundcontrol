import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/dashboard/page-header";
import { MembersClient } from "./members-client";

export default async function OrganizationMembersPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const [members, pendingInvitations] = await Promise.all([
    prisma.membership.findMany({
      where: { organizationId: membership.organizationId },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.organizationInvitation.findMany({
      where: { organizationId: membership.organizationId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow={membership.organizationName}
        title="Team"
        description="Members and pending invitations for this organization."
      />
      <MembersClient
        canInvite={can(membership.role, "invite_members")}
        canManageMembers={can(membership.role, "change_member_roles")}
        members={members.map((m) => ({
          id: m.id,
          userName: m.user.name,
          userEmail: m.user.email,
          role: m.role,
          isCurrentUser: m.userId === membership.userId,
          memberSince: m.createdAt.toISOString(),
          lastChanged: m.updatedAt.toISOString(),
        }))}
        pendingInvitations={pendingInvitations.map((i) => ({
          id: i.id,
          email: i.email,
          role: i.role,
          expiresAt: i.expiresAt.toISOString(),
          createdAt: i.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}

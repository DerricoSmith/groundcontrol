"use client";

import * as React from "react";
import { useActionState, useTransition } from "react";
import { toast } from "sonner";
import { Copy, Mail, X, RotateCw, UserX } from "lucide-react";
import { SurfaceCard, CardTitle } from "@/components/dashboard/surface-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  inviteMemberAction,
  resendInvitationAction,
  revokeInvitationAction,
  type InviteFormState,
} from "@/lib/actions/invitation-actions";
import { changeMemberRoleAction, removeMemberAction } from "@/lib/actions/membership-actions";
import type { Role } from "@prisma/client";

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: "ADMINISTRATOR", label: "Administrator" },
  { value: "EXECUTIVE", label: "Executive" },
  { value: "CS_LEADER", label: "CS Leader" },
  { value: "CS_MANAGER", label: "CS Manager" },
  { value: "ANALYST", label: "Analyst" },
  { value: "VIEWER", label: "Viewer" },
];

function roleLabel(role: string): string {
  return role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

interface Member {
  id: string;
  userName: string;
  userEmail: string;
  role: string;
  isCurrentUser: boolean;
  memberSince: string;
  lastChanged: string;
}

interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  createdAt: string;
}

const initialInviteState: InviteFormState = {};

function MemberRow({ member, canManageMembers }: { member: Member; canManageMembers: boolean }) {
  const [isPending, startTransition] = useTransition();
  const isOwner = member.role === "OWNER";
  const editable = canManageMembers && !isOwner && !member.isCurrentUser;

  function handleRoleChange(newRole: string) {
    startTransition(async () => {
      const result = await changeMemberRoleAction(member.id, newRole as Role);
      if (result.error) toast(result.error);
      else toast(`${member.userName}'s role is now ${roleLabel(newRole)}.`);
    });
  }

  function handleRemove() {
    if (!window.confirm(`Remove ${member.userName} from this organization? They will lose access immediately.`)) return;
    startTransition(async () => {
      const result = await removeMemberAction(member.id);
      if (result.error) toast(result.error);
      else toast(`${member.userName} was removed.`);
    });
  }

  return (
    <TableRow>
      <TableCell className="font-medium text-text-primary">
        {member.userName} {member.isCurrentUser && <span className="text-text-muted">(you)</span>}
      </TableCell>
      <TableCell className="text-text-secondary">{member.userEmail}</TableCell>
      <TableCell>
        {editable ? (
          <select
            defaultValue={member.role}
            disabled={isPending}
            onChange={(e) => handleRoleChange(e.target.value)}
            className="h-8 rounded-lg border border-border bg-surface px-2 text-[13px] text-text-primary disabled:opacity-60"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <Badge variant="outline">{roleLabel(member.role)}</Badge>
        )}
      </TableCell>
      <TableCell className="text-text-muted">{new Date(member.memberSince).toLocaleDateString()}</TableCell>
      <TableCell className="text-right">
        {editable ? (
          <Button type="button" size="sm" variant="ghost" disabled={isPending} onClick={handleRemove} aria-label={`Remove ${member.userName}`}>
            <UserX className="h-3.5 w-3.5 text-danger" />
          </Button>
        ) : isOwner ? (
          <span className="text-[12px] text-text-muted">Owner — protected</span>
        ) : member.isCurrentUser ? (
          <span className="text-[12px] text-text-muted">This is you</span>
        ) : null}
      </TableCell>
    </TableRow>
  );
}

export function MembersClient({
  canInvite,
  canManageMembers,
  members,
  pendingInvitations,
}: {
  canInvite: boolean;
  canManageMembers: boolean;
  members: Member[];
  pendingInvitations: PendingInvitation[];
}) {
  const [inviteState, inviteFormAction, invitePending] = useActionState(inviteMemberAction, initialInviteState);
  const [isPending, startTransition] = useTransition();
  const [resentLink, setResentLink] = React.useState<string | undefined>(undefined);
  const devLink = resentLink ?? inviteState.inviteLink;

  function copyLink(link: string) {
    navigator.clipboard.writeText(link);
    toast("Invitation link copied.");
  }

  function handleRevoke(id: string) {
    startTransition(async () => {
      const result = await revokeInvitationAction(id);
      if (result.error) toast(result.error);
      else toast("Invitation revoked.");
    });
  }

  function handleResend(id: string) {
    startTransition(async () => {
      const result = await resendInvitationAction(id);
      if (result.error) toast(result.error);
      else if (result.inviteLink) {
        setResentLink(result.inviteLink);
        toast("Invitation resent — new link generated below.");
      }
    });
  }

  return (
    <div className="space-y-6">
      {!canManageMembers && (
        <p className="text-[12.5px] text-text-muted">
          Your role ({roleLabel(members.find((m) => m.isCurrentUser)?.role ?? "")}) can view the team but can&apos;t invite, change roles, or remove members. Ask an owner or administrator.
        </p>
      )}

      {canInvite && (
        <SurfaceCard className="p-6">
          <CardTitle title="Invite a member" subtitle="They'll get the role you choose the moment they accept." />
          <form action={inviteFormAction} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="invite-email" className="mb-1.5 block text-[12.5px] font-medium text-text-secondary">
                Email
              </label>
              <Input id="invite-email" name="email" type="email" placeholder="teammate@company.com" required className="border-border bg-surface" />
            </div>
            <div>
              <label htmlFor="invite-role" className="mb-1.5 block text-[12.5px] font-medium text-text-secondary">
                Role
              </label>
              <select
                id="invite-role"
                name="role"
                defaultValue="CS_MANAGER"
                className="h-9 rounded-lg border border-border bg-surface px-2.5 text-[13.5px] text-text-primary"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" disabled={invitePending} className="bg-brand text-white hover:bg-brand-hover">
              <Mail className="mr-1.5 h-4 w-4" /> {invitePending ? "Sending…" : "Send invitation"}
            </Button>
          </form>
          {inviteState.error && <p className="mt-3 text-[13px] text-danger">{inviteState.error}</p>}
          {devLink && (
            <div className="mt-4 rounded-lg border border-warning/25 bg-warning-soft p-3">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-warning">Development mode — no email is sent</p>
              <p className="mt-1 text-[13px] text-text-secondary">
                No email provider is configured yet (see ENVIRONMENT.md). Copy this link and send it to the invitee yourself:
              </p>
              <div className="mt-2 flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-md bg-surface px-2 py-1.5 text-[12px] text-text-primary">{devLink}</code>
                <Button type="button" size="sm" variant="outline" onClick={() => copyLink(devLink)}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </SurfaceCard>
      )}

      <SurfaceCard className="p-6">
        <CardTitle title="Members" subtitle={`${members.length} member${members.length === 1 ? "" : "s"}`} />
        <Table className="mt-4">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Member since</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => (
              <MemberRow key={m.id} member={m} canManageMembers={canManageMembers} />
            ))}
          </TableBody>
        </Table>
      </SurfaceCard>

      {canManageMembers && pendingInvitations.length > 0 && (
        <SurfaceCard className="p-6">
          <CardTitle title="Pending invitations" subtitle={`${pendingInvitations.length} awaiting response`} />
          <Table className="mt-4">
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingInvitations.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="text-text-primary">{inv.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{roleLabel(inv.role)}</Badge>
                  </TableCell>
                  <TableCell className="text-text-secondary">{new Date(inv.expiresAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button type="button" size="sm" variant="ghost" disabled={isPending} onClick={() => handleResend(inv.id)} aria-label={`Resend invitation to ${inv.email}`}>
                      <RotateCw className="h-3.5 w-3.5" />
                    </Button>
                    <Button type="button" size="sm" variant="ghost" disabled={isPending} onClick={() => handleRevoke(inv.id)} aria-label={`Revoke invitation to ${inv.email}`}>
                      <X className="h-3.5 w-3.5 text-danger" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SurfaceCard>
      )}
    </div>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Check, ChevronsUpDown, Plus, Settings, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { switchOrganizationAction } from "@/lib/actions/organization-actions";
import type { AvailableOrganization } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

function roleLabel(role: string): string {
  return role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function OrgSwitcher({
  organizations,
  currentOrganizationName,
  currentRole,
}: {
  organizations: AvailableOrganization[];
  currentOrganizationName: string;
  currentRole: string;
}) {
  const [switchingTo, setSwitchingTo] = React.useState<string | null>(null);

  async function handleSwitch(organizationId: string) {
    if (switchingTo) return;
    setSwitchingTo(organizationId);
    try {
      // On success switchOrganizationAction calls redirect(), which throws
      // a Next.js-internal error that the framework intercepts to
      // navigate — that's expected and must propagate past this try/finally,
      // not be swallowed here. Only the error-object return path (invalid
      // target org) needs explicit handling.
      const result = await switchOrganizationAction(organizationId);
      if (result?.error) toast(result.error);
    } finally {
      // The Sidebar/OrgSwitcher lives in the shared (app) layout, so a
      // same-layout navigation (mission-control -> mission-control) does
      // NOT remount this component — without resetting here, switchingTo
      // would stay set forever and permanently disable every item.
      setSwitchingTo(null);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<button type="button" className="flex w-full items-center gap-2.5 rounded-lg px-1 py-1 text-left hover:bg-black/[0.03] dark:hover:bg-white/[0.04]" />}
      >
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[14px] font-semibold tracking-tight text-text-primary">{currentOrganizationName}</p>
          <p className="truncate text-[12px] text-text-muted">{roleLabel(currentRole)}</p>
        </div>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-text-muted" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Your organizations</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {organizations.map((org) => (
            <DropdownMenuItem
              key={org.organizationId}
              disabled={switchingTo !== null}
              onClick={() => !org.isActive && handleSwitch(org.organizationId)}
              className={cn("flex items-center justify-between gap-2", org.isActive && "bg-brand-soft")}
            >
              <span className="min-w-0 flex-1 truncate">
                {org.organizationName}
                <span className="ml-1.5 text-text-muted">· {roleLabel(org.role)}</span>
              </span>
              {switchingTo === org.organizationId ? (
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-text-muted" />
              ) : org.isActive ? (
                <Check className="h-3.5 w-3.5 shrink-0 text-brand" />
              ) : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link href="/organization/new" />}>
            <Plus className="h-3.5 w-3.5" /> Create organization
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/organization/members" />}>
            <Settings className="h-3.5 w-3.5" /> Organization settings
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

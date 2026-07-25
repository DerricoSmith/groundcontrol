"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { Settings, LifeBuoy, ChevronsUpDown, LogOut } from "lucide-react";
import { navItems } from "./nav-items";
import { LogoMark } from "@/components/brand/logo-mark";
import { OrgSwitcher } from "./org-switcher";
import { logoutAction } from "@/lib/actions/auth-actions";
import { cn } from "@/lib/utils";
import type { AvailableOrganization, CurrentMembership } from "@/lib/auth/session";

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase() || "U";
}

export function Sidebar({
  membership,
  availableOrganizations,
}: {
  membership: CurrentMembership | null;
  availableOrganizations: AvailableOrganization[];
}) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar lg:flex">
      <div className="flex items-center gap-2.5 px-5 pt-6 pb-4">
        <LogoMark size={30} />
        {membership ? (
          <OrgSwitcher
            organizations={availableOrganizations}
            currentOrganizationName={membership.organizationName}
            currentRole={membership.role}
          />
        ) : (
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[14px] font-semibold tracking-tight text-text-primary">Ground Control</p>
            <p className="truncate text-[12px] text-text-muted">Signal & State</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] transition-colors",
                active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-text-secondary hover:bg-black/[0.03] hover:text-text-primary dark:hover:bg-white/[0.04]"
              )}
            >
              <Icon
                className={cn("h-[18px] w-[18px] shrink-0", active ? "text-brand" : "text-text-muted group-hover:text-text-secondary")}
                strokeWidth={2}
              />
              <span className="flex-1 font-medium">{item.label}</span>
              {item.badge && (
                <span className={cn("rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums", active ? "bg-brand/15 text-brand" : "bg-black/[0.05] text-text-muted dark:bg-white/[0.06]")}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-0.5 px-3 pb-2 pt-3">
        <button
          onClick={() => toast("Help & support isn't wired up yet.")}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] text-text-secondary transition-colors hover:bg-black/[0.03] hover:text-text-primary dark:hover:bg-white/[0.04]"
        >
          <LifeBuoy className="h-[17px] w-[17px] text-text-muted" strokeWidth={2} />
          Help &amp; support
        </button>
        <button
          onClick={() => toast("Organization settings ship in a later phase — see IMPLEMENTATION_PLAN.md.")}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] text-text-secondary transition-colors hover:bg-black/[0.03] hover:text-text-primary dark:hover:bg-white/[0.04]"
        >
          <Settings className="h-[17px] w-[17px] text-text-muted" strokeWidth={2} />
          Settings
        </button>
      </div>

      <div className="border-t border-sidebar-border p-3">
        {membership ? (
          <div className="flex items-center gap-2.5 rounded-xl p-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[12px] font-semibold text-brand">
              {initialsOf(membership.userName)}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[13px] font-medium text-text-primary">{membership.userName}</p>
              <p className="truncate text-[12px] text-text-muted">{membership.role.replace(/_/g, " ").toLowerCase()}</p>
            </div>
            <button
              onClick={() => logoutAction()}
              aria-label="Sign out"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-text-muted hover:bg-black/[0.05] hover:text-text-primary dark:hover:bg-white/[0.06]"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-3 py-2.5 text-[13.5px] font-medium text-white hover:bg-brand-hover"
          >
            <ChevronsUpDown className="h-3.5 w-3.5" /> Log in
          </Link>
        )}
      </div>
    </aside>
  );
}

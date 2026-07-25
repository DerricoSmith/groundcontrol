"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { Menu, Settings, LifeBuoy, LogOut } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/brand/logo-mark";
import { navItems } from "./nav-items";
import { OrgSwitcher } from "./org-switcher";
import { logoutAction } from "@/lib/actions/auth-actions";
import { cn } from "@/lib/utils";
import type { AvailableOrganization, CurrentMembership } from "@/lib/auth/session";

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase() || "U";
}

export function MobileMenu({
  membership,
  availableOrganizations,
}: {
  membership: CurrentMembership | null;
  availableOrganizations: AvailableOrganization[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden" />}>
        <Menu className="h-5 w-5" />
        <span className="sr-only">Open menu</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] gap-0 border-border bg-surface p-0">
        <SheetHeader className="px-5 pb-2 pt-6">
          <SheetTitle className="flex items-center gap-2.5 text-left">
            <LogoMark size={26} />
            <span className="text-[14.5px] font-semibold text-text-primary">Ground Control</span>
          </SheetTitle>
        </SheetHeader>
        {membership && (
          <div className="px-4 pb-1">
            <OrgSwitcher
              organizations={availableOrganizations}
              currentOrganizationName={membership.organizationName}
              currentRole={membership.role}
            />
          </div>
        )}
        <nav className="flex-1 space-y-0.5 px-3 pt-2">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] transition-colors",
                  active ? "bg-brand-soft text-brand" : "text-text-secondary hover:bg-surface-soft hover:text-text-primary"
                )}
              >
                <Icon className={cn("h-5 w-5", active ? "text-brand" : "text-text-muted")} strokeWidth={2} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
          <div className="my-2 border-t border-border" />
          <button
            onClick={() => toast("Organization settings ship in a later phase.")}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-[15px] text-text-secondary"
          >
            <Settings className="h-5 w-5 text-text-muted" strokeWidth={2} /> Settings
          </button>
          <button
            onClick={() => toast("Help & support isn't wired up yet.")}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-[15px] text-text-secondary"
          >
            <LifeBuoy className="h-5 w-5 text-text-muted" strokeWidth={2} /> Help &amp; support
          </button>
        </nav>

        <div className="border-t border-border p-4">
          {membership ? (
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[12px] font-semibold text-brand">
                {initialsOf(membership.userName)}
              </div>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-[13px] font-medium text-text-primary">{membership.userName}</p>
                <p className="truncate text-[12px] text-text-muted">{membership.organizationName}</p>
              </div>
              <button onClick={() => logoutAction()} aria-label="Sign out" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-text-muted hover:bg-surface-soft">
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="flex w-full items-center justify-center rounded-xl bg-brand px-3 py-3 text-[14.5px] font-medium text-white hover:bg-brand-hover"
            >
              Log in
            </Link>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

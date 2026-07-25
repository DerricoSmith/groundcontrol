"use client";

import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { Bell, CloudCheck } from "lucide-react";
import { MobileMenu } from "./mobile-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { navItems } from "./nav-items";
import { logoutAction } from "@/lib/actions/auth-actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { AvailableOrganization, CurrentMembership } from "@/lib/auth/session";

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase() || "U";
}

export function Topbar({
  membership,
  availableOrganizations,
}: {
  membership: CurrentMembership | null;
  availableOrganizations: AvailableOrganization[];
}) {
  const pathname = usePathname();
  const current = navItems.find((item) => item.href === pathname);

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur-md sm:px-6 lg:px-8">
      <MobileMenu membership={membership} availableOrganizations={availableOrganizations} />

      <div className="hidden min-w-0 flex-col leading-tight lg:flex">
        <h1 className="truncate text-[15px] font-semibold tracking-tight text-text-primary">{current?.label ?? "Ground Control"}</h1>
        <p className="truncate text-[12px] text-text-muted">{current?.description ?? "Signal & State"}</p>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        {membership && (
          <div className="mr-1 hidden items-center gap-1.5 rounded-full border border-positive/25 bg-positive-soft px-2.5 py-1 text-[11.5px] font-medium text-positive md:flex">
            <CloudCheck className="h-3.5 w-3.5" strokeWidth={2} />
            Saved
          </div>
        )}

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="relative" />}>
            <Bell className="h-[18px] w-[18px]" strokeWidth={2} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="px-2 py-4 text-center text-[12.5px] text-text-muted">
                No notifications yet. New risks, overdue actions, and renewal alerts will show up here.
              </div>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {membership ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<button className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-[11.5px] font-semibold text-brand transition-transform hover:scale-105" />}
            >
              {initialsOf(membership.userName)}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal">
                  <p className="text-[13px] font-medium text-text-primary">{membership.userName}</p>
                  <p className="text-[12px] text-text-muted">{membership.userEmail}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => toast("Account settings ship in a later phase.")}>Account settings</DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast("Integrations ship in a later phase — see IMPLEMENTATION_PLAN.md.")}>
                  Integrations
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => logoutAction()}>Sign out</DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button render={<a href="/login" />} className="ml-1 bg-brand text-white hover:bg-brand-hover">
            Log in
          </Button>
        )}
      </div>
    </header>
  );
}
